const BaseService = require('./base.service');
const Brand = require('../models/Brand');

class BrandService extends BaseService {
  constructor() {
    super(Brand);
  }
}

module.exports = new BrandService();
