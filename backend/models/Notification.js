const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'post_like',
        'post_comment',
        'new_message',
        'complaint_status',
        'event_registration',
        'club_membership',
        'lostfound_claim',
        'new_announcement',
        'new_opportunity',
      ],
      required: true,
    },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // frontend route to deep-link to
    isRead: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
