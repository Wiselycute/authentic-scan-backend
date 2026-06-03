const { Router } = require('express');
const { authRequired } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const adminController = require('../controllers/admin.controller');

const router = Router();

router.get('/analytics', authRequired, requireAdmin, adminController.analytics);
router.get('/scans/:scanId', authRequired, requireAdmin, adminController.findScan);

module.exports = router;
