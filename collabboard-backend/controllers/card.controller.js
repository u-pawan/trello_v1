const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');
const Notification = require('../models/Notification');

const createCard = async (req, res) => {
  try {
    const { title, listId, boardId } = req.body;
    if (!title || !listId || !boardId) {
      return res.status(400).json({ message: 'Title, listId, and boardId are required' });
    }

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const position = list.cards.length;
    const card = await Card.create({ title, list: listId, board: boardId, position });
    await List.findByIdAndUpdate(listId, { $push: { cards: card._id } });

    // Notify all board members except actor
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

    // Emit real-time notification to each member
    notifications.forEach((notif) => {
      io.to(`user:${notif.user}`).emit('notification:new', notif);
    });

    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCards = async (req, res) => {
  try {
    const cards = await Card.find({ list: req.params.listId })
      .sort({ position: 1 })
      .populate('assignedTo', 'name email avatar');
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const allowedFields = ['title', 'description', 'dueDate', 'labels', 'position'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        card[field] = req.body[field];
      }
    });
    await card.save();

    const io = req.app.get('io');
    io.to(`board:${card.board}`).emit('card:updated', card);

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const moveCard = async (req, res) => {
  try {
    const { sourceListId, destListId, position } = req.body;
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Remove from source list
    await List.findByIdAndUpdate(sourceListId, { $pull: { cards: card._id } });
    // Add to dest list
    await List.findByIdAndUpdate(destListId, { $push: { cards: card._id } });

    card.list = destListId;
    card.position = position;
    await card.save();

    // Create notification for board members
    const board = await Board.findById(card.board);
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    await List.findByIdAndUpdate(card.list, { $pull: { cards: card._id } });
    await Card.findByIdAndDelete(card._id);

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignCard = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    if (!card.assignedTo.map((id) => id.toString()).includes(userId)) {
      card.assignedTo.push(userId);
      await card.save();
    }

    // Notify the assigned user
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCard, getCards, updateCard, moveCard, deleteCard, assignCard };
