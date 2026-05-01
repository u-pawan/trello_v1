const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { getNotifications, markRead, markAllRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch(
  '/:id/read',
  [param('id').isMongoId().withMessage('Invalid notification ID')],
  validate,
  markRead
);

module.exports = router;
