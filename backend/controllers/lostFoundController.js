const asyncHandler = require('express-async-handler');
const LostFoundItem = require('../models/LostFoundItem');
const notify = require('../utils/notify');
const logActivity = require('../utils/logActivity');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    List/search/filter lost & found items
// @route   GET /api/lost-found?type=&category=&location=&status=&search=
// @access  Private
const getItems = asyncHandler(async (req, res) => {
  const { type, category, status, search, page = 1, limit = 12 } = req.query;
  const query = {};
  if (type) query.type = type;
  if (category) query.category = category;
  if (status) query.status = status;
  if (search) query.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    LostFoundItem.find(query).populate('createdBy', 'name avatar').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    LostFoundItem.countDocuments(query),
  ]);
  sendSuccess(res, 200, 'Items fetched', items, buildPagination(Number(page), Number(limit), total));
});

const getItemById = asyncHandler(async (req, res) => {
  const item = await LostFoundItem.findById(req.params.id).populate('createdBy', 'name avatar email');
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  sendSuccess(res, 200, 'Item fetched', item);
});

// @desc    Post a lost or found item
// @route   POST /api/lost-found
// @access  Private
const createItem = asyncHandler(async (req, res) => {
  const images = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));
  const item = await LostFoundItem.create({ ...req.body, images, createdBy: req.user._id });
  await logActivity(req.user._id, 'lostfound_posted', `${req.user.name} posted a ${item.type.toLowerCase()} item: ${item.title}`);
  sendSuccess(res, 201, `${item.type} item posted`, item);
});

// @desc    Mark item as found (for a Lost report) — updates status
// @route   PUT /api/lost-found/:id/mark-found
// @access  Private (owner)
const markAsFound = asyncHandler(async (req, res) => {
  const item = await LostFoundItem.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  if (item.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  item.status = 'Found';
  await item.save();
  sendSuccess(res, 200, 'Item marked as found', item);
});

// @desc    Claim an item (someone identifies it as theirs)
// @route   PUT /api/lost-found/:id/claim
// @access  Private
const claimItem = asyncHandler(async (req, res) => {
  const item = await LostFoundItem.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  item.status = 'Claimed';
  item.claimedBy = req.user._id;
  await item.save();

  await notify({
    recipient: item.createdBy,
    sender: req.user._id,
    type: 'lostfound_claim',
    message: `${req.user.name} claimed your ${item.type.toLowerCase()} item: ${item.title}`,
    link: `/lost-found/${item._id}`,
  });

  sendSuccess(res, 200, 'Item claimed — coordinate with the poster to resolve', item);
});

// @desc    Mark resolved (item returned to owner)
// @route   PUT /api/lost-found/:id/resolve
// @access  Private (owner)
const resolveItem = asyncHandler(async (req, res) => {
  const item = await LostFoundItem.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  if (item.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  item.status = 'Resolved';
  await item.save();
  sendSuccess(res, 200, 'Item marked resolved', item);
});

module.exports = { getItems, getItemById, createItem, markAsFound, claimItem, resolveItem };
