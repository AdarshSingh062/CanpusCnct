const asyncHandler = require('express-async-handler');
const MarketplaceItem = require('../models/MarketplaceItem');
const Conversation = require('../models/Conversation');
const logActivity = require('../utils/logActivity');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    List/search/filter marketplace items
// @route   GET /api/marketplace?category=&status=&minPrice=&maxPrice=&search=
// @access  Private
const getItems = asyncHandler(async (req, res) => {
  const { category, status = 'Available', minPrice, maxPrice, search, page = 1, limit = 15 } = req.query;
  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (search) query.$text = { $search: search };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    MarketplaceItem.find(query).populate('seller', 'name avatar').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    MarketplaceItem.countDocuments(query),
  ]);
  sendSuccess(res, 200, 'Items fetched', items, buildPagination(Number(page), Number(limit), total));
});

const getItemById = asyncHandler(async (req, res) => {
  const item = await MarketplaceItem.findById(req.params.id).populate('seller', 'name avatar email');
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  sendSuccess(res, 200, 'Item fetched', item);
});

// @desc    List an item for sale
// @route   POST /api/marketplace
// @access  Private
const createItem = asyncHandler(async (req, res) => {
  const images = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));
  const item = await MarketplaceItem.create({ ...req.body, images, seller: req.user._id });
  await logActivity(req.user._id, 'marketplace_listed', `${req.user.name} listed "${item.title}" for sale`);
  sendSuccess(res, 201, 'Item listed', item);
});

// @desc    Update listing status/details
// @route   PUT /api/marketplace/:id
// @access  Private (seller)
const updateItem = asyncHandler(async (req, res) => {
  const item = await MarketplaceItem.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  if (item.seller.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  Object.assign(item, req.body);
  await item.save();
  sendSuccess(res, 200, 'Item updated', item);
});

// @desc    Delete a listing
// @route   DELETE /api/marketplace/:id
// @access  Private (seller or superadmin)
const deleteItem = asyncHandler(async (req, res) => {
  const item = await MarketplaceItem.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  if (item.seller.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  await item.deleteOne();
  sendSuccess(res, 200, 'Listing removed');
});

// @desc    Start (or fetch existing) a chat with the seller about an item
// @route   POST /api/marketplace/:id/contact
// @access  Private
const contactSeller = asyncHandler(async (req, res) => {
  const item = await MarketplaceItem.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  if (item.seller.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You can't message yourself about your own listing");
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, item.seller] },
    'context.type': 'marketplace',
    'context.refId': item._id,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, item.seller],
      context: { type: 'marketplace', refId: item._id },
    });
  }

  sendSuccess(res, 200, 'Conversation ready', conversation);
});

module.exports = { getItems, getItemById, createItem, updateItem, deleteItem, contactSeller };
