const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { makeUploader } = require('../middleware/uploadMiddleware');
const {
  getItems,
  getItemById,
  createItem,
  markAsFound,
  claimItem,
  resolveItem,
} = require('../controllers/lostFoundController');

const router = express.Router();
const uploadImages = makeUploader('lost-found', 'image', 3);

router.use(protect);

router.get('/', getItems);
router.post('/', uploadImages.array('images', 3), createItem);
router.get('/:id', getItemById);
router.put('/:id/mark-found', markAsFound);
router.put('/:id/claim', claimItem);
router.put('/:id/resolve', resolveItem);

module.exports = router;
