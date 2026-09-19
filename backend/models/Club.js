const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, maxlength: 2000 },
    logo: { url: String, publicId: String },
    facultyCoordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    category: { type: String, default: 'General' },
    socialLinks: {
      instagram: String,
      linkedin: String,
      website: String,
    },
    memberCount: { type: Number, default: 0 },
    announcements: [
      {
        title: String,
        body: String,
        postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

clubSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Club', clubSchema);
