const { z } = require('zod');
const Validation = require('../../utils/validations');

const reportSchema = z.object({
  scanId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid scan id').optional(),
  category: z.enum(['counterfeit', 'suspicious_listing', 'brand_mismatch', 'low_quality', 'other']),
  reason: z.string().min(3).max(500),
  description: z.string().max(2000).optional(),
  evidence: z.array(z.string().min(1)).optional(),
});

const validateReport = (req, res, next) => {
  const valid = Validation(reportSchema, req.body);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.body = valid.data;
  next();
};

module.exports = { reportSchema, validateReport };
