const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('actor', 'name avatar');
  res.json(notifications);
};

const markRead = async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!notification) throw new AppError('Notification not found', 404);

  notification.read = true;
  await notification.save();
  res.json(notification);
};

const markAllRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, read: false },
    { $set: { read: true } }
  );
  res.json({ message: 'All notifications marked as read' });
};

module.exports = { getNotifications, markRead, markAllRead };
