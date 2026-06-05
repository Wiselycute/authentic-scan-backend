const User = require('../models/User');
const EmailOtp = require('../models/EmailOtp');
const userService = require('../services/user.service');
const { hash, compare } = require('../../utils/libs/bcrypt.lib');
const { sign } = require('../../utils/libs/jwt');
const { sendMail } = require('../../utils/libs/mail.lib');
const crypto = require('crypto');

const REGISTER_OTP_PURPOSE = 'register';
const OTP_SECRET = process.env.OTP_SECRET || 'authentiscan-otp-secret';
const REGISTER_OTP_TTL_MINUTES = Number(process.env.REGISTER_OTP_TTL_MINUTES || 10);
const VERIFIED_EMAIL_TTL_MINUTES = Number(process.env.VERIFIED_EMAIL_TTL_MINUTES || 30);
const MAX_OTP_ATTEMPTS = Number(process.env.REGISTER_OTP_MAX_ATTEMPTS || 5);

const sanitizeUser = (user) => {
  if (!user) {
    return user;
  }

  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete plain.password;
  return plain;
};

const hashOtp = (otp) =>
  crypto
    .createHash('sha256')
    .update(`${otp}.${OTP_SECRET}`)
    .digest('hex');

const generateOtp = () => `${crypto.randomInt(0, 1000000)}`.padStart(6, '0');

const requestRegisterOtp = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + REGISTER_OTP_TTL_MINUTES * 60 * 1000);

    await EmailOtp.findOneAndUpdate(
      { email, purpose: REGISTER_OTP_PURPOSE },
      {
        $set: {
          otpHash: hashOtp(otp),
          expiresAt,
          verifiedAt: null,
          attempts: 0,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    const subject = 'Your AuthentiScan verification code';
    const text = `Your verification code is ${otp}. It expires in ${REGISTER_OTP_TTL_MINUTES} minutes.`;
    const html = `<p>Your verification code is <strong>${otp}</strong>.</p><p>This code expires in ${REGISTER_OTP_TTL_MINUTES} minutes.</p>`;

    const sent = await sendMail(email, subject, text, html);
    if (!sent) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

const verifyRegisterOtp = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();
    const { otp } = req.body;

    const record = await EmailOtp.findOne({ email, purpose: REGISTER_OTP_PURPOSE });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not requested for this email' });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await EmailOtp.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'OTP expired, request a new one' });
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await EmailOtp.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'Too many failed attempts, request a new OTP' });
    }

    if (record.otpHash !== hashOtp(otp)) {
      await EmailOtp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    await EmailOtp.updateOne(
      { _id: record._id },
      {
        $set: {
          verifiedAt: new Date(),
          expiresAt: new Date(Date.now() + VERIFIED_EMAIL_TTL_MINUTES * 60 * 1000),
          attempts: 0,
        },
      }
    );

    return res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    delete payload.confirm_password;
    payload.email = payload.email.toLowerCase();

    const otpRecord = await EmailOtp.findOne({
      email: payload.email,
      purpose: REGISTER_OTP_PURPOSE,
    });

    if (!otpRecord || !otpRecord.verifiedAt) {
      return res.status(400).json({
        success: false,
        message: 'Email is not verified. Please verify OTP before registering',
      });
    }

    const verificationAgeMs = Date.now() - otpRecord.verifiedAt.getTime();
    if (verificationAgeMs > VERIFIED_EMAIL_TTL_MINUTES * 60 * 1000) {
      await EmailOtp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'Email verification expired. Please verify OTP again',
      });
    }

    payload.password = await hash(payload.password);

    const existing = await User.findOne({ email: payload.email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const result = await userService.create(payload);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.message });
    }

    await EmailOtp.deleteOne({ _id: otpRecord._id });

    const token = sign({ id: result.data._id, role: result.data.role, email: result.data.email });
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { token, user: sanitizeUser(result.data) },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('_id password role email fullName');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = sign({ id: user._id, role: user.role, email: user.email });
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
};

module.exports = { requestRegisterOtp, verifyRegisterOtp, register, login, me };
