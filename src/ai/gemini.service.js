const { buildAuthentiScanPrompt } = require('./promptBuilder');

const allowedStatuses = new Set(['likely_authentic', 'suspicious', 'review_required', 'unverified']);

const normalizeStatus = (rawStatus) => {
  const value = typeof rawStatus === 'string' ? rawStatus.trim().toLowerCase() : '';

  if (allowedStatuses.has(value)) {
    return value;
  }

  if (value === 'authentic' || value === 'real') {
    return 'likely_authentic';
  }

  if (value === 'counterfeit' || value === 'fake') {
    return 'suspicious';
  }

  if (value === 'review') {
    return 'review_required';
  }

  return 'unverified';
};

const normalizeOptionalText = (value) => (typeof value === 'string' ? value.trim() : '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const safeParseJson = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (_nestedError) {
        return null;
      }
    }
    return null;
  }
};

const normalizeAnalysis = (analysis = {}) => {
  const status = normalizeStatus(analysis.status);
  const confidence = Number.isFinite(Number(analysis.confidence))
    ? Math.max(0, Math.min(100, Number(analysis.confidence)))
    : 0;

  const fallbackReason = normalizeOptionalText(analysis.reason);
  const reasoning = Array.isArray(analysis.reasoning)
    ? analysis.reasoning.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
    : [];

  if (reasoning.length === 0 && fallbackReason) {
    reasoning.push(fallbackReason);
  }

  return {
    productName: normalizeOptionalText(analysis.productName),
    brandName: normalizeOptionalText(analysis.brandName),
    category: normalizeOptionalText(analysis.category),
    status,
    confidence,
    suspiciousIndicators: Array.isArray(analysis.suspiciousIndicators) ? analysis.suspiciousIndicators : [],
    reasoning,
    recommendation: typeof analysis.recommendation === 'string' ? analysis.recommendation : '',
  };
};

const parseRetryAfterMs = (retryAfterHeader) => {
  if (!retryAfterHeader) {
    return null;
  }

  const asNumber = Number(retryAfterHeader);
  if (Number.isFinite(asNumber) && asNumber >= 0) {
    return Math.round(asNumber * 1000);
  }

  const asDateMs = Date.parse(retryAfterHeader);
  if (Number.isFinite(asDateMs)) {
    const diff = asDateMs - Date.now();
    return diff > 0 ? diff : 0;
  }

  return null;
};

const hasQuotaZeroSignal = (errorText = '') => {
  const normalized = String(errorText).toLowerCase();
  return normalized.includes('quota exceeded') && normalized.includes('limit: 0');
};

const buildModelCandidates = (primaryModel) => {
  const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-flash-latest,gemini-2.0-flash,gemini-1.5-flash')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  return Array.from(new Set([primaryModel, ...fallbackModels]));
};

const buildGeminiRecommendation = ({ status, model, quotaZero = false }) => {
  if (status === 401 || status === 403) {
    return 'Verify GEMINI_API_KEY is valid and has access to the Gemini API in Google AI Studio.';
  }

  if (status === 404) {
    return `Configured model (${model}) is unavailable. Set GEMINI_MODEL to a supported model or configure GEMINI_FALLBACK_MODELS.`;
  }

  if (status === 429) {
    if (quotaZero) {
      return 'Gemini quota is effectively disabled (limit: 0). Enable billing/quota in Google AI Studio and regenerate your API key.';
    }

    return 'Quota/rate limit reached. Verify billing/quota in Google AI Studio, reduce request rate, and retry.';
  }

  return 'Verify your GEMINI_API_KEY permissions, billing, and model access; then retry.';
};

const extractGeminiErrorMessage = (errorText) => {
  if (!errorText) {
    return '';
  }

  const parsed = safeParseJson(errorText);
  const message =
    parsed?.error?.message ||
    parsed?.error?.status ||
    (typeof parsed?.message === 'string' ? parsed.message : '');

  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  return String(errorText).slice(0, 280);
};

