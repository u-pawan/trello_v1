const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const createBoard = async (req, res) => {
  const { title, description } = req.body;

  const board = await Board.create({
    title,
    description: description || '',
    owner: req.user.id,
    members: [{ user: req.user.id, role: 'admin' }],
  });

  await User.findByIdAndUpdate(req.user.id, { $push: { boards: board._id } });

  const populated = await board.populate('members.user', 'name email avatar');
  res.status(201).json(populated);
};

const getBoards = async (req, res) => {
  const boards = await Board.find({ 'members.user': req.user.id }).populate(
    'members.user',
    'name email avatar'
  );
  res.json(boards);
};

const getBoardById = async (req, res) => {
  const board = await Board.findById(req.params.id)
    .populate('members.user', 'name email avatar')
    .populate({ path: 'lists', populate: { path: 'cards' } });

  if (!board) throw new AppError('Board not found', 404);

  const isMember = board.members.some(
    (m) => m.user._id.toString() === req.user.id.toString()
  );
  if (!isMember) throw new AppError('Access denied', 403);

  res.json(board);
};

const updateBoard = async (req, res) => {
  const { title, description } = req.body;
  const board = req.board;

  if (title) board.title = title;
  if (description !== undefined) board.description = description;
  await board.save();

  const io = req.app.get('io');
  io.to(`board:${board._id}`).emit('board:updated', board);

  res.json(board);
};

const deleteBoard = async (req, res) => {
  const board = req.board;

  const lists = await List.find({ board: board._id });
  const listIds = lists.map((l) => l._id);

  await Card.deleteMany({ list: { $in: listIds } });
  await List.deleteMany({ board: board._id });
  await Board.findByIdAndDelete(board._id);
  await User.updateMany({ boards: board._id }, { $pull: { boards: board._id } });

  res.json({ message: 'Board deleted successfully' });
};

module.exports = { createBoard, getBoards, getBoardById, updateBoard, deleteBoard };
