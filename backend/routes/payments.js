const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
} = require('../controllers/paymentController');

router.use(protect); // All routes require authentication

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);

module.exports = router;

