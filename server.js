require('dotenv').config();
const { connect } = require('./src/config/database');
const { createApp } = require('./src/app');

process.on('unhandledRejection', (reason) => {
  console.error('[AuthentiScan] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[AuthentiScan] Uncaught exception:', error);
});

const start = async () => {
  const port = process.env.PORT || 4000;
  const host = process.env.HOST || '0.0.0.0';
  const app = createApp();
  app.listen(port, host, () => {
    console.log(`AuthentiScan API running on http://${host}:${port}`);
  });

  if (!process.env.GEMINI_API_KEY) {
    console.warn('[AuthentiScan] GEMINI_API_KEY is missing. AI analysis will run in fallback mode.');
    console.warn('[AuthentiScan] Set GEMINI_API_KEY in backend/.env to enable full Gemini analysis.');
  }

  try {
    await connect();
    console.log('[AuthentiScan] MongoDB connected');
  } catch (error) {
    console.error('[AuthentiScan] MongoDB connection failed after startup:', error);
  }
};

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
