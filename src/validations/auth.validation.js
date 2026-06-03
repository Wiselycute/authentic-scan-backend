const { z } = require('zod');
const Validation = require('../../utils/validations');

const registerSchema = z
  .object({
    fullName: z.string().min(3).max(50),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Invalid password'),
    confirm_password: z.string().min(6, 'Invalid password'),
    role: z.enum(['user', 'admin']).optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Invalid password'),
});

const requestOtpSchema = z.object({
  email: z.string().email('Invalid email'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

const registerValidation = (req, res, next) => {
  const valid = Validation(registerSchema, req.body);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.body = valid.data;
  next();
};

const loginValidation = (req, res, next) => {
  const valid = Validation(loginSchema, req.body);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.body = valid.data;
  next();
};

const requestOtpValidation = (req, res, next) => {
  const valid = Validation(requestOtpSchema, req.body);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.body = valid.data;
  next();
};

const verifyOtpValidation = (req, res, next) => {
  const valid = Validation(verifyOtpSchema, req.body);
  if (!valid.isValid) {
    return res.status(400).json(valid.error);
  }

  req.body = valid.data;
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  requestOtpValidation,
  verifyOtpValidation,
};
