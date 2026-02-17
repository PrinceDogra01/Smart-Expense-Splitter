const User = require('../models/User');
const Otp = require('../models/Otp');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const GroupInvite = require('../models/GroupInvite');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendMail, isEmailConfigured } = require('../utils/email');

const OTP_COOLDOWN_SECONDS = 60;
const OTP_SIGNUP_TTL_SECONDS = 600; // 10 min
const OTP_PASSWORD_RESET_TTL_SECONDS = 300; // 5 min

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production', {
    expiresIn: '30d',
  });
};

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

// @desc    Send OTP to email for signup verification
// @route   POST /api/auth/send-signup-otp
// @access  Public
const sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const emailTrimmed = email ? String(email).trim().toLowerCase() : '';
    if (!emailTrimmed) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    const userExists = await User.findOne({ email: emailTrimmed });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    if (!isEmailConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please try again later or contact support.',
      });
    }

    // Rate limit: prevent multiple OTP requests within 60 seconds per email
    const recentOtp = await Otp.findOne({
      email: emailTrimmed,
      purpose: 'signup',
      createdAt: { $gte: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000) },
    }).sort({ createdAt: -1 });
    if (recentOtp) {
      const waitSec = Math.ceil((recentOtp.createdAt.getTime() + OTP_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec} seconds before requesting another OTP.`,
      });
    }

    await Otp.deleteMany({ email: emailTrimmed, purpose: 'signup' });
    const otpPlain = generateOtp();
    await Otp.createOtp(emailTrimmed, otpPlain, OTP_SIGNUP_TTL_SECONDS, 'signup');

    await sendMail({
      to: emailTrimmed,
      subject: 'SplitX – Verify your email (sign up)',
      text: `Your verification code is: ${otpPlain}. It expires in ${OTP_SIGNUP_TTL_SECONDS / 60} minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px;">
          <h2 style="color: #4f46e5;">SplitX – Verify your email</h2>
          <p>Use this code to complete your sign up:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otpPlain}</p>
          <p style="color: #6b7280;">This code expires in ${OTP_SIGNUP_TTL_SECONDS / 60} minutes.</p>
          <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Check your inbox and enter the code below.',
    });
  } catch (error) {
    console.error('[Auth] Send signup OTP error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.',
    });
  }
};

// @desc    Register a new user (requires OTP verification)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;
    const emailTrimmed = email ? String(email).trim().toLowerCase() : '';

    if (!name || !emailTrimmed || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }
    if (!otp || !String(otp).trim()) {
      return res.status(400).json({ message: 'Please enter the OTP sent to your email' });
    }

    const userExists = await User.findOne({ email: emailTrimmed });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const record = await Otp.findOne({ email: emailTrimmed, purpose: 'signup' }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ message: 'No OTP found or it has expired. Please request a new one.' });
    const match = await record.compareOtp(String(otp).trim());
    if (!match) return res.status(400).json({ message: 'Invalid OTP' });

    const user = await User.create({
      name: String(name).trim(),
      email: emailTrimmed,
      password,
    });

    await Otp.deleteMany({ email: emailTrimmed, purpose: 'signup' });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user and password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete account (optionally delete all user data)
// @route   POST /api/auth/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { deleteData } = req.body;

    if (deleteData === true) {
      // Delete all groups created by user, then their expenses/settlements/invites
      const groupsCreated = await Group.find({ createdBy: userId }).select('_id');
      const groupIds = groupsCreated.map((g) => g._id);
      await Expense.deleteMany({ group: { $in: groupIds } });
      await Settlement.deleteMany({ group: { $in: groupIds } });
      await GroupInvite.deleteMany({ group: { $in: groupIds } });
      await Group.deleteMany({ createdBy: userId });
    }

    // Remove user from all groups they're a member of
    await Group.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );
    // Delete groups that have no members left
    await Group.deleteMany({ members: { $size: 0 } });
    await GroupInvite.deleteMany({ inviter: userId });

    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  sendSignupOtp,
  deleteAccount,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};

// -----------------------
// Forgot password handlers
// -----------------------

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const emailTrimmed = email ? String(email).trim().toLowerCase() : '';
    if (!emailTrimmed) return res.status(400).json({ success: false, message: 'Please provide an email' });

    const user = await User.findOne({ email: emailTrimmed });
    if (!user) return res.status(404).json({ success: false, message: 'No user found with that email' });

    if (!isEmailConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please try again later or contact support.',
      });
    }

    const recentOtp = await Otp.findOne({
      email: emailTrimmed,
      purpose: 'password_reset',
      createdAt: { $gte: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000) },
    }).sort({ createdAt: -1 });
    if (recentOtp) {
      const waitSec = Math.ceil((recentOtp.createdAt.getTime() + OTP_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec} seconds before requesting another OTP.`,
      });
    }

    await Otp.deleteMany({ email: emailTrimmed, purpose: 'password_reset' });
    const otpPlain = generateOtp();
    await Otp.createOtp(emailTrimmed, otpPlain, OTP_PASSWORD_RESET_TTL_SECONDS, 'password_reset');

    await sendMail({
      to: emailTrimmed,
      subject: 'SplitX – Password reset code',
      text: `Your password reset code is: ${otpPlain}. It expires in ${OTP_PASSWORD_RESET_TTL_SECONDS / 60} minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family: sans-serif;">
          <h2 style="color: #4f46e5;">SplitX – Password reset</h2>
          <p>Your code: <strong style="letter-spacing: 4px;">${otpPlain}</strong></p>
          <p style="color: #6b7280;">It expires in ${OTP_PASSWORD_RESET_TTL_SECONDS / 60} minutes.</p>
        </div>
      `,
    });

    return res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('[Auth] Forgot password error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
}

// POST /api/auth/verify-reset-otp
async function verifyResetOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const emailTrimmed = email ? String(email).trim().toLowerCase() : '';
    
    if (!emailTrimmed || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const record = await Otp.findOne({ 
      email: emailTrimmed, 
      purpose: 'password_reset' 
    }).sort({ createdAt: -1 });
    
    if (!record) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found or it has expired. Please request a new one.' 
      });
    }

    // Check if OTP has expired
    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check if max attempts exceeded
    if (record.attempts >= record.maxAttempts) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum verification attempts exceeded. Please request a new OTP.' 
      });
    }

    const match = await record.compareOtp(String(otp).trim());
    
    if (!match) {
      // Increment attempts
      record.attempts += 1;
      await record.save();
      
      const remainingAttempts = record.maxAttempts - record.attempts;
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` 
      });
    }

    // OTP verified successfully
    return res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('[Auth] Verify reset OTP error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    const emailTrimmed = email ? String(email).trim().toLowerCase() : '';
    
    if (!emailTrimmed || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const record = await Otp.findOne({ 
      email: emailTrimmed, 
      purpose: 'password_reset' 
    }).sort({ createdAt: -1 });
    
    if (!record) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found or it has expired. Please request a new one.' 
      });
    }

    // Check if OTP has expired
    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check if max attempts exceeded
    if (record.attempts >= record.maxAttempts) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum verification attempts exceeded. Please request a new OTP.' 
      });
    }

    const match = await record.compareOtp(String(otp).trim());
    if (!match) {
      // Increment attempts
      record.attempts += 1;
      await record.save();
      
      const remainingAttempts = record.maxAttempts - record.attempts;
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` 
      });
    }

    const user = await User.findOne({ email: emailTrimmed }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Delete all OTPs for this email and purpose
    await Otp.deleteMany({ email: emailTrimmed, purpose: 'password_reset' });

    return res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('[Auth] Reset password error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

