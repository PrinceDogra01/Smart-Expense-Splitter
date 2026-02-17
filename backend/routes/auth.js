const express = require('express');
const router = express.Router();
const { register, login, getMe, sendSignupOtp, deleteAccount, forgotPassword, verifyResetOtp, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-signup-otp', sendSignupOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/resend-reset-otp', forgotPassword); // Reuse forgotPassword for resend
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.post('/delete-account', protect, deleteAccount);

module.exports = router;

