const { getAdminAnalytics } = require('../services/analytics.service');
const { getAdminScanById } = require('../services/scan.service');
const { successResponse } = require('../utils/response');

const analytics = async (_req, res, next) => {
  try {
    const data = await getAdminAnalytics();
    return successResponse(res, {
      message: 'Analytics loaded successfully',
      data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const findScan = async (req, res, next) => {
  try {
    const data = await getAdminScanById({ scanId: req.params.scanId });
    return successResponse(res, {
      message: 'Scan details loaded successfully',
      data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { analytics, findScan };
