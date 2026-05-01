const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

const createCard = async (req, res) => {
  const { title, listId, boardId } = req.body;

  const list = await List.findById(listId);
  if (!list) throw new AppError('List not found', 404);

  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);

  const isMember = board.members.some((m) => m.user.toString() === req.user.id.toString());
  if (!isMember) throw new AppError('Access denied', 403);

  const position = list.cards.length;
  const card = await Card.create({ title, list: listId, board: boardId, position });
  await List.findByIdAndUpdate(listId, { $push: { cards: card._id } });

  const notificationPromises = board.members
    .filter((m) => m.user.toString() !== req.user.id.toString())
    .map((m) =>
      Notification.create({
        user: m.user,
        actor: req.user.id,
        type: 'card_created',
        board: boardId,
        message: `created a new card "${title}"`,
      })
    );
  const notifications = await Promise.all(notificationPromises);

  const io = req.app.get('io');
  io.to(`board:${boardId}`).emit('card:created', card);
  notifications.forEach((notif) => {
    io.to(`user:${notif.user}`).emit('notification:new', notif);
  });

  res.status(201).json(card);
};

const getCards = async (req, res) => {
  const cards = await Card.find({ list: req.params.listId })
    .sort({ position: 1 })
    .populate('assignedTo', 'name email avatar');
  res.json(cards);
};

const updateCard = async (req, res) => {
  const card = await Card.findById(req.params.id);
  if (!card) throw new AppError('Card not found', 404);

  const board = await Board.findById(card.board);
  if (!board) throw new AppError('Board not found', 404);
  const isMember = board.members.some((m) => m.user.toString() === req.user.id.toString());
  if (!isMember) throw new AppError('Access denied', 403);

  const allowedFields = ['title', 'description', 'dueDate', 'labels', 'position'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) card[field] = req.body[field];
  });
  await card.save();

  const io = req.app.get('io');
  io.to(`board:${card.board}`).emit('card:updated', card);

  res.json(card);
};

const moveCard = async (req, res) => {
  const { sourceListId, destListId, position } = req.body;

  const card = await Card.findById(req.params.id);
  if (!card) throw new AppError('Card not found', 404);

  const board = await Board.findById(card.board);
  if (!board) throw new AppError('Board not found', 404);
  const isMember = board.members.some((m) => m.user.toString() === req.user.id.toString());
  if (!isMember) throw new AppError('Access denied', 403);

  await List.findByIdAndUpdate(sourceListId, { $pull: { cards: card._id } });
  await List.findByIdAndUpdate(destListId, { $push: { cards: card._id } });

  card.list = destListId;
  card.position = position;
  await card.save();

  const notificationPromises = board.members
    .filter((m) => m.user.toString() !== req.user.id.toString())
    .map((m) =>
      Notification.create({
        user: m.user,
        actor: req.user.id,
        type: 'card_moved',
        board: card.board,
        message: `moved card "${card.title}"`,
      })
    );
  const notifications = await Promise.all(notificationPromises);

  const io = req.app.get('io');
  io.to(`board:${card.board}`).emit('card:moved', {
    cardId: card._id,
    sourceListId,
    destListId,
    position,
    card,
  });
  notifications.forEach((notif) => {
    io.to(`user:${notif.user}`).emit('notification:new', notif);
  });

  res.json(card);
};

const deleteCard = async (req, res) => {
  const card = await Card.findById(req.params.id);
  if (!card) throw new AppError('Card not found', 404);

  const board = await Board.findById(card.board);
  if (board) {
    const isMember = board.members.some((m) => m.user.toString() === req.user.id.toString());
    if (!isMember) throw new AppError('Access denied', 403);
  }

  await List.findByIdAndUpdate(card.list, { $pull: { cards: card._id } });
  await Card.findByIdAndDelete(card._id);

  res.json({ message: 'Card deleted successfully' });
};

const assignCard = async (req, res) => {
  const { userId } = req.body;

  const card = await Card.findById(req.params.id);
  if (!card) throw new AppError('Card not found', 404);

  const board = await Board.findById(card.board);
  if (!board) throw new AppError('Board not found', 404);

  const isMember = board.members.some((m) => m.user.toString() === req.user.id.toString());
  if (!isMember) throw new AppError('Access denied', 403);

  const isTargetMember = board.members.some((m) => m.user.toString() === userId);
  if (!isTargetMember) throw new AppError('User is not a board member', 400);

  if (!card.assignedTo.map((id) => id.toString()).includes(userId)) {
    card.assignedTo.push(userId);
    await card.save();
  }

  if (userId !== req.user.id.toString()) {
    const notification = await Notification.create({
      user: userId,
      actor: req.user.id,
      type: 'card_assigned',
      board: card.board,
      message: `assigned you to card "${card.title}"`,
    });
    const io = req.app.get('io');
    io.to(`user:${userId}`).emit('notification:new', notification);
  }

  const io = req.app.get('io');
  const populated = await card.populate('assignedTo', 'name email avatar');
  io.to(`board:${card.board}`).emit('card:updated', populated);

  res.json(populated);
};

module.exports = { createCard, getCards, updateCard, moveCard, deleteCard, assignCard };
