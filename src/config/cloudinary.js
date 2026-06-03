const { v2: cloudinary } = require('cloudinary');

let isInitialized = false;

const hasCloudinaryEnv = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
      && process.env.CLOUDINARY_API_KEY
      && process.env.CLOUDINARY_API_SECRET
  );
};

const getCloudinary = () => {
  if (!hasCloudinaryEnv()) {
    return null;
  }

  if (!isInitialized) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    isInitialized = true;
  }

  return cloudinary;
};

module.exports = { getCloudinary, hasCloudinaryEnv };
