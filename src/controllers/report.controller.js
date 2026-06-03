const reportService = require('../services/report.service');
const VerificationLog = require('../models/VerificationLog');
const { successResponse } = require('../utils/response');

const createReport = async (req, res, next) => {
  try {
    const result = await reportService.createReport({
      user: req.user._id,
      scan: req.body.scanId || null,
      category: req.body.category,
      reason: req.body.reason,
      description: req.body.description,
      evidence: req.body.evidence || [],
    });

    if (result.error) {
      return res.status(400).json({ success: false, message: result.message });
    }

    if (req.body.scanId) {
      await VerificationLog.create({
        scan: req.body.scanId,
        user: req.user._id,
        eventType: 'report',
        status: 'review_required',
        confidence: 0,
        requestPayload: req.body,
        responsePayload: { reportId: result.data._id },
      });
    }

    return successResponse(res, {
      message: 'Report submitted successfully',
      data: result.data,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport };
