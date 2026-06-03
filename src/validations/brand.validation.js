const { z } = require('zod');
const Validation = require('../../utils/validations');

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

const createBrandSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).optional(),
  aliases: z.array(z.string().min(1).max(120)).optional(),
  website: z.string().max(255).optional(),
  country: z.string().max(120).optional(),
  officialDomains: z.array(z.string().min(1).max(255)).optional(),
  trustScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

const updateBrandSchema = createBrandSchema.partial();
const brandParamsSchema = z.object({ id: objectIdSchema });

const validateCreateBrand = (req, res, next) => {
  const valid = Validation(createBrandSchema, req.body);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.body = valid.data;
  next();
};

const validateUpdateBrand = (req, res, next) => {
  const valid = Validation(updateBrandSchema, req.body);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.body = valid.data;
  next();
};

const validateBrandParams = (req, res, next) => {
  const valid = Validation(brandParamsSchema, req.params);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.params = valid.data;
  next();
};

module.exports = {
  createBrandSchema,
  updateBrandSchema,
  brandParamsSchema,
  validateCreateBrand,
  validateUpdateBrand,
  validateBrandParams,
};
