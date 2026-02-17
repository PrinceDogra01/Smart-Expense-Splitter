const Settlement = require('../models/Settlement');

// @desc    Create payment order (Razorpay-ready structure)
// @route   POST /api/payments/create-order
// @access  Private
const createPaymentOrder = async (req, res) => {
  try {
    const { settlementId, amount } = req.body;

    if (!settlementId || !amount) {
      return res.status(400).json({ message: 'Please provide settlementId and amount' });
    }

    const settlement = await Settlement.findById(settlementId)
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email');

    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    // Verify user is the payer
    if (settlement.fromUser._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // In production, integrate with Razorpay here
    // For now, return a mock order structure
    const order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100, // Razorpay expects amount in paise (multiply by 100)
      currency: 'INR',
      receipt: `settlement_${settlementId}`,
      status: 'created',
      createdAt: new Date(),
      settlementId: settlement._id,
    };

    // In production: const razorpayOrder = await razorpay.orders.create(order);

    res.json({
      order,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_key', // Razorpay key (use env variable in production)
      // In production, return: razorpayOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify payment (Razorpay webhook handler)
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, settlementId } = req.body;

    if (!orderId || !paymentId || !signature || !settlementId) {
      return res.status(400).json({ message: 'Missing required payment details' });
    }

    // In production, verify Razorpay signature
    // const crypto = require('crypto');
    // const text = orderId + '|' + paymentId;
    // const generatedSignature = crypto
    //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(text)
    //   .digest('hex');
    // 
    // if (generatedSignature !== signature) {
    //   return res.status(400).json({ message: 'Invalid signature' });
    // }

    // For now, simulate successful verification
    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    settlement.status = 'paid';
    settlement.paymentId = paymentId;
    settlement.paymentDate = new Date();

    await settlement.save();

    res.json({
      success: true,
      message: 'Payment verified and settlement marked as paid',
      settlement,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get payment history for a user
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    const settlements = await Settlement.find({
      $or: [
        { fromUser: req.user._id },
        { toUser: req.user._id },
      ],
      status: 'paid',
    })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('group', 'name')
      .sort({ paymentDate: -1 })
      .limit(50);

    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
};

