const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoute = require('./routes/auth.route');
const scanRoute = require('./routes/scan.route');
const reportRoute = require('./routes/report.route');
const adminRoute = require('./routes/admin.route');
const brandRoute = require('./routes/brand.route');
const productRoute = require('./routes/product.route');
const userRoute = require('../routes/user.route');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const createApp = () => {
  const app = express();

  // Behind Railway/reverse proxies, trust one hop so IP-based rate limiting works.
  const trustProxyEnv = process.env.TRUST_PROXY;
  if (typeof trustProxyEnv !== 'undefined') {
    if (trustProxyEnv === 'true') app.set('trust proxy', true);
    else if (trustProxyEnv === 'false') app.set('trust proxy', false);
    else if (!Number.isNaN(Number(trustProxyEnv))) app.set('trust proxy', Number(trustProxyEnv));
    else app.set('trust proxy', trustProxyEnv);
  } else if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health' || req.path === '/',
    })
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'AuthentiScan backend is healthy',
    });
  });

  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'AuthentiScan API is running',
    });
  });

  app.use('/api/auth', authRoute);
  app.use('/api/scans', scanRoute);
  app.use('/api/reports', reportRoute);
  app.use('/api/admin', adminRoute);
  app.use('/api/brands', brandRoute);
  app.use('/api/products', productRoute);
  app.use('/users', userRoute);
  app.use('/api/users', userRoute);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
