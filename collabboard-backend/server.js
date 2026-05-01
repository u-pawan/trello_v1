require('dotenv').config();
require('express-async-errors');

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_URL'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socket');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth.routes');
const boardRoutes = require('./routes/board.routes');
const listRoutes = require('./routes/list.routes');
const cardRoutes = require('./routes/card.routes');
const inviteRoutes = require('./routes/invite.routes');
const notificationRoutes = require('./routes/notification.routes');

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  const status = dbState === 1 ? 'ok' : 'degraded';
  res.status(dbState === 1 ? 200 : 503).json({ status, db: dbStatus });
});

app.use(errorHandler);

const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  server.close(async () => {
    await mongoose.connection.close();
    logger.info('Server and DB connections closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
