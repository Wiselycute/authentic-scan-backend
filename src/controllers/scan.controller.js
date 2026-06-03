const scanService = require('../services/scan.service');
const { successResponse, errorResponse } = require('../utils/response');

const upload = async (req, res, next) => {
  try {
    const result = await scanService.analyzeScan({
      user: req.user,
      file: req.file,
      source: 'upload',
      payload: req.body,
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'Product image analyzed successfully',
      data: result.data,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

const analyze = async (req, res, next) => {
  try {
    const result = await scanService.analyzeScan({
      user: req.user,
      file: req.file,
      source: 'analyze',
      payload: req.body,
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'AI analysis completed successfully',
      data: result.data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const scanQr = async (req, res, next) => {
  try {
    const result = await scanService.analyzeScan({
      user: req.user,
      file: req.file,
      source: 'qr',
      payload: req.body,
      metadata: { ip: req.ip, userAgent: req.get('user-agent') },
    });

    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'QR scan completed successfully',
      data: result.data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const scanBarcode = async (req, res, next) => {
  try {
    const result = await scanService.analyzeScan({
      user: req.user,
      file: req.file,
      source: 'barcode',
      payload: req.body,
      metadata: { ip: req.ip, userAgent: req.get('user-agent') },
    });

    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'Barcode scan completed successfully',
      data: result.data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const history = async (req, res, next) => {
  try {
    const result = await scanService.getHistory({ user: req.user, query: req.query });
    return successResponse(res, {
      message: 'Scan history loaded successfully',
      data: result.items,
      meta: result.meta,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const findOne = async (req, res, next) => {
  try {
    const result = await scanService.getScanById({ user: req.user, scanId: req.params.scanId });

    if (!result) {
      return errorResponse(res, { message: 'Scan not found', statusCode: 404 });
    }

    return successResponse(res, {
      message: 'Scan details loaded successfully',
      data: result,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const appendMessages = async (req, res, next) => {
  try {
    const result = await scanService.appendConversationMessages({
      user: req.user,
      scanId: req.params.scanId,
      messages: req.body.messages,
    });

    if (!result) {
      return errorResponse(res, { message: 'Scan not found', statusCode: 404 });
    }

    return successResponse(res, {
      message: 'Conversation updated successfully',
      data: result,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const removed = await scanService.deleteScanById({ user: req.user, scanId: req.params.scanId });

    if (!removed) {
      return errorResponse(res, { message: 'Scan not found', statusCode: 404 });
    }

    return successResponse(res, {
      message: 'Scan deleted successfully',
      data: { scanId: req.params.scanId },
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  analyze,
  scanQr,
  scanBarcode,
  history,
  findOne,
  appendMessages,
  remove,
};
