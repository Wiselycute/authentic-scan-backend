const { scanAnyCode } = require('./barcode.service');

const scanQrCode = async (imagePath) => {
  try {
    const result = await scanAnyCode(imagePath);

    if (result.format !== 'QR_CODE') {
      return { value: '', format: '', isValid: false };
    }

    return {
      value: result.value,
      format: result.format,
      isValid: true,
    };
  } catch (_error) {
    return { value: '', format: '', isValid: false };
  }
};

module.exports = { scanQrCode };
