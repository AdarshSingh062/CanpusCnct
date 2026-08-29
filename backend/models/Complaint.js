const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 3000 },
    category: {
      type: String,
      enum: ['Hostel', 'Mess', 'Electricity', 'Water', 'Wi-Fi', 'Classroom', 'Library', 'Cleanliness', 'Security', 'Other'],
      required: true,
      index: true,
    },
    images: [{ url: String, publicId: String }],
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },
    affectedCount: { type: Number, default: 1, min: 1 }, // e.g. "whole hostel" vs "one room"
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    priorityOverridden: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      default: 'Submitted',
      index: true,
    },
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

complaintSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Complaint', complaintSchema);
