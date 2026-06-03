const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    category: { type: String, trim: true, index: true },
    description: { type: String, trim: true },
    barcode: { type: String, trim: true, index: true },
    qrCode: { type: String, trim: true, index: true },
    keywords: [{ type: String, trim: true }],
    referenceImages: [{ type: String, trim: true }],
    verificationStatus: {
      type: String,
      enum: ['likely_authentic', 'suspicious', 'review_required', 'unverified'],
      default: 'unverified',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
