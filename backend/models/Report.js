const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['Post', 'Comment', 'User', 'MarketplaceItem'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
    reason: { type: String, required: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'reviewed', 'actioned', 'dismissed'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
