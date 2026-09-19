const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { makeUploader } = require('../middleware/uploadMiddleware');
const {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
  overridePriority,
  addComplaintComment,
} = require('../controllers/complaintController');

const router = express.Router();
const uploadComplaintImages = makeUploader('complaints', 'image', 4);
const staffOnly = authorize('faculty', 'superadmin');

router.use(protect);

router.get('/', getComplaints);
router.post('/', uploadComplaintImages.array('images', 4), createComplaint);
router.get('/:id', getComplaintById);
router.put('/:id/status', staffOnly, updateComplaintStatus);
router.put('/:id/priority', staffOnly, overridePriority);
router.post('/:id/comments', addComplaintComment);

module.exports = router;
