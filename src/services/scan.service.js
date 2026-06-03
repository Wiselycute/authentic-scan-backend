const fs = require('fs/promises');

const Scan = require('../models/Scan');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const VerificationLog = require('../models/VerificationLog');
const { analyzeWithGemini } = require('../ai/gemini.service');
const { extractText } = require('./ocr.service');
const { scanBarcode } = require('./barcode.service');
const { scanQrCode } = require('./qr.service');
const { uploadImageFromPath } = require('./cloudinary.service');
const { VERIFICATION_STATUS } = require('../utils/constants');
const { buildPagination } = require('../utils/pagination');

const allowedStatuses = new Set(Object.values(VERIFICATION_STATUS));

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeCategory = (value) => normalizeText(value);

const firstNonEmpty = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

const resolveScanTitle = ({ productName = '', brandName = '', analysis = {}, barcode = {}, qrCode = {}, source = 'upload' }) => {
  if (productName) {
    return productName;
  }

  if (brandName && (barcode?.value || qrCode?.value)) {
    return `${brandName} Verification`;
  }

  if (analysis?.status === VERIFICATION_STATUS.SUSPICIOUS) {
    return 'Suspicious Product Scan';
  }

  if (source === 'qr') {
    return 'QR Product Scan';
  }

  if (source === 'barcode') {
    return 'Barcode Product Scan';
  }

  return 'Product Authenticity Scan';
};

const toHistoryItem = (scan) => ({
  scanId: scan._id,
  title: scan.scanTitle,
  productName: scan.productName || scan.product?.name || 'Unknown Product',
  brandName: scan.brandName || scan.brand?.name || '',
  category: scan.category || scan.product?.category || '',
  product: scan.product
    ? {
        id: scan.product._id,
        name: scan.product.name,
      }
    : null,
  brand: scan.brand
    ? {
        id: scan.brand._id,
        name: scan.brand.name,
      }
    : null,
  image: scan.uploadedImage?.url || '',
  imageThumbnail: scan.uploadedImage?.url || '',
  barcodeValue: scan.barcode?.value || '',
  qrValue: scan.qrCode?.value || '',
  codeValue: scan.codeValue || scan.barcode?.value || scan.qrCode?.value || '',
  verificationStatus: scan.verificationStatus,
  confidence: Number(scan?.aiAnalysis?.confidence || 0),
  source: scan.source,
  suspiciousIndicators: scan.suspiciousIndicators || [],
  createdAt: scan.createdAt,
  updatedAt: scan.updatedAt,
});

const toScanDetail = (scan) => ({
  scanId: scan._id,
  title: scan.scanTitle,
  source: scan.source,
  userId: scan.user,
  productName: scan.productName || scan.product?.name || 'Unknown Product',
  brandName: scan.brandName || scan.brand?.name || '',
  category: scan.category || scan.product?.category || '',
  imageThumbnail: scan.uploadedImage?.url || '',
  codeValue: scan.codeValue || scan.barcode?.value || scan.qrCode?.value || '',
  verificationStatus: scan.verificationStatus,
  confidence: Number(scan?.aiAnalysis?.confidence || 0),
  product: scan.product
    ? {
        id: scan.product._id,
        name: scan.product.name,
      }
    : null,
  brand: scan.brand
    ? {
        id: scan.brand._id,
        name: scan.brand.name,
      }
    : null,
  uploadedImage: scan.uploadedImage || null,
  barcode: scan.barcode || null,
  qrCode: scan.qrCode || null,
  ocr: scan.ocr || null,
  aiAnalysis: scan.aiAnalysis || null,
  suspiciousIndicators: scan.suspiciousIndicators || [],
  reasoning: scan.reasoning || [],
  recommendation: scan.recommendation || '',
  conversationMessages: Array.isArray(scan.conversationMessages) ? scan.conversationMessages : [],
  createdAt: scan.createdAt,
  updatedAt: scan.updatedAt,
});

