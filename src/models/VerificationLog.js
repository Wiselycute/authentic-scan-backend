const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema(
  {
    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: { type: String, default: 'gemini' },
    model: { type: String, default: 'gemini-2.0-flash' },
    eventType: {
      type: String,
      enum: ['scan_upload', 'qr_scan', 'barcode_scan', 'analysis', 'report'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['likely_authentic', 'suspicious', 'review_required', 'unverified'],
      required: true,
      index: true,
    },
    confidence: { type: Number, default: 0 },
    requestPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    responsePayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VerificationLog', verificationLogSchema);
