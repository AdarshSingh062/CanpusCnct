const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  toggleBookmark,
  getSavedOpportunities,
} = require('../controllers/opportunityController');

const router = express.Router();
const canPost = authorize('faculty', 'clubadmin', 'superadmin');

router.use(protect);

router.get('/', getOpportunities);
router.post('/', canPost, createOpportunity);
router.get('/saved/me', getSavedOpportunities);
router.get('/:id', getOpportunityById);
router.put('/:id', updateOpportunity);
router.post('/:id/bookmark', toggleBookmark);

module.exports = router;
