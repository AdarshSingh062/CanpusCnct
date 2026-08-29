const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getOverview,
  getUserGrowth,
  getComplaintTrends,
  getEventStats,
  getPopularCategories,
  getLostFoundStats,
  getMarketplaceStats,
  getReports,
  resolveReport,
  getActivityLog,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('superadmin'));

router.get('/analytics/overview', getOverview);
router.get('/analytics/user-growth', getUserGrowth);
router.get('/analytics/complaint-trends', getComplaintTrends);
router.get('/analytics/event-stats', getEventStats);
router.get('/analytics/popular-categories', getPopularCategories);
router.get('/analytics/lost-found-stats', getLostFoundStats);
router.get('/analytics/marketplace-stats', getMarketplaceStats);

router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);

router.get('/activity-log', getActivityLog);

module.exports = router;
