const successResponse = (res, { message, data = null, meta = null, statusCode = 200 }) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

const errorResponse = (res, { message, errors = null, statusCode = 400 }) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = { successResponse, errorResponse };
