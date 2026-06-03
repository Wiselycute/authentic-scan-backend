const { Router } = require('express');
const { authRequired } = require('../middleware/auth.middleware');
const { validateReport } = require('../validations/report.validation');
const reportController = require('../controllers/report.controller');

const router = Router();

router.post('/', authRequired, validateReport, reportController.createReport);

module.exports = router;
