const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['Internship', 'Full-Time Job', 'Part-Time Job', 'Hackathon', 'Competition', 'Scholarship'],
      required: true,
      index: true,
    },
    description: { type: String, required: true, maxlength: 3000 },
    skillsRequired: [{ type: String, trim: true, lowercase: true, index: true }],
    location: { type: String, default: 'Remote' },
    applyLink: { type: String, required: true },
    deadline: { type: Date },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

opportunitySchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
