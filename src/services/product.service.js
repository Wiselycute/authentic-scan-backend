const BaseService = require('./base.service');
const Product = require('../models/Product');

class ProductService extends BaseService {
  constructor() {
    super(Product);
  }
}

module.exports = new ProductService();
