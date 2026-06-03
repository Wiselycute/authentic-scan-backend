const User = require('../models/User');
const { verify } = require('../../utils/libs/jwt');

const extractToken = (req) => {
  const authorization = req.header('Authorization');

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const authRequired = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = verify(token);
    if (!payload?.id) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const user = await User.findById(payload.id).select('_id fullName email role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authRequired, extractToken };
