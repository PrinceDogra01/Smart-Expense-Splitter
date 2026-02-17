const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['signup', 'password_reset'],
    default: 'password_reset',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 3,
  },
});

// TTL index: document will be removed once expiresAt passes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Helper to create and hash an OTP before saving (static)
otpSchema.statics.createOtp = async function (email, otpPlain, ttlSeconds = 300, purpose = 'password_reset') {
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otpPlain, salt);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  return this.create({ email, otpHash, expiresAt, purpose });
};

// Compare provided plain OTP with stored hash
otpSchema.methods.compareOtp = async function (otpPlain) {
  return await bcrypt.compare(otpPlain, this.otpHash);
};

module.exports = mongoose.model('Otp', otpSchema);
