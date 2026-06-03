const brandService = require('../services/brand.service');
const { successResponse, errorResponse } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const result = await brandService.create(req.body);
    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'Brand created successfully',
      data: result.data,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

const findMany = async (req, res, next) => {
  try {
    const result = await brandService.find(req.query);
    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'Brands fetched successfully',
      data: result.data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const findOne = async (req, res, next) => {
  try {
    const result = await brandService.findBy(req.params.id);
    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    if (!result.data) {
      return errorResponse(res, { message: 'Brand not found', statusCode: 404 });
    }

    return successResponse(res, {
      message: 'Brand fetched successfully',
      data: result.data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const existing = await brandService.findBy(req.params.id);
    if (existing.error) {
      return errorResponse(res, { message: existing.message, statusCode: 400 });
    }

    if (!existing.data) {
      return errorResponse(res, { message: 'Brand not found', statusCode: 404 });
    }

    const result = await brandService.update(req.params.id, req.body);
    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    const updated = await brandService.findBy(req.params.id);
    if (updated.error) {
      return errorResponse(res, { message: updated.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'Brand updated successfully',
      data: updated.data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await brandService.findBy(req.params.id);
    if (existing.error) {
      return errorResponse(res, { message: existing.message, statusCode: 400 });
    }

    if (!existing.data) {
      return errorResponse(res, { message: 'Brand not found', statusCode: 404 });
    }

    const result = await brandService.remove(req.params.id);
    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'Brand deleted successfully',
      data: null,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, findMany, findOne, update, remove };
