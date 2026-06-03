const fs = require('fs/promises');
const sharp = require('sharp');
const {
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
  MultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
} = require('@zxing/library');

const decodeImage = async (imagePath, formats) => {
  const buffer = await fs.readFile(imagePath);
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const source = new RGBLuminanceSource(data, info.width, info.height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const reader = new MultiFormatReader();
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
  reader.setHints(hints);

  const result = reader.decode(bitmap);
  const rawFormat = result.getBarcodeFormat();
  const normalizedFormat = typeof rawFormat === 'number' ? BarcodeFormat[rawFormat] || String(rawFormat) : String(rawFormat);

  return {
    value: result.getText(),
    format: normalizedFormat,
    raw: result.toString(),
  };
};

const scanBarcode = async (imagePath) => {
  try {
    const result = await decodeImage(imagePath, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.CODABAR,
    ]);

    return { ...result, isValid: true };
  } catch (_error) {
    return { value: '', format: '', raw: '', isValid: false };
  }
};

const scanAnyCode = async (imagePath) => {
  try {
    const result = await decodeImage(imagePath, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.AZTEC,
      BarcodeFormat.PDF_417,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.CODABAR,
    ]);

    return { ...result, isValid: true };
  } catch (_error) {
    return { value: '', format: '', raw: '', isValid: false };
  }
};

module.exports = { scanBarcode, scanAnyCode };
