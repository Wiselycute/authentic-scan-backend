const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, trim: true },
    originalName: { type: String, trim: true },
    path: { type: String, trim: true },
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
    provider: { type: String, trim: true, default: 'local' },
    mimetype: { type: String, trim: true },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const conversationMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const scanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanTitle: {
      type: String,
      trim: true,
      default: 'Untitled Scan',
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    source: {
      type: String,
      enum: ['upload', 'qr', 'barcode', 'analyze'],
      default: 'upload',
    },
    productName: {
      type: String,
      trim: true,
      default: 'Unknown Product',
      index: true,
    },
    brandName: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    codeValue: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    uploadedImage: fileSchema,
    barcode: {
      value: { type: String, trim: true, index: true },
      format: { type: String, trim: true },
      isValid: { type: Boolean, default: false },
    },
    qrCode: {
      value: { type: String, trim: true, index: true },
      format: { type: String, trim: true },
    },
    ocr: {
      text: { type: String, default: '' },
      confidence: { type: Number, default: 0 },
      engine: { type: String, default: 'unknown' },
    },
    aiAnalysis: {
      status: {
        type: String,
        enum: ['likely_authentic', 'suspicious', 'review_required', 'unverified'],
        default: 'unverified',
      },
      confidence: { type: Number, default: 0 },
      suspiciousIndicators: [{ type: String }],
      reasoning: [{ type: String }],
      recommendation: { type: String, default: '' },
      model: { type: String, default: 'gemini' },
      rawResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
      analyzedAt: { type: Date, default: Date.now },
    },
    verificationStatus: {
      type: String,
      enum: ['likely_authentic', 'suspicious', 'review_required', 'unverified'],
      default: 'unverified',
      index: true,
    },
    suspiciousIndicators: [{ type: String }],
    reasoning: [{ type: String }],
    recommendation: { type: String, default: '' },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    conversationMessages: {
      type: [conversationMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scan', scanSchema);
