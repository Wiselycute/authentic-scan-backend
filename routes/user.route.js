const { Router } = require("express");
const router = Router();
const { isLogin } = require("../utils/middlewares/auth.middleware");
const userController = require("../src/controllers/user.controller");
const authController = require("../src/controllers/auth.controller");
const {
	userUpdateValidation,
	userIdParamValidation,
} = require("../utils/validations/user.validation");
const {
	registerValidation,
	loginValidation,
	requestOtpValidation,
	verifyOtpValidation,
} = require("../src/validations/auth.validation");

// router.use(admin);

router.post('/register/request-otp', requestOtpValidation, authController.requestRegisterOtp);
router.post('/register/verify-otp', verifyOtpValidation, authController.verifyRegisterOtp);
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/', userController.findMany);
router.get('/profile', isLogin, userController.getProfile);
router.post('/verify-auth', isLogin, userController.verifyAuth);
router.get('/find/:id', userIdParamValidation, isLogin, userController.find);
router.put('/update/:id', userIdParamValidation, userUpdateValidation, userController.update);
router.delete('/delete/:id', userIdParamValidation, userController.remove);

module.exports = router;
