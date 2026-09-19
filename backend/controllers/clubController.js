const asyncHandler = require('express-async-handler');
const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');
const notify = require('../utils/notify');
const logActivity = require('../utils/logActivity');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    List/search clubs
// @route   GET /api/clubs
// @access  Private
const getClubs = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 12 } = req.query;
  const query = { isActive: true };
  if (search) query.$text = { $search: search };
  if (category) query.category = category;

  const skip = (Number(page) - 1) * Number(limit);
  const [clubs, total] = await Promise.all([
    Club.find(query).populate('facultyCoordinator', 'name avatar').skip(skip).limit(Number(limit)).sort({ memberCount: -1 }),
    Club.countDocuments(query),
  ]);
  sendSuccess(res, 200, 'Clubs fetched', clubs, buildPagination(Number(page), Number(limit), total));
});

// @desc    Get single club with members
// @route   GET /api/clubs/:id
// @access  Private
const getClubById = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id).populate('facultyCoordinator', 'name avatar').populate('admins', 'name avatar');
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  const members = await ClubMember.find({ club: club._id, status: 'approved' }).populate('user', 'name avatar department');
  sendSuccess(res, 200, 'Club fetched', { club, members });
});

// @desc    Create a club
// @route   POST /api/clubs
// @access  Private (clubadmin, superadmin)
const createClub = asyncHandler(async (req, res) => {
  const logo = req.files?.[0] ? { url: req.files[0].path, publicId: req.files[0].filename } : undefined;
  const club = await Club.create({ ...req.body, logo, admins: [req.user._id] });
  await logActivity(req.user._id, 'club_created', `${req.user.name} created club "${club.name}"`);
  sendSuccess(res, 201, 'Club created', club);
});

// @desc    Update club
// @route   PUT /api/clubs/:id
// @access  Private (club admin or superadmin)
const updateClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  const isClubAdmin = club.admins.some((a) => a.toString() === req.user._id.toString());
  if (!isClubAdmin && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to edit this club');
  }
  Object.assign(club, req.body);
  await club.save();
  sendSuccess(res, 200, 'Club updated', club);
});

// @desc    Request to join a club
// @route   POST /api/clubs/:id/join
// @access  Private
const requestToJoin = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  const existing = await ClubMember.findOne({ club: club._id, user: req.user._id });
  if (existing && existing.status !== 'removed' && existing.status !== 'rejected') {
    res.status(400);
    throw new Error(`Already ${existing.status} for this club`);
  }

  const membership = existing
    ? Object.assign(existing, { status: 'pending', requestedAt: new Date() })
    : new ClubMember({ club: club._id, user: req.user._id });
  await membership.save();

  club.admins.forEach((adminId) => {
    notify({
      recipient: adminId,
      sender: req.user._id,
      type: 'club_membership',
      message: `${req.user.name} requested to join ${club.name}`,
      link: `/clubs/${club._id}/members`,
    });
  });

  sendSuccess(res, 201, 'Membership request submitted', membership);
});

// @desc    Approve/reject a membership request
// @route   PUT /api/clubs/:id/members/:memberId
// @access  Private (club admin or superadmin)
const decideMembership = asyncHandler(async (req, res) => {
  const { decision } = req.body; // 'approved' | 'rejected'
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  const isClubAdmin = club.admins.some((a) => a.toString() === req.user._id.toString());
  if (!isClubAdmin && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const membership = await ClubMember.findById(req.params.memberId);
  if (!membership || membership.club.toString() !== club._id.toString()) {
    res.status(404);
    throw new Error('Membership request not found');
  }

  const wasApproved = membership.status === 'approved';
  membership.status = decision;
  membership.decidedAt = new Date();
  membership.decidedBy = req.user._id;
  await membership.save();

  if (decision === 'approved' && !wasApproved) {
    club.memberCount += 1;
    await club.save();
  }

  await notify({
    recipient: membership.user,
    sender: req.user._id,
    type: 'club_membership',
    message: `Your request to join ${club.name} was ${decision}`,
    link: `/clubs/${club._id}`,
  });

  sendSuccess(res, 200, `Membership ${decision}`, membership);
});

// @desc    Remove a member
// @route   DELETE /api/clubs/:id/members/:memberId
// @access  Private (club admin or superadmin)
const removeMember = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  const isClubAdmin = club.admins.some((a) => a.toString() === req.user._id.toString());
  if (!isClubAdmin && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  const membership = await ClubMember.findById(req.params.memberId);
  if (!membership) {
    res.status(404);
    throw new Error('Membership not found');
  }
  membership.status = 'removed';
  await membership.save();
  club.memberCount = Math.max(club.memberCount - 1, 0);
  await club.save();
  sendSuccess(res, 200, 'Member removed');
});

// @desc    Publish a club announcement
// @route   POST /api/clubs/:id/announcements
// @access  Private (club admin or superadmin)
const publishAnnouncement = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404);
    throw new Error('Club not found');
  }
  const isClubAdmin = club.admins.some((a) => a.toString() === req.user._id.toString());
  if (!isClubAdmin && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  const announcement = { title: req.body.title, body: req.body.body, postedBy: req.user._id };
  club.announcements.unshift(announcement);
  await club.save();

  const members = await ClubMember.find({ club: club._id, status: 'approved' });
  members.forEach((m) => {
    notify({
      recipient: m.user,
      sender: req.user._id,
      type: 'new_announcement',
      message: `New announcement in ${club.name}: ${req.body.title}`,
      link: `/clubs/${club._id}`,
    });
  });

  sendSuccess(res, 201, 'Announcement published', club.announcements[0]);
});

module.exports = {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  requestToJoin,
  decideMembership,
  removeMember,
  publishAnnouncement,
};
