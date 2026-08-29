const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    Get current user's notifications
// @route   GET /api/notifications?unreadOnly=true
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, page = 1, limit = 20 } = req.query;
  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).populate('sender', 'name avatar').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  sendSuccess(res, 200, 'Notifications fetched', { notifications, unreadCount }, buildPagination(Number(page), Number(limit), total));
});

// @desc    Mark one notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  sendSuccess(res, 200, 'Marked as read', notification);
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  sendSuccess(res, 200, 'All notifications marked as read');
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
