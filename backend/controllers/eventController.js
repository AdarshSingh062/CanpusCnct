const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const notify = require('../utils/notify');
const sendEmail = require('../utils/sendEmail');
const logActivity = require('../utils/logActivity');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    List/search/filter events
// @route   GET /api/events
// @access  Private
const getEvents = asyncHandler(async (req, res) => {
  const { category, search, upcoming, page = 1, limit = 12 } = req.query;
  const query = { isCancelled: false };
  if (category) query.category = category;
  if (search) query.$text = { $search: search };
  if (upcoming === 'true') query.date = { $gte: new Date() };

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find(query).populate('organizer', 'name avatar').populate('club', 'name logo').sort({ date: 1 }).skip(skip).limit(Number(limit)),
    Event.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Events fetched', events, buildPagination(Number(page), Number(limit), total));
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name avatar').populate('club', 'name logo');
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  sendSuccess(res, 200, 'Event fetched', event);
});

// @desc    Create an event
// @route   POST /api/events
// @access  Private (faculty, clubadmin, superadmin)
const createEvent = asyncHandler(async (req, res) => {
  const banner = req.files?.[0] ? { url: req.files[0].path, publicId: req.files[0].filename } : undefined;
  const event = await Event.create({ ...req.body, organizer: req.user._id, banner });
  await logActivity(req.user._id, 'event_created', `${req.user.name} created event "${event.title}"`);
  sendSuccess(res, 201, 'Event created', event);
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (organizer or superadmin)
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to edit this event');
  }
  Object.assign(event, req.body);
  await event.save();
  sendSuccess(res, 200, 'Event updated', event);
});

// @desc    Cancel event
// @route   DELETE /api/events/:id
// @access  Private (organizer or superadmin)
const cancelEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to cancel this event');
  }
  event.isCancelled = true;
  await event.save();
  sendSuccess(res, 200, 'Event cancelled');
});

// @desc    Register for an event (capacity-safe via atomic update)
// @route   POST /api/events/:id/register
// @access  Private
const registerForEvent = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let registration;
    await session.withTransaction(async () => {
      const event = await Event.findById(req.params.id).session(session);
      if (!event || event.isCancelled) {
        res.status(404);
        throw new Error('Event not found');
      }
      if (event.registeredCount >= event.capacity) {
        res.status(400);
        throw new Error('Event is at full capacity');
      }

      const existing = await EventRegistration.findOne({ event: event._id, user: req.user._id }).session(session);
      if (existing && existing.status === 'registered') {
        res.status(400);
        throw new Error('Already registered for this event');
      }

      if (existing) {
        existing.status = 'registered';
        await existing.save({ session });
        registration = existing;
      } else {
        registration = await EventRegistration.create([{ event: event._id, user: req.user._id }], { session }).then((r) => r[0]);
      }

      // Atomically bump only if capacity still allows (guards race conditions).
      const updated = await Event.findOneAndUpdate(
        { _id: event._id, $expr: { $lt: ['$registeredCount', '$capacity'] } },
        { $inc: { registeredCount: 1 } },
        { new: true, session }
      );
      if (!updated) {
        res.status(400);
        throw new Error('Event just reached full capacity');
      }
    });

    const event = await Event.findById(req.params.id);
    await notify({
      recipient: req.user._id,
      type: 'event_registration',
      message: `You're registered for "${event.title}"`,
      link: `/events/${event._id}`,
    });
    await sendEmail({
      to: req.user.email,
      subject: `Registered: ${event.title}`,
      html: `<p>You're confirmed for <strong>${event.title}</strong> on ${new Date(event.date).toDateString()} at ${event.venue}.</p>`,
    });

    sendSuccess(res, 201, 'Registered for event', registration);
  } finally {
    session.endSession();
  }
});

// @desc    Cancel own registration
// @route   DELETE /api/events/:id/register
// @access  Private
const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await EventRegistration.findOne({ event: req.params.id, user: req.user._id, status: 'registered' });
  if (!registration) {
    res.status(404);
    throw new Error('Registration not found');
  }
  registration.status = 'cancelled';
  await registration.save();
  await Event.findByIdAndUpdate(req.params.id, { $inc: { registeredCount: -1 } });
  sendSuccess(res, 200, 'Registration cancelled');
});

// @desc    List attendees for an event (organizer/admin only)
// @route   GET /api/events/:id/registrations
// @access  Private (organizer or superadmin)
const getEventRegistrations = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  const registrations = await EventRegistration.find({ event: event._id, status: 'registered' }).populate(
    'user',
    'name email avatar department'
  );
  sendSuccess(res, 200, 'Registrations fetched', registrations);
});

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  registerForEvent,
  cancelRegistration,
  getEventRegistrations,
};
