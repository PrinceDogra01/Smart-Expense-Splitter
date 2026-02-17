import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaKey, FaSpinner, FaRedo } from 'react-icons/fa';

const VerifyResetOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const preEmail = location.state?.email || '';
  
  const [form, setForm] = useState({ email: preEmail, otp: '' });
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!preEmail) {
      // If no email in state, redirect to forgot password
      navigate('/forgot-password');
    }
  }, [preEmail, navigate]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (e) => {
    const value = e.target.value;
    // Only allow digits for OTP
    if (e.target.name === 'otp') {
      if (value === '' || /^\d+$/.test(value)) {
        setForm({ ...form, [e.target.name]: value.slice(0, 6) });
      }
    } else {
      setForm({ ...form, [e.target.name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    
    if (form.otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.verifyResetOtp({
        email: form.email.trim().toLowerCase(),
        otp: form.otp.trim(),
      });
      
      if (response.data?.success) {
        toast.success('OTP verified successfully!');
        navigate('/reset-password', { 
          state: { email: form.email.trim().toLowerCase(), otp: form.otp.trim() },
          replace: true 
        });
      }
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return; // Prevent double clicks
    
    setResendLoading(true);
    try {
      const response = await authAPI.resendResetOtp({ 
        email: form.email.trim().toLowerCase() 
      });
      toast.success(response.data?.message || 'OTP resent to your email');
      setCooldown(30); // 30 second cooldown
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-md w-full space-y-6 sm:space-y-8 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700"
      >
        <div>
          <Link
            to="/forgot-password"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 sm:mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
            tabIndex={loading ? -1 : 0}
          >
            <FaArrowLeft className="mr-2" aria-hidden="true" />
            Back
          </Link>
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <FaKey className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Verify OTP
          </h2>
          <p className="mt-2 text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Enter the 6-digit code sent to <span className="font-medium break-all">{form.email}</span>
          </p>
        </div>

        <form className="mt-6 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Verification Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={form.otp}
              onChange={handleChange}
              disabled={loading}
              maxLength={6}
              className="mt-1 block w-full px-4 py-3 sm:py-2.5 text-center text-xl sm:text-2xl font-bold tracking-[0.3em] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="000000"
              autoComplete="one-time-code"
              aria-describedby="otp-description"
            />
            <p id="otp-description" className="sr-only">Enter the 6-digit verification code sent to your email</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              {form.otp.length}/6 digits
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || form.otp.length !== 6}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out shadow-md hover:shadow-lg active:scale-[0.98]"
              aria-busy={loading}
              aria-live="polite"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>
          </div>

          <div className="text-center space-y-3 pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || cooldown > 0}
              className="text-sm sm:text-base font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
            >
              {resendLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
                  Sending...
                </>
              ) : cooldown > 0 ? (
                <>
                  <FaRedo className="mr-2" aria-hidden="true" />
                  Resend OTP in {cooldown}s
                </>
              ) : (
                <>
                  <FaRedo className="mr-2" aria-hidden="true" />
                  Resend OTP
                </>
              )}
            </button>
            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Didn't receive the code?{' '}
              <Link 
                to="/forgot-password" 
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                tabIndex={loading ? -1 : 0}
              >
                Try again
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default VerifyResetOtp;
