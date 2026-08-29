const mongoose = require('mongoose');

const clubMemberSchema = new mongoose.Schema(
  {
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'removed'],
      default: 'pending',
    },
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
    requestedAt: { type: Date, default: Date.now },
    decidedAt: { type: Date },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

clubMemberSchema.index({ club: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ClubMember', clubMemberSchema);
