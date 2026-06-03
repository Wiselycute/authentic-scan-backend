const BaseService = require('./base.service');
const Report = require('../models/Report');

class ReportService extends BaseService {
  constructor() {
    super(Report);
  }

  async createReport(payload) {
    return this.create({ ...payload, status: 'open' });
  }
}

module.exports = new ReportService();
