const { Router } = require('express');
const { authRequired } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');
const {
	registerValidation,
	loginValidation,
	requestOtpValidation,
	verifyOtpValidation,
} = require('../validations/auth.validation');

const router = Router();

router.post('/register/request-otp', requestOtpValidation, authController.requestRegisterOtp);
router.post('/register/verify-otp', verifyOtpValidation, authController.verifyRegisterOtp);
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', authRequired, authController.me);

module.exports = router;
