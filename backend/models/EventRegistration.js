const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['registered', 'cancelled'], default: 'registered' },
  },
  { timestamps: true }
);

eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
