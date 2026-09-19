const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Club = require('../models/Club');
const Complaint = require('../models/Complaint');
const LostFoundItem = require('../models/LostFoundItem');
const Opportunity = require('../models/Opportunity');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    One-call payload for the student/faculty dashboard
// @route   GET /api/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    upcomingEvents,
    myComplaints,
    lostFound,
    recommendedClubs,
    latestOpportunities,
    recentPosts,
    unreadNotifications,
  ] = await Promise.all([
    Event.find({ date: { $gte: new Date() }, isCancelled: false }).sort({ date: 1 }).limit(5),
    Complaint.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5),
    LostFoundItem.find({ status: { $in: ['Lost', 'Found'] } }).sort({ createdAt: -1 }).limit(5),
    Club.find({ isActive: true, department: req.user.department }).limit(5)
      .catch(() => Club.find({ isActive: true }).sort({ memberCount: -1 }).limit(5)),
    Opportunity.find({ isActive: true }).sort({ createdAt: -1 }).limit(5),
    Post.find({ isRemoved: false }).populate('author', 'name avatar').sort({ createdAt: -1 }).limit(5),
    Notification.find({ recipient: userId, isRead: false }).sort({ createdAt: -1 }).limit(10),
  ]);

  sendSuccess(res, 200, 'Dashboard data fetched', {
    upcomingEvents,
    myComplaints,
    lostFound,
    recommendedClubs,
    latestOpportunities,
    recentPosts,
    notifications: unreadNotifications,
  });
});

module.exports = { getDashboard };
