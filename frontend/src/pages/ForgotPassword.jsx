import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaEnvelope, FaSpinner } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    
    setLoading(true);
    
    try {
      const response = await authAPI.forgotPassword({ email: email.trim().toLowerCase() });
      toast.success(response.data?.message || 'OTP sent to your email');
      // Navigate to OTP verification page with email
      navigate('/verify-reset-otp', { 
        state: { email: email.trim().toLowerCase() },
        replace: true 
      });
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || 'Failed to send OTP');
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
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 sm:mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
            tabIndex={loading ? -1 : 0}
          >
            <FaArrowLeft className="mr-2" aria-hidden="true" />
            Back to Login
          </Link>
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <FaEnvelope className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Forgot Password?
          </h2>
          <p className="mt-2 text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Enter your registered email address and we'll send you a 6-digit OTP to reset your password.
          </p>
        </div>

        <form className="mt-6 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full px-4 py-3 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="you@example.com"
              autoComplete="email"
              aria-describedby="email-description"
            />
            <p id="email-description" className="sr-only">Enter your registered email address to receive password reset OTP</p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out shadow-md hover:shadow-lg active:scale-[0.98]"
              aria-busy={loading}
              aria-live="polite"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Remember your password?{' '}
              <Link 
                to="/login" 
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                tabIndex={loading ? -1 : 0}
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
