const { getCloudinary } = require('../config/cloudinary');

const uploadImageFromPath = async (filePath, options = {}) => {
  const cloudinary = getCloudinary();

  if (!cloudinary || !filePath) {
    return {
      uploaded: false,
      provider: 'local',
      reason: !filePath ? 'File path missing' : 'Cloudinary not configured',
    };
  }

  try {
    const folder = options.folder || process.env.CLOUDINARY_UPLOAD_FOLDER || 'authentiscan/scans';
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'image',
      folder,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    return {
      uploaded: true,
      provider: 'cloudinary',
      publicId: result.public_id,
      url: result.secure_url,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    return {
      uploaded: false,
      provider: 'local',
      reason: error.message || 'Cloudinary upload failed',
    };
  }
};

module.exports = { uploadImageFromPath };
