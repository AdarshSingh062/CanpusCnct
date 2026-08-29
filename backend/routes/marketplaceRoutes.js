const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { makeUploader } = require('../middleware/uploadMiddleware');
const {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  contactSeller,
} = require('../controllers/marketplaceController');

const router = express.Router();
const uploadImages = makeUploader('marketplace', 'image', 5);

router.use(protect);

router.get('/', getItems);
router.post('/', uploadImages.array('images', 5), createItem);
router.get('/:id', getItemById);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.post('/:id/contact', contactSeller);

module.exports = router;
