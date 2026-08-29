const mongoose = require('mongoose');

const complaintCommentSchema = new mongoose.Schema(
  {
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 1000 },
    isStaffReply: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ComplaintComment', complaintCommentSchema);
