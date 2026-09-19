const asyncHandler = require('express-async-handler');
const Opportunity = require('../models/Opportunity');
const User = require('../models/User');
const notify = require('../utils/notify');
const logActivity = require('../utils/logActivity');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    List/search/filter opportunities
// @route   GET /api/opportunities?type=&skill=&company=&search=
// @access  Private
const getOpportunities = asyncHandler(async (req, res) => {
  const { type, skill, company, search, page = 1, limit = 15 } = req.query;
  const query = { isActive: true };
  if (type) query.type = type;
  if (skill) query.skillsRequired = skill.toLowerCase();
  if (company) query.company = new RegExp(company, 'i');
  if (search) query.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [opportunities, total] = await Promise.all([
    Opportunity.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Opportunity.countDocuments(query),
  ]);
  sendSuccess(res, 200, 'Opportunities fetched', opportunities, buildPagination(Number(page), Number(limit), total));
});

const getOpportunityById = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity) {
    res.status(404);
    throw new Error('Opportunity not found');
  }
  sendSuccess(res, 200, 'Opportunity fetched', opportunity);
});

// @desc    Post an opportunity
// @route   POST /api/opportunities
// @access  Private (faculty, clubadmin, superadmin)
const createOpportunity = asyncHandler(async (req, res) => {
  const skillsRequired = req.body.skillsRequired
    ? String(req.body.skillsRequired).split(',').map((s) => s.trim().toLowerCase())
    : [];
  const opportunity = await Opportunity.create({ ...req.body, skillsRequired, postedBy: req.user._id });
  await logActivity(req.user._id, 'opportunity_posted', `${req.user.name} posted opportunity "${opportunity.title}"`);

  // Notify students whose skills match (cheap fan-out; fine at campus scale, revisit with a queue at larger scale).
  if (skillsRequired.length) {
    const interested = await User.find({ role: 'student', skills: { $in: skillsRequired } }).select('_id');
    interested.forEach((u) => {
      notify({
        recipient: u._id,
        sender: req.user._id,
        type: 'new_opportunity',
        message: `New ${opportunity.type} matching your skills: ${opportunity.title}`,
        link: `/opportunities/${opportunity._id}`,
      });
    });
  }

  sendSuccess(res, 201, 'Opportunity posted', opportunity);
});

// @desc    Update opportunity
// @route   PUT /api/opportunities/:id
// @access  Private (poster or superadmin)
const updateOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity) {
    res.status(404);
    throw new Error('Opportunity not found');
  }
  if (opportunity.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  Object.assign(opportunity, req.body);
  await opportunity.save();
  sendSuccess(res, 200, 'Opportunity updated', opportunity);
});

// @desc    Toggle bookmark
// @route   POST /api/opportunities/:id/bookmark
// @access  Private
const toggleBookmark = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const idx = user.bookmarkedOpportunities.findIndex((id) => id.toString() === req.params.id);
  let bookmarked;
  if (idx === -1) {
    user.bookmarkedOpportunities.push(req.params.id);
    bookmarked = true;
  } else {
    user.bookmarkedOpportunities.splice(idx, 1);
    bookmarked = false;
  }
  await user.save();
  sendSuccess(res, 200, bookmarked ? 'Bookmarked' : 'Bookmark removed', { bookmarked });
});

// @desc    Get current user's saved/bookmarked opportunities
// @route   GET /api/opportunities/saved/me
// @access  Private
const getSavedOpportunities = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('bookmarkedOpportunities');
  sendSuccess(res, 200, 'Saved opportunities fetched', user.bookmarkedOpportunities);
});

module.exports = {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  toggleBookmark,
  getSavedOpportunities,
};
