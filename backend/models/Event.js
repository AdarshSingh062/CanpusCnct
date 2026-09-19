const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 3000 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    category: {
      type: String,
      enum: ['Hackathon', 'Workshop', 'Seminar', 'Sports', 'Cultural', 'Technical', 'Club', 'Placement', 'Other'],
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true },
    venue: { type: String, required: true },
    mapLocation: {
      lat: Number,
      lng: Number,
      address: String,
    },
    capacity: { type: Number, required: true, min: 1 },
    registeredCount: { type: Number, default: 0 },
    banner: { url: String, publicId: String },
    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text' });
eventSchema.virtual('seatsRemaining').get(function seatsRemaining() {
  return Math.max(this.capacity - this.registeredCount, 0);
});
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
