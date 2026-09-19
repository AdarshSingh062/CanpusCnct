const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { makeUploader } = require('../middleware/uploadMiddleware');
const {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  requestToJoin,
  decideMembership,
  removeMember,
  publishAnnouncement,
} = require('../controllers/clubController');

const router = express.Router();
const uploadLogo = makeUploader('clubs', 'image', 1);

router.use(protect);

router.get('/', getClubs);
router.post('/', authorize('clubadmin', 'superadmin'), uploadLogo.array('logo', 1), createClub);
router.get('/:id', getClubById);
router.put('/:id', updateClub);

router.post('/:id/join', requestToJoin);
router.put('/:id/members/:memberId', decideMembership);
router.delete('/:id/members/:memberId', removeMember);
router.post('/:id/announcements', publishAnnouncement);

module.exports = router;