const fallbackAnalysis = ({
  ocrText = '',
  barcode = '',
  qrCode = '',
  productName = '',
  brandName = '',
  reason = 'Gemini fallback mode is active.',
  recommendation = 'Set GEMINI_API_KEY (and optional GEMINI_MODEL) in backend/.env to enable full Gemini analysis.',
}) => {
  const suspiciousIndicators = [];

  if (!barcode && !qrCode) {
    suspiciousIndicators.push('No barcode or QR code was detected');
  }

  if (ocrText && /misspell|typo|counterfeit|copy|replica/i.test(ocrText)) {
    suspiciousIndicators.push('OCR text contains suspicious wording');
  }

  return normalizeAnalysis({
    productName,
    brandName,
    category: '',
    status: suspiciousIndicators.length > 0 ? 'review_required' : 'unverified',
    confidence: suspiciousIndicators.length > 0 ? 55 : 20,
    suspiciousIndicators,
    reasoning: [
      reason,
    ],
    recommendation,
  });
};

const analyzeWithGemini = async ({ imageBuffer, mimeType, ocrText, barcode, qrCode, productName, brandName }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const modelCandidates = buildModelCandidates(configuredModel);

  if (!apiKey) {
    return {
      analysis: fallbackAnalysis({
        ocrText,
        barcode,
        qrCode,
        productName,
        brandName,
        reason: 'Gemini API key is not configured, so analysis used a fallback heuristic.',
        recommendation: 'Set GEMINI_API_KEY (and optional GEMINI_MODEL) in backend/.env to enable full Gemini analysis.',
      }),
      rawResponse: { fallback: true },
      model: configuredModel,
    };
  }

  const prompt = buildAuthentiScanPrompt({ ocrText, barcode, qrCode, productName, brandName });
  const base64Image = imageBuffer ? imageBuffer.toString('base64') : null;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          ...(base64Image
            ? [{ inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Image } }]
            : []),
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const maxRetries = Math.max(0, Number.parseInt(process.env.GEMINI_MAX_RETRIES || '2', 10) || 0);
  const retryableStatuses = new Set([429, 500, 502, 503, 504]);
  let lastFailure = null;
  let usedModel = configuredModel;
  let quotaZeroDetected = false;

  for (const currentModel of modelCandidates) {
    usedModel = currentModel;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        );

        if (response.ok) {
          const json = await response.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const parsed = safeParseJson(text) || {};

          return {
            analysis: normalizeAnalysis(parsed),
            rawResponse: json,
            model: currentModel,
          };
        }

        const errorText = await response.text();
        lastFailure = {
          status: response.status,
          errorText,
        };

        if (response.status === 429 && hasQuotaZeroSignal(errorText)) {
          quotaZeroDetected = true;
        }

        if (response.status === 404) {
          break;
        }

        const shouldRetry = retryableStatuses.has(response.status) && attempt < maxRetries;
        if (!shouldRetry || quotaZeroDetected) {
          break;
        }

        const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
        const backoffMs = retryAfterMs ?? Math.min(8000, 1000 * 2 ** attempt);
        await sleep(backoffMs);
      } catch (error) {
        lastFailure = {
          status: 0,
          errorText: error?.message || 'Unknown Gemini network error',
        };

        if (attempt >= maxRetries) {
          break;
        }

        const backoffMs = Math.min(8000, 1000 * 2 ** attempt);
        await sleep(backoffMs);
      }
    }

    const lastStatus = lastFailure?.status || 0;
    if (quotaZeroDetected || lastStatus === 401 || lastStatus === 403) {
      break;
    }
  }

  const status = lastFailure?.status || 0;
  const errorMessage = extractGeminiErrorMessage(lastFailure?.errorText || '');
  const recommendation = buildGeminiRecommendation({ status, model: usedModel, quotaZero: quotaZeroDetected });
  const reason = status
    ? `Gemini API request failed (status ${status})${errorMessage ? `: ${errorMessage}` : ''}, so fallback analysis was used.`
    : `Gemini API request failed due to a network or transport error${errorMessage ? `: ${errorMessage}` : ''}, so fallback analysis was used.`;

  return {
    analysis: fallbackAnalysis({
      ocrText,
      barcode,
      qrCode,
      productName,
      brandName,
      reason,
      recommendation,
    }),
    rawResponse: {
      error: lastFailure?.errorText || 'Unknown Gemini request failure',
      status,
      retriesAttempted: maxRetries,
      modelCandidates,
      lastTriedModel: usedModel,
    },
    model: usedModel,
  };
};

module.exports = { analyzeWithGemini, normalizeAnalysis };
