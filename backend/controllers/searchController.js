const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Event = require('../models/Event');
const Club = require('../models/Club');
const Resource = require('../models/Resource');
const MarketplaceItem = require('../models/MarketplaceItem');
const Opportunity = require('../models/Opportunity');
const LostFoundItem = require('../models/LostFoundItem');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    Global search across all major collections (backend-side, not full-table dumps)
// @route   GET /api/search?q=&types=students,posts,events,...&limitPerType=5
// @access  Private
const globalSearch = asyncHandler(async (req, res) => {
  const { q, types, limitPerType = 5 } = req.query;
  if (!q || q.trim().length < 2) {
    res.status(400);
    throw new Error('Search query must be at least 2 characters');
  }

  const requested = types ? types.split(',') : [
    'students', 'posts', 'events', 'clubs', 'notes', 'marketplace', 'opportunities', 'lostfound',
  ];
  const n = Number(limitPerType);
  const textFilter = { $text: { $search: q } };

  const tasks = {};
  if (requested.includes('students')) tasks.students = User.find(textFilter).select('name avatar role department').limit(n);
  if (requested.includes('posts')) tasks.posts = Post.find({ ...textFilter, isRemoved: false }).select('content category author').populate('author', 'name avatar').limit(n);
  if (requested.includes('events')) tasks.events = Event.find({ ...textFilter, isCancelled: false }).select('title date venue category').limit(n);
  if (requested.includes('clubs')) tasks.clubs = Club.find({ ...textFilter, isActive: true }).select('name description logo').limit(n);
  if (requested.includes('notes')) tasks.notes = Resource.find(textFilter).select('title subject department').limit(n);
  if (requested.includes('marketplace')) tasks.marketplace = MarketplaceItem.find({ ...textFilter, status: 'Available' }).select('title price images').limit(n);
  if (requested.includes('opportunities')) tasks.opportunities = Opportunity.find({ ...textFilter, isActive: true }).select('title company type').limit(n);
  if (requested.includes('lostfound')) tasks.lostfound = LostFoundItem.find(textFilter).select('title type status category').limit(n);

  const keys = Object.keys(tasks);
  const results = await Promise.all(Object.values(tasks));
  const response = Object.fromEntries(keys.map((k, i) => [k, results[i]]));

  sendSuccess(res, 200, 'Search results', response);
});

module.exports = { globalSearch };
