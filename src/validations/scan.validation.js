const { z } = require('zod');
const Validation = require('../../utils/validations');

const idSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

const analyzeSchema = z.object({
  productName: z.string().min(2).max(120).optional(),
  brandName: z.string().min(2).max(120).optional(),
  category: z.string().min(2).max(120).optional(),
  qrInput: z.string().min(1).max(512).optional(),
  barcodeInput: z.string().min(1).max(128).optional(),
  notes: z.string().max(1000).optional(),
});

const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(['likely_authentic', 'suspicious', 'review_required', 'unverified']).optional(),
  source: z.enum(['upload', 'qr', 'barcode', 'analyze']).optional(),
  search: z.string().max(120).optional(),
});

const scanIdSchema = z.object({
  scanId: idSchema,
});

const appendMessageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().trim().max(2000).optional(),
        imageUrl: z.string().trim().max(500).optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .min(1)
    .max(20),
});

const validateBody = (schema) => (req, res, next) => {
  const valid = Validation(schema, req.body);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.body = valid.data;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const valid = Validation(schema, req.query);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.query = valid.data;
  next();
};

const validateParams = (schema) => (req, res, next) => {
  const valid = Validation(schema, req.params);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.params = valid.data;
  next();
};

module.exports = {
  analyzeSchema,
  historyQuerySchema,
  scanIdSchema,
  appendMessageSchema,
  validateBody,
  validateQuery,
  validateParams,
};
