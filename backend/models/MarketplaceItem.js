const mongoose = require('mongoose');

const marketplaceItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    images: [{ url: String, publicId: String }],
    category: {
      type: String,
      enum: ['Books', 'Electronics', 'Furniture', 'Cycles', 'College Supplies', 'Other'],
      required: true,
      index: true,
    },
    condition: {
      type: String,
      enum: ['New', 'Like New', 'Good', 'Fair', 'Worn'],
      default: 'Good',
    },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },
    status: { type: String, enum: ['Available', 'Reserved', 'Sold'], default: 'Available', index: true },
    reservedFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

marketplaceItemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('MarketplaceItem', marketplaceItemSchema);
