const { Router } = require('express');
const { authRequired } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const productController = require('../controllers/product.controller');
const {
	validateCreateProduct,
	validateUpdateProduct,
	validateProductParams,
} = require('../validations/product.validation');

const router = Router();

router.get('/', authRequired, requireAdmin, productController.findMany);
router.get('/:id', authRequired, requireAdmin, validateProductParams, productController.findOne);
router.post('/', authRequired, requireAdmin, validateCreateProduct, productController.create);
router.put(
	'/:id',
	authRequired,
	requireAdmin,
	validateProductParams,
	validateUpdateProduct,
	productController.update
);
router.delete('/:id', authRequired, requireAdmin, validateProductParams, productController.remove);

module.exports = router;
