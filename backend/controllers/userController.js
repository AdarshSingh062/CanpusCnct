const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logActivity = require('../utils/logActivity');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    Search / list users
// @route   GET /api/users?search=&department=&role=&page=&limit=
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  const { search = '', department, role, page = 1, limit = 20 } = req.query;
  const query = {};
  if (search) query.$text = { $search: search };
  if (department) query.department = department;
  if (role) query.role = role;

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Users fetched', users, buildPagination(Number(page), Number(limit), total));
});

// @desc    Get single user's public profile
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpire');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  sendSuccess(res, 200, 'User fetched', user);
});

// @desc    Update a user (self, or admin)
// @route   PUT /api/users/:id
// @access  Private (self or superadmin)
const updateUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }

  const isSelf = target._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'superadmin';
  if (!isSelf && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to update this user');
  }

  const editableFields = ['name', 'bio', 'department', 'semester', 'rollNumber', 'skills', 'socialLinks'];
  const adminOnlyFields = ['role', 'isActive', 'isSuspended', 'suspensionReason'];

  editableFields.forEach((f) => {
    if (req.body[f] !== undefined) target[f] = req.body[f];
  });
  if (isAdmin) {
    adminOnlyFields.forEach((f) => {
      if (req.body[f] !== undefined) target[f] = req.body[f];
    });
  }

  await target.save();

  if (isAdmin && !isSelf) {
    await logActivity(req.user._id, 'admin_updated_user', `Admin updated user ${target.email}`, {
      targetUser: target._id,
    });
  }

  sendSuccess(res, 200, 'User updated', target);
});

// @desc    Suspend / unsuspend a user
// @route   PUT /api/users/:id/suspend
// @access  Private (superadmin)
const suspendUser = asyncHandler(async (req, res) => {
  const { suspend, reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isSuspended = !!suspend;
  user.suspensionReason = suspend ? reason || 'Violation of platform policy' : '';
  await user.save();

  await logActivity(req.user._id, 'user_suspended', `${user.email} ${suspend ? 'suspended' : 'unsuspended'}`, {
    targetUser: user._id,
  });

  sendSuccess(res, 200, `User ${suspend ? 'suspended' : 'unsuspended'}`, user);
});

module.exports = { getUsers, getUserById, updateUser, suspendUser };
