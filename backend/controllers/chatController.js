const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { isUserOnline } = require('../sockets/socketManager');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    List current user's conversations, most recent first
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name avatar isOnline lastSeen')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

  const withPresence = conversations.map((c) => {
    const obj = c.toObject();
    obj.participants = obj.participants.map((p) => ({ ...p, isOnline: isUserOnline(p._id.toString()) }));
    return obj;
  });

  sendSuccess(res, 200, 'Conversations fetched', withPresence);
});

// @desc    Start (or fetch existing) a 1:1 conversation with another user
// @route   POST /api/chat/conversations
// @access  Private
const startConversation = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (userId === req.user._id.toString()) {
    res.status(400);
    throw new Error("You can't start a conversation with yourself");
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId], $size: 2 },
    'context.type': 'general',
  });

  if (!conversation) {
    conversation = await Conversation.create({ participants: [req.user._id, userId] });
  }

  await conversation.populate('participants', 'name avatar isOnline');
  sendSuccess(res, 200, 'Conversation ready', conversation);
});

// @desc    Get paginated message history for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private (participant only)
const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation || !conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
    res.status(403);
    throw new Error('Not authorized to view this conversation');
  }

  const { page = 1, limit = 30 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversation._id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Message.countDocuments({ conversation: conversation._id }),
  ]);

  sendSuccess(res, 200, 'Messages fetched', messages.reverse(), buildPagination(Number(page), Number(limit), total));
});

module.exports = { getConversations, startConversation, getMessages };
