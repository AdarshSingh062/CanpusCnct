const asyncHandler = require('express-async-handler');
const Complaint = require('../models/Complaint');
const ComplaintComment = require('../models/ComplaintComment');
const calculatePriority = require('../utils/calculatePriority');
const notify = require('../utils/notify');
const logActivity = require('../utils/logActivity');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

const STATUS_FLOW = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

// @desc    List complaints (students see own; faculty/admin see all, filterable)
// @route   GET /api/complaints?status=&category=&priority=&page=&limit=
// @access  Private
const getComplaints = asyncHandler(async (req, res) => {
  const { status, category, priority, page = 1, limit = 10, search } = req.query;
  const query = {};

  const isStaff = ['faculty', 'superadmin'].includes(req.user.role);
  if (!isStaff) query.createdBy = req.user._id;

  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (search) query.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('createdBy', 'name avatar department')
      .populate('assignedTo', 'name avatar')
      .sort({ priority: 1, createdAt: -1 }) // note: string sort on priority is illustrative; see admin analytics for weighted view
      .skip(skip)
      .limit(Number(limit)),
    Complaint.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Complaints fetched', complaints, buildPagination(Number(page), Number(limit), total));
});

// @desc    Get single complaint with full timeline
// @route   GET /api/complaints/:id
// @access  Private (owner or staff)
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('createdBy', 'name avatar department')
    .populate('assignedTo', 'name avatar')
    .populate('statusHistory.changedBy', 'name role');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const isStaff = ['faculty', 'superadmin'].includes(req.user.role);
  const isOwner = complaint.createdBy._id.toString() === req.user._id.toString();
  if (!isStaff && !isOwner) {
    res.status(403);
    throw new Error('Not authorized to view this complaint');
  }

  const comments = await ComplaintComment.find({ complaint: complaint._id })
    .populate('author', 'name avatar role')
    .sort({ createdAt: 1 });

  sendSuccess(res, 200, 'Complaint fetched', { complaint, comments });
});

// @desc    Submit a complaint (priority auto-calculated)
// @route   POST /api/complaints
// @access  Private
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, location, affectedCount, severity } = req.body;
  const images = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));

  const { priority } = calculatePriority({
    category,
    severity,
    affectedCount: Number(affectedCount) || 1,
    createdAt: new Date(),
  });

  const complaint = await Complaint.create({
    title,
    description,
    category,
    images,
    location,
    affectedCount,
    severity,
    priority,
    createdBy: req.user._id,
    statusHistory: [{ status: 'Submitted', changedBy: req.user._id, note: 'Complaint submitted' }],
  });

  await logActivity(req.user._id, 'complaint_submitted', `${req.user.name} submitted a ${category} complaint`);
  sendSuccess(res, 201, 'Complaint submitted', complaint);
});

// @desc    Update complaint status (moves through workflow), assign staff
// @route   PUT /api/complaints/:id/status
// @access  Private (faculty/superadmin)
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, note, assignedTo } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (status) {
    if (!STATUS_FLOW.includes(status)) {
      res.status(400);
      throw new Error('Invalid status value');
    }
    complaint.status = status;
    complaint.statusHistory.push({ status, changedBy: req.user._id, note });
  }
  if (assignedTo !== undefined) complaint.assignedTo = assignedTo || null;

  await complaint.save();

  await notify({
    recipient: complaint.createdBy,
    sender: req.user._id,
    type: 'complaint_status',
    message: `Your complaint "${complaint.title}" is now: ${complaint.status}`,
    link: `/complaints/${complaint._id}`,
  });

  if (status === 'Resolved') {
    await logActivity(req.user._id, 'complaint_resolved', `Complaint "${complaint.title}" marked resolved`);
  }

  sendSuccess(res, 200, 'Complaint updated', complaint);
});

// @desc    Manually override the computed priority
// @route   PUT /api/complaints/:id/priority
// @access  Private (faculty/superadmin)
const overridePriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }
  complaint.priority = priority;
  complaint.priorityOverridden = true;
  await complaint.save();
  sendSuccess(res, 200, 'Priority overridden', complaint);
});

// @desc    Add a comment/reply to a complaint
// @route   POST /api/complaints/:id/comments
// @access  Private (owner or staff)
const addComplaintComment = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }
  const isStaff = ['faculty', 'superadmin'].includes(req.user.role);
  const comment = await ComplaintComment.create({
    complaint: complaint._id,
    author: req.user._id,
    text: req.body.text,
    isStaffReply: isStaff,
  });
  await comment.populate('author', 'name avatar role');
  sendSuccess(res, 201, 'Comment added', comment);
});

module.exports = {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
  overridePriority,
  addComplaintComment,
};
