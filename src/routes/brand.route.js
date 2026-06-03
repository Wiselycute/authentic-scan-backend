const { Router } = require('express');
const { authRequired } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const brandController = require('../controllers/brand.controller');
const {
	validateCreateBrand,
	validateUpdateBrand,
	validateBrandParams,
} = require('../validations/brand.validation');

const router = Router();

router.get('/', authRequired, requireAdmin, brandController.findMany);
router.get('/:id', authRequired, requireAdmin, validateBrandParams, brandController.findOne);
router.post('/', authRequired, requireAdmin, validateCreateBrand, brandController.create);
router.put('/:id', authRequired, requireAdmin, validateBrandParams, validateUpdateBrand, brandController.update);
router.delete('/:id', authRequired, requireAdmin, validateBrandParams, brandController.remove);

module.exports = router;
