const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { makeUploader } = require('../middleware/uploadMiddleware');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  registerForEvent,
  cancelRegistration,
  getEventRegistrations,
} = require('../controllers/eventController');

const router = express.Router();
const uploadBanner = makeUploader('events', 'image', 1);
const canCreateEvents = authorize('faculty', 'clubadmin', 'superadmin');

router.use(protect);

router.get('/', getEvents);
router.post('/', canCreateEvents, uploadBanner.array('banner', 1), createEvent);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', cancelEvent);

router.post('/:id/register', registerForEvent);
router.delete('/:id/register', cancelRegistration);
router.get('/:id/registrations', getEventRegistrations);

module.exports = router;
