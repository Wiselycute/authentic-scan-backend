const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: ['counterfeit', 'suspicious_listing', 'brand_mismatch', 'low_quality', 'other'],
      required: true,
      index: true,
    },
    reason: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    evidence: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['open', 'reviewed', 'resolved', 'rejected'],
      default: 'open',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
