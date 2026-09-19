const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const {
  setIO,
  addOnlineSocket,
  removeOnlineSocket,
  isUserOnline,
  getOnlineUserIds,
} = require('./socketManager');

/**
 * Socket.IO auth middleware: expects `token` in the handshake auth payload.
 * Rejects the connection outright if the token is missing/invalid.
 */
async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id name avatar role');
    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
}

function initChatSocket(io) {
  setIO(io);
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    addOnlineSocket(userId, socket.id);

    // Join a personal room so we can target this user regardless of which tab/device.
    socket.join(userId);

    // Let everyone know this user just came online.
    socket.broadcast.emit('presence:online', { userId });
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    socket.emit('presence:list', { onlineUserIds: getOnlineUserIds() });

    // --- Join a specific conversation room ---
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // --- Send message ---
    socket.on('message:send', async ({ conversationId, text }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some((p) => p.toString() === userId)) {
          return callback?.({ success: false, message: 'Not part of this conversation' });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text,
          readBy: [userId],
        });

        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const populated = await message.populate('sender', 'name avatar');

        io.to(`conversation:${conversationId}`).emit('message:new', populated);

        // Also notify the other participant directly (in case they haven't joined the room yet).
        conversation.participants
          .filter((p) => p.toString() !== userId)
          .forEach((participantId) => {
            io.to(participantId.toString()).emit('message:notify', {
              conversationId,
              message: populated,
            });
          });

        callback?.({ success: true, message: populated });
      } catch (err) {
        callback?.({ success: false, message: err.message });
      }
    });

    // --- Typing indicator ---
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', { conversationId, userId });
    });
    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { conversationId, userId });
    });

    // --- Read receipts ---
    socket.on('message:read', async ({ conversationId }) => {
      await Message.updateMany(
        { conversation: conversationId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      socket.to(`conversation:${conversationId}`).emit('message:read', { conversationId, userId });
    });

    // --- Disconnect ---
    socket.on('disconnect', async () => {
      removeOnlineSocket(userId, socket.id);
      if (!isUserOnline(userId)) {
        socket.broadcast.emit('presence:offline', { userId, lastSeen: new Date() });
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      }
    });
  });
}

module.exports = initChatSocket;
