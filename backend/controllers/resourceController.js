const asyncHandler = require('express-async-handler');
const Resource = require('../models/Resource');
const User = require('../models/User');
const logActivity = require('../utils/logActivity');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    List/search/filter/sort resources
// @route   GET /api/resources?subject=&semester=&department=&search=&sort=downloads|rating|recent
// @access  Private
const getResources = asyncHandler(async (req, res) => {
  const { subject, semester, department, search, sort = 'recent', page = 1, limit = 15 } = req.query;
  const query = {};
  if (subject) query.subject = subject;
  if (semester) query.semester = Number(semester);
  if (department) query.department = department;
  if (search) query.$text = { $search: search };

  const sortMap = { downloads: { downloads: -1 }, rating: { avgRating: -1 }, recent: { createdAt: -1 } };
  const skip = (Number(page) - 1) * Number(limit);

  const [resources, total] = await Promise.all([
    Resource.find(query)
      .populate('uploadedBy', 'name avatar role')
      .sort(sortMap[sort] || sortMap.recent)
      .skip(skip)
      .limit(Number(limit)),
    Resource.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Resources fetched', resources, buildPagination(Number(page), Number(limit), total));
});

const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id).populate('uploadedBy', 'name avatar role');
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  sendSuccess(res, 200, 'Resource fetched', resource);
});

// @desc    Upload a resource
// @route   POST /api/resources
// @access  Private
const uploadResource = asyncHandler(async (req, res) => {
  const file = req.files?.[0];
  if (!file) {
    res.status(400);
    throw new Error('A file is required');
  }
  const ext = file.originalname.split('.').pop().toLowerCase();
  const resource = await Resource.create({
    ...req.body,
    tags: req.body.tags ? String(req.body.tags).split(',').map((t) => t.trim().toLowerCase()) : [],
    uploadedBy: req.user._id,
    file: { url: file.path, publicId: file.filename, fileType: ext, sizeBytes: file.size },
  });
  await logActivity(req.user._id, 'resource_uploaded', `${req.user.name} uploaded resource "${resource.title}"`);
  sendSuccess(res, 201, 'Resource uploaded', resource);
});

// @desc    Download a resource (increments counter, returns file URL)
// @route   GET /api/resources/:id/download
// @access  Private
const downloadResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  sendSuccess(res, 200, 'Download link generated', { url: resource.file.url, downloads: resource.downloads });
});

// @desc    Rate a resource (1-5)
// @route   POST /api/resources/:id/rate
// @access  Private
const rateResource = asyncHandler(async (req, res) => {
  const { value } = req.body;
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  const existing = resource.ratings.find((r) => r.user.toString() === req.user._id.toString());
  if (existing) existing.value = value;
  else resource.ratings.push({ user: req.user._id, value });
  resource.recalculateAvgRating();
  await resource.save();
  sendSuccess(res, 200, 'Rating submitted', { avgRating: resource.avgRating });
});

// @desc    Toggle bookmark on a resource
// @route   POST /api/resources/:id/bookmark
// @access  Private
const toggleBookmark = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const idx = user.bookmarkedResources.findIndex((id) => id.toString() === req.params.id);
  let bookmarked;
  if (idx === -1) {
    user.bookmarkedResources.push(req.params.id);
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { bookmarkCount: 1 } });
    bookmarked = true;
  } else {
    user.bookmarkedResources.splice(idx, 1);
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { bookmarkCount: -1 } });
    bookmarked = false;
  }
  await user.save();
  sendSuccess(res, 200, bookmarked ? 'Bookmarked' : 'Bookmark removed', { bookmarked });
});

module.exports = { getResources, getResourceById, uploadResource, downloadResource, rateResource, toggleBookmark };
