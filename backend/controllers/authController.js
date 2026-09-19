const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const { sendTokenResponse } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const logActivity = require('../utils/logActivity');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, semester, rollNumber } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // Only students can self-register as 'student'; elevated roles are seeded/assigned by admins
  // in production. We allow faculty/clubadmin signup here for demo purposes but flag it.
  const allowedSelfRoles = ['student', 'faculty', 'clubadmin'];
  const finalRole = allowedSelfRoles.includes(role) ? role : 'student';

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: finalRole,
    department,
    semester,
    rollNumber,
  });

  await logActivity(user._id, 'user_registered', `${user.name} registered as ${user.role}`);

  await sendEmail({
    to: user.email,
    subject: 'Welcome to CampusConnect 🎓',
    html: `<p>Hi ${user.name},</p><p>Your CampusConnect account has been created successfully.</p>`,
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.isSuspended) {
    res.status(403);
    throw new Error('Your account has been suspended. Contact administration.');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account is deactivated.');
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  sendSuccess(res, 200, 'Logged out successfully');
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Current user fetched', req.user);
});

// @desc    Forgot password — emails a reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });

  // Always respond the same way to avoid leaking which emails are registered.
  const genericMessage = 'If an account with that email exists, a reset link has been sent.';
  if (!user) return sendSuccess(res, 200, genericMessage);

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'CampusConnect Password Reset',
    html: `<p>You requested a password reset. This link expires in 30 minutes:</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>If you didn't request this, you can ignore this email.</p>`,
  });

  sendSuccess(res, 200, genericMessage);
});

// @desc    Reset password using token from email
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, { message: 'Password reset successful' });
});

// @desc    Update own profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const fields = ['name', 'bio', 'department', 'semester', 'rollNumber', 'skills', 'socialLinks'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) req.user[f] = req.body[f];
  });
  await req.user.save();
  sendSuccess(res, 200, 'Profile updated', req.user);
});

// @desc    Deactivate own account
// @route   PUT /api/auth/deactivate
// @access  Private
const deactivateAccount = asyncHandler(async (req, res) => {
  req.user.isActive = false;
  await req.user.save();
  sendSuccess(res, 200, 'Account deactivated');
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  deactivateAccount,
};
