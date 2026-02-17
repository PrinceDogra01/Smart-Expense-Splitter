import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { setToken, setUser } from '../utils/auth';
import toast from 'react-hot-toast';
import { FaSpinner } from 'react-icons/fa';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 30;

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const navigate = useNavigate();

  // Countdown for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'otp') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({ ...prev, otp: digitsOnly }));
      setOtpError('');
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') {
      setOtpSent(false);
      setResendCooldown(0);
      setFormData((prev) => ({ ...prev, otp: '' }));
      setOtpError('');
    }
  };

  const handleSendOtp = async () => {
    if (sendingOtp || resendCooldown > 0) return; // Prevent double clicks
    
    const email = formData.email.trim().toLowerCase();
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }
    if (!emailRe.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSendingOtp(true);
    setOtpError('');
    try {
      await authAPI.sendSignupOtp(email);
      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success('OTP sent successfully');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to send OTP';
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    
    setOtpError('');

    if (!otpSent) {
      toast.error('Please request an OTP first');
      return;
    }

    const otp = formData.otp.trim();
    if (otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, otp: otpValue, ...rest } = formData;
      const response = await authAPI.register({ ...rest, otp: otpValue.trim() });
      const { token, user } = response.data;

      setToken(token);
      setUser({ _id: user._id, name: user.name, email: user.email });

      toast.success('Registration successful!');
      await new Promise((r) => setTimeout(r, 200));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('invalid')) {
        setOtpError(msg);
      }
    }
  };

  const otpVerified = otpSent && formData.otp.length === 6;
  const canSubmit = otpVerified && !loading && formData.password && formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-md w-full bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700"
      >
        <div className="mb-6 sm:mb-8">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Join SplitX to split expenses smartly
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your name"
            />
          </div>

          {/* Email + Send OTP */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email address
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={loading || sendingOtp}
                className="flex-1 min-w-0 px-4 py-3 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your email"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || resendCooldown > 0 || loading}
                className="shrink-0 px-4 py-3 sm:py-2.5 rounded-lg bg-indigo-600 text-white text-sm sm:text-base font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                {sendingOtp ? (
                  <>
                    <FaSpinner className="inline animate-spin mr-2" aria-hidden="true" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend (${resendCooldown}s)`
                ) : otpSent ? (
                  'Resend OTP'
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
            {otpSent && resendCooldown === 0 && !sendingOtp && (
              <p className="mt-1.5 text-sm text-green-600 dark:text-green-400">OTP sent successfully. Check your email.</p>
            )}
          </div>

          {/* OTP input */}
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              OTP
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={formData.otp}
              onChange={handleChange}
              disabled={loading}
              onBlur={() => {
                if (formData.otp.length > 0 && formData.otp.length !== 6) {
                  setOtpError('OTP must be 6 digits');
                }
              }}
              placeholder="Enter 6-digit OTP"
              className={`w-full px-4 py-3 sm:py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all tracking-[0.3em] text-center text-lg sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                otpError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {otpError && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{otpError}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Min 6 characters"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Confirm your password"
            />
          </div>

          {/* Sign Up button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 px-4 rounded-lg text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out shadow-md hover:shadow-lg active:scale-[0.98]"
            aria-busy={loading}
            aria-live="polite"
          >
            {loading ? (
              <>
                <FaSpinner className="inline animate-spin mr-2" aria-hidden="true" />
                Creating account...
              </>
            ) : (
              'Sign up'
            )}
          </button>

          <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
              tabIndex={loading ? -1 : 0}
            >
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
