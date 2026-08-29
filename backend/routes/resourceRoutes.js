const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { makeUploader } = require('../middleware/uploadMiddleware');
const {
  getResources,
  getResourceById,
  uploadResource,
  downloadResource,
  rateResource,
  toggleBookmark,
} = require('../controllers/resourceController');

const router = express.Router();
const uploadFile = makeUploader('resources', 'document', 1);

router.use(protect);

router.get('/', getResources);
router.post('/', uploadFile.array('file', 1), uploadResource);
router.get('/:id', getResourceById);
router.get('/:id/download', downloadResource);
router.post('/:id/rate', rateResource);
router.post('/:id/bookmark', toggleBookmark);

module.exports = router;