const resolveStatus = (analysis) => {
  if (allowedStatuses.has(analysis?.status)) {
    return analysis.status;
  }

  if (Number(analysis?.confidence) >= 85) {
    return VERIFICATION_STATUS.LIKELY_AUTHENTIC;
  }

  if (Number(analysis?.confidence) >= 60) {
    return VERIFICATION_STATUS.REVIEW_REQUIRED;
  }

  return analysis?.suspiciousIndicators?.length > 0
    ? VERIFICATION_STATUS.SUSPICIOUS
    : VERIFICATION_STATUS.UNVERIFIED;
};

const lookupProductByCodes = async ({ barcodeValue, qrValue }) => {
  const identityOr = [
    ...(barcodeValue ? [{ barcode: barcodeValue }] : []),
    ...(qrValue ? [{ qrCode: qrValue }] : []),
  ];

  if (identityOr.length === 0) {
    return null;
  }

  return Product.findOne({ $or: identityOr }).populate('brand');
};

const resolveDetectedProductInfo = async ({ payload = {}, analysis = {}, barcodeValue = '', qrValue = '' }) => {
  const payloadProductName = normalizeText(payload.productName);
  const payloadBrandName = normalizeText(payload.brandName);
  const payloadCategory = normalizeCategory(payload.category);

  const analysisProductName = normalizeText(analysis.productName);
  const analysisBrandName = normalizeText(analysis.brandName);
  const analysisCategory = normalizeCategory(analysis.category);

  const matchedProduct = await lookupProductByCodes({ barcodeValue, qrValue });
  const matchedBrandName = normalizeText(matchedProduct?.brand?.name);

  const productName = firstNonEmpty(payloadProductName, analysisProductName, matchedProduct?.name, 'Unknown Product');
  const brandName = firstNonEmpty(payloadBrandName, analysisBrandName, matchedBrandName);
  const category = firstNonEmpty(payloadCategory, analysisCategory, matchedProduct?.category);

  return {
    productName,
    brandName,
    category,
    barcodeValue: normalizeText(barcodeValue),
    qrValue: normalizeText(qrValue),
    codeValue: normalizeText(barcodeValue) || normalizeText(qrValue) || '',
  };
};

const upsertProductContext = async ({ productName, brandName, category, barcode, qrCode, analysis }) => {
  if (!productName && !brandName && !barcode && !qrCode) {
    return { product: null, brand: null };
  }

  let brand = null;
  if (brandName) {
    brand = await Brand.findOneAndUpdate(
      { name: new RegExp(`^${brandName}$`, 'i') },
      {
        $setOnInsert: {
          name: brandName,
          slug: brandName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        },
      },
      { returnDocument: 'after', upsert: true }
    );
  }

  const identityOr = [
    ...(barcode ? [{ barcode }] : []),
    ...(qrCode ? [{ qrCode }] : []),
    ...(productName ? [{ name: new RegExp(`^${productName}$`, 'i') }] : []),
  ];

  const productQuery =
    identityOr.length > 0
      ? { $or: identityOr }
      : {
          name: productName || `Unspecified Product (${brandName})`,
          brand: brand?._id || null,
        };

  const product = await Product.findOneAndUpdate(
    productQuery,
    {
      $setOnInsert: {
        name: productName || qrCode || barcode || 'Unspecified Product',
      },
      $set: {
        verificationStatus: resolveStatus(analysis),
        ...(brand?._id ? { brand: brand._id } : {}),
        ...(category ? { category } : {}),
        ...(barcode ? { barcode } : {}),
        ...(qrCode ? { qrCode } : {}),
      },
    },
    { returnDocument: 'after', upsert: true }
  );

  return { product, brand };
};

