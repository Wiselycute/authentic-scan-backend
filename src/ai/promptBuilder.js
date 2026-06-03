const buildAuthentiScanPrompt = ({ ocrText = '', barcode = '', qrCode = '', productName = '', brandName = '' }) => {
  return [
    'You are AuthentiScan, an enterprise product authenticity review engine.',
    'Analyze the supplied product evidence and return JSON only.',
    'Use these statuses only: likely_authentic, suspicious, review_required, unverified.',
    'Do not say fake or real.',
    'Extract probable productName, brandName, and category from packaging text and visual evidence when possible.',
    'If extraction is uncertain, return empty strings for productName, brandName, and category.',
    'Check for spelling inconsistencies, suspicious branding, packaging quality, logo consistency, suspicious wording, and barcode validity.',
    '',
    'Evidence:',
    `- productName: ${productName || 'unknown'}`,
    `- brandName: ${brandName || 'unknown'}`,
    `- barcode: ${barcode || 'none'}`,
    `- qrCode: ${qrCode || 'none'}`,
    `- ocrText: ${ocrText || 'none'}`,
    '',
    'Return JSON in this format:',
    '{',
    '  "productName": "",',
    '  "brandName": "",',
    '  "category": "",',
    '  "status": "suspicious",',
    '  "confidence": 78,',
    '  "suspiciousIndicators": [],',
    '  "reasoning": [],',
    '  "reason": "",',
    '  "recommendation": ""',
    '}',
  ].join('\n');
};

module.exports = { buildAuthentiScanPrompt };
