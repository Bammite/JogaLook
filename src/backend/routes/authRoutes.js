const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register',             authController.register);
router.post('/register-send-otp',    authController.registerSendOtp);
router.post('/register-resend-otp',  authController.registerResendOtp);
router.post('/register-verify-otp',  authController.registerVerifyOtp);
router.post('/login',                authController.login);
router.post('/verify-otp',           authController.verifyOtp);
router.get('/google/url',            authController.getGoogleUrl);
router.post('/google/callback',      authController.handleGoogleCallback);
router.get('/me',                    authController.me);
router.post('/logout',               authController.logout);

module.exports = router;
