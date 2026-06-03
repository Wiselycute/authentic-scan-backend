const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    aliases: [{ type: String, trim: true }],
    website: { type: String, trim: true },
    country: { type: String, trim: true },
    officialDomains: [{ type: String, trim: true }],
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

brandSchema.pre('validate', function normalizeSlug(next) {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
