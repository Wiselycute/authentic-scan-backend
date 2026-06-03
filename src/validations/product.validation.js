const { z } = require('zod');
const Validation = require('../../utils/validations');

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

const createProductSchema = z.object({
  name: z.string().min(2).max(120),
  brand: objectIdSchema.optional(),
  category: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  barcode: z.string().max(128).optional(),
  qrCode: z.string().max(512).optional(),
  keywords: z.array(z.string().min(1).max(120)).optional(),
  referenceImages: z.array(z.string().min(1).max(2048)).optional(),
  verificationStatus: z.enum(['likely_authentic', 'suspicious', 'review_required', 'unverified']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateProductSchema = createProductSchema.partial();
const productParamsSchema = z.object({ id: objectIdSchema });

const validateCreateProduct = (req, res, next) => {
  const valid = Validation(createProductSchema, req.body);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.body = valid.data;
  next();
};

const validateUpdateProduct = (req, res, next) => {
  const valid = Validation(updateProductSchema, req.body);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.body = valid.data;
  next();
};

const validateProductParams = (req, res, next) => {
  const valid = Validation(productParamsSchema, req.params);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.params = valid.data;
  next();
};

module.exports = {
  createProductSchema,
  updateProductSchema,
  productParamsSchema,
  validateCreateProduct,
  validateUpdateProduct,
  validateProductParams,
};
