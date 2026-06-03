const productService = require('../services/product.service');
const Brand = require('../models/Brand');
const { successResponse, errorResponse } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    if (req.body.brand) {
      const brand = await Brand.findById(req.body.brand);
      if (!brand) {
        return errorResponse(res, { message: 'Brand not found', statusCode: 400 });
      }
    }

    const result = await productService.create(req.body);
    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'Product created successfully',
      data: result.data,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

const findMany = async (req, res, next) => {
  try {
    const result = await productService.find(req.query);
    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'Products fetched successfully',
      data: result.data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const findOne = async (req, res, next) => {
  try {
    const result = await productService.findBy(req.params.id);
    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    if (!result.data) {
      return errorResponse(res, { message: 'Product not found', statusCode: 404 });
    }

    return successResponse(res, {
      message: 'Product fetched successfully',
      data: result.data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const existing = await productService.findBy(req.params.id);
    if (existing.error) {
      return errorResponse(res, { message: existing.message, statusCode: 400 });
    }

    if (!existing.data) {
      return errorResponse(res, { message: 'Product not found', statusCode: 404 });
    }

    if (req.body.brand) {
      const brand = await Brand.findById(req.body.brand);
      if (!brand) {
        return errorResponse(res, { message: 'Brand not found', statusCode: 400 });
      }
    }

    const result = await productService.update(req.params.id, req.body);
    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    const updated = await productService.findBy(req.params.id);
    if (updated.error) {
      return errorResponse(res, { message: updated.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'Product updated successfully',
      data: updated.data,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await productService.findBy(req.params.id);
    if (existing.error) {
      return errorResponse(res, { message: existing.message, statusCode: 400 });
    }

    if (!existing.data) {
      return errorResponse(res, { message: 'Product not found', statusCode: 404 });
    }

    const result = await productService.remove(req.params.id);
    if (result.error) {
      return errorResponse(res, { message: result.message, statusCode: 400 });
    }

    return successResponse(res, {
      message: 'Product deleted successfully',
      data: null,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, findMany, findOne, update, remove };
