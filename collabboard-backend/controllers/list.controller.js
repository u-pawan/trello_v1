const List = require('../models/List');
const Card = require('../models/Card');
const Board = require('../models/Board');
const AppError = require('../utils/AppError');

const createList = async (req, res) => {
  const { title, boardId } = req.body;

  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);

  const isMember = board.members.some((m) => m.user.toString() === req.user.id.toString());
  if (!isMember) throw new AppError('Access denied', 403);

  const position = board.lists.length;
  const list = await List.create({ title, board: boardId, position });
  await Board.findByIdAndUpdate(boardId, { $push: { lists: list._id } });

  const io = req.app.get('io');
  io.to(`board:${boardId}`).emit('list:created', list);

  res.status(201).json(list);
};

const getLists = async (req, res) => {
  const lists = await List.find({ board: req.params.boardId })
    .sort({ position: 1 })
    .populate('cards');
  res.json(lists);
};

const updateList = async (req, res) => {
  const { title, position } = req.body;
  const list = await List.findById(req.params.id);
  if (!list) throw new AppError('List not found', 404);

  if (title) list.title = title;
  if (position !== undefined) list.position = position;
  await list.save();

  res.json(list);
};

const deleteList = async (req, res) => {
  const list = await List.findById(req.params.id);
  if (!list) throw new AppError('List not found', 404);

  await Card.deleteMany({ list: list._id });
  await Board.findByIdAndUpdate(list.board, { $pull: { lists: list._id } });
  await List.findByIdAndDelete(list._id);

  res.json({ message: 'List deleted successfully' });
};

const reorderLists = async (req, res) => {
  const { lists } = req.body;

  const updates = lists.map(({ listId, position }) =>
    List.findByIdAndUpdate(listId, { position }, { new: true })
  );
  await Promise.all(updates);

  res.json({ message: 'Lists reordered successfully' });
};

module.exports = { createList, getLists, updateList, deleteList, reorderLists };
