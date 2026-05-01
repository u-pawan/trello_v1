const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const User = require('../models/User');

const createBoard = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const board = await Board.create({
      title,
      description: description || '',
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }],
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { boards: board._id } });

    const populated = await board.populate('members.user', 'name email avatar');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({ 'members.user': req.user.id }).populate(
      'members.user',
      'name email avatar'
    );
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate({
        path: 'lists',
        populate: { path: 'cards' },
      });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isMember = board.members.some(
      (m) => m.user._id.toString() === req.user.id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBoard = async (req, res) => {
  try {
    const { title, description } = req.body;
    const board = req.board || await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (title) board.title = title;
    if (description !== undefined) board.description = description;
    await board.save();

    const io = req.app.get('io');
    io.to(`board:${board._id}`).emit('board:updated', board);

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const board = req.board || await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const lists = await List.find({ board: board._id });
    const listIds = lists.map((l) => l._id);

    await Card.deleteMany({ list: { $in: listIds } });
    await List.deleteMany({ board: board._id });
    await Board.findByIdAndDelete(board._id);

    await User.updateMany({ boards: board._id }, { $pull: { boards: board._id } });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBoard, getBoards, getBoardById, updateBoard, deleteBoard };