const persistScan = async ({
  user,
  source,
  file,
  uploadedImage,
  barcode,
  qrCode,
  ocr,
  analysis,
  metadata,
  product,
  brand,
  detectedInfo,
}) => {
  const verificationStatus = resolveStatus(analysis);
  const scanTitle = resolveScanTitle({
    productName: detectedInfo?.productName || metadata?.productName || '',
    brandName: detectedInfo?.brandName || metadata?.brandName || '',
    analysis,
    barcode,
    qrCode,
    source,
  });

  const seedConversation = [
    {
      role: 'user',
      content:
        detectedInfo?.productName || detectedInfo?.brandName
          ? `Scan ${detectedInfo.productName || 'product'}${detectedInfo.brandName ? ` from ${detectedInfo.brandName}` : ''}.`
          : 'Scan this product for authenticity.',
      imageUrl: uploadedImage?.url || '',
      metadata: {
        source,
      },
    },
    {
      role: 'assistant',
      content: `Result: ${verificationStatus.replace(/_/g, ' ')} with ${Number(analysis.confidence || 0)}% confidence.`,
      metadata: {
        suspiciousIndicators: analysis.suspiciousIndicators || [],
        recommendation: analysis.recommendation || '',
      },
    },
  ];

  const scan = await Scan.create({
    user: user._id,
    scanTitle,
    product: product?._id || null,
    brand: brand?._id || null,
    source,
    productName: detectedInfo?.productName || 'Unknown Product',
    brandName: detectedInfo?.brandName || '',
    category: detectedInfo?.category || '',
    codeValue: detectedInfo?.codeValue || '',
    uploadedImage: file
      ? {
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          url: uploadedImage?.url || '',
          publicId: uploadedImage?.publicId || '',
          provider: uploadedImage?.provider || 'local',
          mimetype: file.mimetype,
          size: file.size,
        }
      : undefined,
    barcode: barcode
      ? {
          value: barcode.value || '',
          format: barcode.format || '',
          isValid: Boolean(barcode.isValid),
        }
      : undefined,
    qrCode: qrCode
      ? {
          value: qrCode.value || '',
          format: qrCode.format || '',
        }
      : undefined,
    ocr,
    aiAnalysis: {
      ...analysis,
      status: verificationStatus,
    },
    verificationStatus,
    suspiciousIndicators: analysis.suspiciousIndicators || [],
    reasoning: analysis.reasoning || [],
    recommendation: analysis.recommendation || '',
    metadata,
    conversationMessages: seedConversation,
  });

  await VerificationLog.create({
    scan: scan._id,
    user: user._id,
    eventType:
      source === 'qr'
        ? 'qr_scan'
        : source === 'barcode'
          ? 'barcode_scan'
          : source === 'analyze'
            ? 'analysis'
            : 'scan_upload',
    status: verificationStatus,
    confidence: analysis.confidence || 0,
    requestPayload: metadata || {},
    responsePayload: analysis,
  });

  return scan;
};

const analyzeScan = async ({ user, file, source = 'upload', payload = {}, metadata = {} }) => {
  const directQr = typeof payload.qrInput === 'string' ? payload.qrInput.trim() : '';
  const directBarcode = typeof payload.barcodeInput === 'string' ? payload.barcodeInput.trim() : '';
  const isDirectTextScan = source === 'qr' ? Boolean(directQr) : source === 'barcode' ? Boolean(directBarcode) : false;

  if (!file?.path && !isDirectTextScan) {
    return {
      error: true,
      message: 'Image file is required for analysis, or provide qrInput/barcodeInput for direct scans',
    };
  }

  const [ocr, barcodeFromImage, qrFromImage] = file?.path
    ? await Promise.all([extractText(file.path), scanBarcode(file.path), scanQrCode(file.path)])
    : [
        { text: '', confidence: 0, engine: 'none' },
        { value: '', format: '', raw: '', isValid: false },
        { value: '', format: '', isValid: false },
      ];

  const barcodeResult =
    directBarcode && source === 'barcode'
      ? { value: directBarcode, format: 'MANUAL_INPUT', raw: directBarcode, isValid: true }
      : barcodeFromImage;
  const qrResult =
    directQr && source === 'qr'
      ? { value: directQr, format: 'MANUAL_INPUT', isValid: true }
      : qrFromImage;

  const imageBuffer = file?.path ? await fs.readFile(file.path) : null;
  const { analysis, rawResponse, model } = await analyzeWithGemini({
    imageBuffer,
    mimeType: file?.mimetype,
    ocrText: ocr.text,
    barcode: barcodeResult.value,
    qrCode: qrResult.value,
    productName: payload.productName,
    brandName: payload.brandName,
  });

  const detectedInfo = await resolveDetectedProductInfo({
    payload,
    analysis,
    barcodeValue: barcodeResult.value,
    qrValue: qrResult.value,
  });

  const uploadedImage = file?.path
    ? await uploadImageFromPath(file.path, {
        folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'authentiscan/scans',
      })
    : {
        uploaded: false,
        provider: 'local',
      };

  const context = await upsertProductContext({
    productName: detectedInfo.productName,
    brandName: detectedInfo.brandName,
    category: detectedInfo.category,
    barcode: barcodeResult.value,
    qrCode: qrResult.value,
    analysis,
  });

  const scan = await persistScan({
    user,
    source,
    file,
    uploadedImage,
    barcode: barcodeResult,
    qrCode: qrResult,
    ocr,
    analysis: {
      ...analysis,
      rawResponse,
      model,
    },
    metadata: {
      ...metadata,
      productName: detectedInfo.productName || null,
      brandName: detectedInfo.brandName || null,
      category: detectedInfo.category || null,
      codeValue: detectedInfo.codeValue || null,
      qrInput: payload.qrInput || null,
      barcodeInput: payload.barcodeInput || null,
    },
    product: context.product,
    brand: context.brand,
    detectedInfo,
  });

  if (uploadedImage.uploaded && file?.path) {
    await fs.unlink(file.path).catch(() => null);
  }

  return {
    error: false,
    data: {
      scan,
      analysis: {
        status: scan.verificationStatus,
        confidence: scan.aiAnalysis.confidence,
        productName: scan.productName,
        brandName: scan.brandName,
        category: scan.category,
        suspiciousIndicators: scan.suspiciousIndicators,
        reasoning: scan.reasoning,
        recommendation: scan.recommendation,
      },
      ocr,
      barcode: barcodeResult,
      qrCode: qrResult,
    },
  };
};

