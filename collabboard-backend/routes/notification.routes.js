const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markRead,
  markAllRead,
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getNotifications);
// read-all must come before /:id/read to avoid "read-all" being treated as an id
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
