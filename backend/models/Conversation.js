const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date, default: Date.now },
    // Context this chat originated from, e.g. a marketplace item — optional.
    context: {
      type: { type: String, enum: ['marketplace', 'general'], default: 'general' },
      refId: { type: mongoose.Schema.Types.ObjectId },
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
