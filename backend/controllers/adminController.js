const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Complaint = require('../models/Complaint');
const MarketplaceItem = require('../models/MarketplaceItem');
const LostFoundItem = require('../models/LostFoundItem');
const Post = require('../models/Post');
const Report = require('../models/Report');
const ActivityLog = require('../models/ActivityLog');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    High-level dashboard counters
// @route   GET /api/admin/analytics/overview
// @access  Private (superadmin)
const getOverview = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalFaculty,
    totalClubs,
    totalEvents,
    totalComplaints,
    resolvedComplaints,
    marketplaceListings,
    activeUsers,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'faculty' }),
    Club.countDocuments({ isActive: true }),
    Event.countDocuments({ isCancelled: false }),
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: 'Resolved' }),
    MarketplaceItem.countDocuments({ status: 'Available' }),
    User.countDocuments({ isActive: true, isSuspended: false }),
  ]);

  sendSuccess(res, 200, 'Overview fetched', {
    totalStudents,
    totalFaculty,
    totalClubs,
    totalEvents,
    totalComplaints,
    resolvedComplaints,
    marketplaceListings,
    activeUsers,
  });
});

// @desc    User growth over time (monthly signups, last 12 months)
// @route   GET /api/admin/analytics/user-growth
// @access  Private (superadmin)
const getUserGrowth = asyncHandler(async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const data = await User.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        label: {
          $concat: [{ $toString: '$_id.year' }, '-', { $toString: '$_id.month' }],
        },
        count: 1,
      },
    },
  ]);

  sendSuccess(res, 200, 'User growth fetched', data);
});

// @desc    Complaint trends: volume + resolution rate by category
// @route   GET /api/admin/analytics/complaint-trends
// @access  Private (superadmin)
const getComplaintTrends = asyncHandler(async (req, res) => {
  const byCategory = await Complaint.aggregate([
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } },
        avgResolutionHours: {
          $avg: {
            $cond: [
              { $in: ['$status', ['Resolved', 'Closed']] },
              { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60] },
              null,
            ],
          },
        },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const byPriority = await Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);

  sendSuccess(res, 200, 'Complaint trends fetched', { byCategory, byPriority });
});

// @desc    Event registration stats by category
// @route   GET /api/admin/analytics/event-stats
// @access  Private (superadmin)
const getEventStats = asyncHandler(async (req, res) => {
  const stats = await Event.aggregate([
    {
      $group: {
        _id: '$category',
        totalEvents: { $sum: 1 },
        totalRegistrations: { $sum: '$registeredCount' },
        avgCapacityFilled: {
          $avg: { $cond: [{ $gt: ['$capacity', 0] }, { $divide: ['$registeredCount', '$capacity'] }, 0] },
        },
      },
    },
    { $sort: { totalRegistrations: -1 } },
  ]);
  sendSuccess(res, 200, 'Event stats fetched', stats);
});

// @desc    Popular post categories (by engagement)
// @route   GET /api/admin/analytics/popular-categories
// @access  Private (superadmin)
const getPopularCategories = asyncHandler(async (req, res) => {
  const stats = await Post.aggregate([
    {
      $group: {
        _id: '$category',
        postCount: { $sum: 1 },
        totalLikes: { $sum: { $size: '$likes' } },
        totalComments: { $sum: '$commentCount' },
      },
    },
    { $sort: { postCount: -1 } },
  ]);
  sendSuccess(res, 200, 'Popular categories fetched', stats);
});

// @desc    Lost & Found statistics
// @route   GET /api/admin/analytics/lost-found-stats
// @access  Private (superadmin)
const getLostFoundStats = asyncHandler(async (req, res) => {
  const stats = await LostFoundItem.aggregate([
    { $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } },
  ]);
  sendSuccess(res, 200, 'Lost & Found stats fetched', stats);
});

// @desc    Marketplace activity
// @route   GET /api/admin/analytics/marketplace-stats
// @access  Private (superadmin)
const getMarketplaceStats = asyncHandler(async (req, res) => {
  const stats = await MarketplaceItem.aggregate([
    {
      $group: {
        _id: '$category',
        totalListings: { $sum: 1 },
        sold: { $sum: { $cond: [{ $eq: ['$status', 'Sold'] }, 1, 0] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $sort: { totalListings: -1 } },
  ]);
  sendSuccess(res, 200, 'Marketplace stats fetched', stats);
});

// @desc    List reported content for moderation
// @route   GET /api/admin/reports?status=
// @access  Private (superadmin)
const getReports = asyncHandler(async (req, res) => {
  const { status = 'pending', page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const skip = (Number(page) - 1) * Number(limit);
  const [reports, total] = await Promise.all([
    Report.find(query).populate('reportedBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Report.countDocuments(query),
  ]);
  sendSuccess(res, 200, 'Reports fetched', reports, buildPagination(Number(page), Number(limit), total));
});

// @desc    Resolve a report (action taken or dismissed)
// @route   PUT /api/admin/reports/:id
// @access  Private (superadmin)
const resolveReport = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body; // 'actioned' | 'dismissed' | 'reviewed'
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status, reviewNote, reviewedBy: req.user._id },
    { new: true }
  );
  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }
  sendSuccess(res, 200, 'Report updated', report);
});

// @desc    View system activity log
// @route   GET /api/admin/activity-log
// @access  Private (superadmin)
const getActivityLog = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    ActivityLog.find().populate('user', 'name role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    ActivityLog.countDocuments(),
  ]);
  sendSuccess(res, 200, 'Activity log fetched', logs, buildPagination(Number(page), Number(limit), total));
});

module.exports = {
  getOverview,
  getUserGrowth,
  getComplaintTrends,
  getEventStats,
  getPopularCategories,
  getLostFoundStats,
  getMarketplaceStats,
  getReports,
  resolveReport,
  getActivityLog,
};
