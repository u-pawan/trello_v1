const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authenticate socket connections via JWT handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: no token'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join personal notification room
    socket.join(`user:${socket.userId}`);

    socket.on('join:board', (boardId) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('leave:board', (boardId) => {
      socket.leave(`board:${boardId}`);
    });

    // Client-initiated card move (for real-time broadcast to others)
    socket.on('card:move', ({ boardId, cardId, sourceListId, destListId, position }) => {
      socket.to(`board:${boardId}`).emit('card:moved', {
        cardId,
        sourceListId,
        destListId,
        position,
      });
    });

    // Client-initiated card create broadcast
    socket.on('card:create', ({ boardId, card }) => {
      socket.to(`board:${boardId}`).emit('card:created', card);
    });

    // Client-initiated card update broadcast
    socket.on('card:update', ({ boardId, card }) => {
      socket.to(`board:${boardId}`).emit('card:updated', card);
    });

    // Client-initiated list create broadcast
    socket.on('list:create', ({ boardId, list }) => {
      socket.to(`board:${boardId}`).emit('list:created', list);
    });

    // Direct notification to specific user
    socket.on('notification:new', ({ userId, notification }) => {
      io.to(`user:${userId}`).emit('notification:new', notification);
    });

    socket.on('disconnect', () => {
      // cleanup handled automatically by socket.io
    });
  });

  return io;
};

module.exports = { initSocket };
