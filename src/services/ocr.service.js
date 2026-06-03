const fs = require('fs/promises');

let tesseractModule = null;

const loadTesseract = async () => {
  if (tesseractModule) {
    return tesseractModule;
  }

  try {
    tesseractModule = require('tesseract.js');
    return tesseractModule;
  } catch (_error) {
    return null;
  }
};

const extractText = async (imagePath) => {
  const tesseract = await loadTesseract();
  if (!tesseract) {
    return { text: '', confidence: 0, engine: 'unavailable' };
  }

  const buffer = await fs.readFile(imagePath);
  const worker = await tesseract.createWorker('eng');

  try {
    const result = await worker.recognize(buffer);
    const text = result?.data?.text?.trim() || '';
    const confidence = Number(result?.data?.confidence || 0);

    return {
      text,
      confidence,
      engine: 'tesseract',
    };
  } finally {
    await worker.terminate();
  }
};

module.exports = { extractText };
