const mongoose = require('mongoose');

// Generic polymorphic "like" record, usable for posts, comments, resources, etc.
// Post likes are also cached on Post.likes[] for fast reads; this collection
// backs analytics (e.g. "most liked content this month") via aggregation.
const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['Post', 'Comment', 'Resource'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
