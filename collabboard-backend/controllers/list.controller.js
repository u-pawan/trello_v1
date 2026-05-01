const List = require('../models/List');
const Card = require('../models/Card');
const Board = require('../models/Board');

const createList = async (req, res) => {
  try {
    const { title, boardId } = req.body;
    if (!title || !boardId) {
      return res.status(400).json({ message: 'Title and boardId are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isMember = board.members.some((m) => m.user.toString() === req.user.id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const position = board.lists.length;
    const list = await List.create({ title, board: boardId, position });
    await Board.findByIdAndUpdate(boardId, { $push: { lists: list._id } });

    const io = req.app.get('io');
    io.to(`board:${boardId}`).emit('list:created', list);

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLists = async (req, res) => {
  try {
    const lists = await List.find({ board: req.params.boardId })
      .sort({ position: 1 })
      .populate('cards');
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateList = async (req, res) => {
  try {
    const { title, position } = req.body;
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    if (title) list.title = title;
    if (position !== undefined) list.position = position;
    await list.save();

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    await Card.deleteMany({ list: list._id });
    await Board.findByIdAndUpdate(list.board, { $pull: { lists: list._id } });
    await List.findByIdAndDelete(list._id);

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reorderLists = async (req, res) => {
  try {
    const { lists } = req.body;
    if (!Array.isArray(lists)) {
      return res.status(400).json({ message: 'Lists array required' });
    }

    const updates = lists.map(({ listId, position }) =>
      List.findByIdAndUpdate(listId, { position }, { new: true })
    );
    await Promise.all(updates);

    res.json({ message: 'Lists reordered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createList, getLists, updateList, deleteList, reorderLists };