const getHistory = async ({ user, query }) => {
  const { page, limit, skip } = buildPagination(query);
  const where = { user: user._id };

  if (query.status) {
    where.verificationStatus = query.status;
  }

  if (query.source) {
    where.source = query.source;
  }

  if (query.search) {
    where.$or = [
      { scanTitle: new RegExp(query.search, 'i') },
      { productName: new RegExp(query.search, 'i') },
      { brandName: new RegExp(query.search, 'i') },
      { category: new RegExp(query.search, 'i') },
      { codeValue: new RegExp(query.search, 'i') },
      { 'metadata.productName': new RegExp(query.search, 'i') },
      { 'metadata.brandName': new RegExp(query.search, 'i') },
      { 'ocr.text': new RegExp(query.search, 'i') },
      { 'barcode.value': new RegExp(query.search, 'i') },
      { 'qrCode.value': new RegExp(query.search, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Scan.find(where)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product')
      .populate('brand'),
    Scan.countDocuments(where),
  ]);

  return {
    items: items.map(toHistoryItem),
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

const getScanById = async ({ user, scanId }) => {
  const scan = await Scan.findOne({ _id: scanId, user: user._id }).populate('product').populate('brand');

  if (!scan) {
    return null;
  }

  return toScanDetail(scan);
};

const getAdminScanById = async ({ scanId }) => {
  const scan = await Scan.findById(scanId).populate('product').populate('brand');

  if (!scan) {
    return null;
  }

  return toScanDetail(scan);
};

const appendConversationMessages = async ({ user, scanId, messages = [] }) => {
  const normalizedMessages = messages
    .map((message) => ({
      role: message.role,
      content: typeof message.content === 'string' ? message.content.trim() : '',
      imageUrl: typeof message.imageUrl === 'string' ? message.imageUrl.trim() : '',
      metadata: message.metadata || {},
      createdAt: new Date(),
    }))
    .filter((message) => message.content || message.imageUrl);

  if (normalizedMessages.length === 0) {
    return getScanById({ user, scanId });
  }

  const scan = await Scan.findOneAndUpdate(
    { _id: scanId, user: user._id },
    {
      $push: {
        conversationMessages: {
          $each: normalizedMessages,
        },
      },
      $set: {
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  )
    .populate('product')
    .populate('brand');

  if (!scan) {
    return null;
  }

  return toScanDetail(scan);
};

const deleteScanById = async ({ user, scanId }) => {
  const removed = await Scan.findOneAndDelete({ _id: scanId, user: user._id });
  return Boolean(removed);
};

module.exports = {
  analyzeScan,
  getHistory,
  getScanById,
  getAdminScanById,
  appendConversationMessages,
  deleteScanById,
};
