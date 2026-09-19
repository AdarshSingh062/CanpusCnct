const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, index: true },
    semester: { type: Number, min: 1, max: 12 },
    department: { type: String, required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    file: {
      url: { type: String, required: true },
      publicId: String,
      fileType: String, // pdf, ppt, doc, image
      sizeBytes: Number,
    },
    description: { type: String, maxlength: 1000 },
    tags: [{ type: String, trim: true, lowercase: true }],
    downloads: { type: Number, default: 0 },
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        value: { type: Number, min: 1, max: 5 },
      },
    ],
    avgRating: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

resourceSchema.methods.recalculateAvgRating = function recalculateAvgRating() {
  if (!this.ratings.length) {
    this.avgRating = 0;
    return;
  }
  const sum = this.ratings.reduce((acc, r) => acc + r.value, 0);
  this.avgRating = Math.round((sum / this.ratings.length) * 10) / 10;
};

module.exports = mongoose.model('Resource', resourceSchema);
