require('dotenv').config();
const { connect } = require('./src/config/database');
const { createApp } = require('./src/app');

const start = async () => {
  const port = process.env.PORT || 4000;
  await connect();

  if (!process.env.GEMINI_API_KEY) {
    console.warn('[AuthentiScan] GEMINI_API_KEY is missing. AI analysis will run in fallback mode.');
    console.warn('[AuthentiScan] Set GEMINI_API_KEY in backend/.env to enable full Gemini analysis.');
  }

  const app = createApp();
  app.listen(port, () => {
    console.log(`AuthentiScan API running on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
