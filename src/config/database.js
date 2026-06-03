const mongoose = require('mongoose');

const connect = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/authentiscan';
  const fallbackUri = process.env.MONGO_URI_FALLBACK;

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production',
    });
  } catch (error) {
    const isSrvLookupFailure =
      error?.syscall === 'querySrv' ||
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ECONNREFUSED';

    if (isSrvLookupFailure && fallbackUri) {
      console.warn('[AuthentiScan] Primary MongoDB SRV URI failed. Retrying with MONGO_URI_FALLBACK...');

      await mongoose.connect(fallbackUri, {
        autoIndex: process.env.NODE_ENV !== 'production',
      });
    } else {
      if (isSrvLookupFailure && !fallbackUri) {
        console.error(
          '[AuthentiScan] MongoDB SRV DNS lookup failed. Set MONGO_URI_FALLBACK to a non-SRV Atlas connection string.'
        );
      }

      throw error;
    }
  }

  return mongoose.connection;
};

module.exports = { connect };
