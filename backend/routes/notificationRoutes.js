const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
