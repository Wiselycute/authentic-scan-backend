const { Router } = require('express');
const { authRequired } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const scanController = require('../controllers/scan.controller');
const {
	validateBody,
	analyzeSchema,
	validateQuery,
	historyQuerySchema,
	validateParams,
	scanIdSchema,
	appendMessageSchema,
} = require('../validations/scan.validation');

const router = Router();

router.post('/upload', authRequired, upload.single('image'), validateBody(analyzeSchema), scanController.upload);
router.post('/qr', authRequired, upload.single('image'), validateBody(analyzeSchema), scanController.scanQr);
router.post('/barcode', authRequired, upload.single('image'), validateBody(analyzeSchema), scanController.scanBarcode);
router.post('/analyze', authRequired, upload.single('image'), validateBody(analyzeSchema), scanController.analyze);
router.get('/history', authRequired, validateQuery(historyQuerySchema), scanController.history);
router.get('/:scanId', authRequired, validateParams(scanIdSchema), scanController.findOne);
router.post('/:scanId/messages', authRequired, validateParams(scanIdSchema), validateBody(appendMessageSchema), scanController.appendMessages);
router.delete('/:scanId', authRequired, validateParams(scanIdSchema), scanController.remove);

module.exports = router;
