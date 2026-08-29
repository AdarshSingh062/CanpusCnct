const mongoose = require('mongoose');

const lostFoundItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Lost', 'Found'], required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 2000 },
    category: { type: String, required: true, index: true },
    images: [{ url: String, publicId: String }],
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },
    date: { type: Date, required: true },
    contactInfo: { type: String, required: true },
    status: {
      type: String,
      enum: ['Lost', 'Found', 'Claimed', 'Resolved'],
      default: function defaultStatus() {
        return this.type;
      },
      index: true,
    },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

lostFoundItemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('LostFoundItem', lostFoundItemSchema);
