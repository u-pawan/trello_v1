const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Board = require('../models/Board');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: no token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('join:board', async (boardId) => {
      try {
        const board = await Board.findById(boardId);
        if (!board) return;
        const isMember = board.members.some(
          (m) => m.user.toString() === socket.userId
        );
        if (isMember) socket.join(`board:${boardId}`);
      } catch {
        // silently ignore invalid board IDs
      }
    });

    socket.on('leave:board', (boardId) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on('card:move', ({ boardId, cardId, sourceListId, destListId, position }) => {
      socket.to(`board:${boardId}`).emit('card:moved', {
        cardId,
        sourceListId,
        destListId,
        position,
      });
    });

    socket.on('card:create', ({ boardId, card }) => {
      socket.to(`board:${boardId}`).emit('card:created', card);
    });

    socket.on('card:update', ({ boardId, card }) => {
      socket.to(`board:${boardId}`).emit('card:updated', card);
    });

    socket.on('list:create', ({ boardId, list }) => {
      socket.to(`board:${boardId}`).emit('list:created', list);
    });
  });

  return io;
};

module.exports = { initSocket };
