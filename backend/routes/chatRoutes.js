const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getConversations, startConversation, getMessages } = require('../controllers/chatController');

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.post('/conversations', startConversation);
router.get('/conversations/:id/messages', getMessages);

module.exports = router;
