import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaLock, FaCheck, FaTimes, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const preEmail = location.state?.email || '';
  const preOtp = location.state?.otp || '';

  const [form, setForm] = useState({
    email: preEmail,
    otp: preOtp,
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!preEmail || !preOtp) {
      // If no email or OTP in state, redirect to forgot password
      navigate('/forgot-password');
    }
  }, [preEmail, preOtp, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const levels = [
      { label: 'Very Weak', color: 'text-red-600 dark:text-red-400' },
      { label: 'Weak', color: 'text-orange-600 dark:text-orange-400' },
      { label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' },
      { label: 'Good', color: 'text-blue-600 dark:text-blue-400' },
      { label: 'Strong', color: 'text-green-600 dark:text-green-400' },
      { label: 'Very Strong', color: 'text-green-700 dark:text-green-500' },
    ];

    return {
      strength,
      label: levels[strength]?.label || '',
      color: levels[strength]?.color || '',
    };
  };

  const passwordStrength = getPasswordStrength(form.newPassword);
  const passwordsMatch = form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword;
  const passwordsDontMatch = form.confirmPassword && form.newPassword !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    
    if (form.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({
        email: form.email.trim().toLowerCase(),
        otp: form.otp.trim(),
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      
      if (response.data?.success) {
        toast.success('Password reset successful! Please login with your new password.');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      }
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || 'Password reset failed');
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
            to="/verify-reset-otp"
            onClick={(e) => {
              e.preventDefault();
              navigate('/verify-reset-otp', { state: { email: form.email } });
            }}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 sm:mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
            tabIndex={loading ? -1 : 0}
          >
            <FaArrowLeft className="mr-2" aria-hidden="true" />
            Back
          </Link>
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <FaLock className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        <form className="mt-6 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={form.newPassword}
                onChange={handleChange}
                disabled={loading}
                minLength={6}
                className="mt-1 block w-full px-4 py-3 sm:py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter new password"
                autoComplete="new-password"
                aria-describedby="password-description"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded disabled:opacity-50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {form.newPassword && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {form.newPassword.length} characters
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      passwordStrength.strength <= 1
                        ? 'bg-red-500'
                        : passwordStrength.strength <= 2
                        ? 'bg-orange-500'
                        : passwordStrength.strength <= 3
                        ? 'bg-yellow-500'
                        : passwordStrength.strength <= 4
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <div className="mt-2 space-y-1">
                  <div className={`flex items-center text-xs ${form.newPassword.length >= 6 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {form.newPassword.length >= 6 ? <FaCheck className="mr-1.5" aria-hidden="true" /> : <FaTimes className="mr-1.5" aria-hidden="true" />}
                    At least 6 characters
                  </div>
                  <div className={`flex items-center text-xs ${/[a-z]/.test(form.newPassword) && /[A-Z]/.test(form.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {/[a-z]/.test(form.newPassword) && /[A-Z]/.test(form.newPassword) ? <FaCheck className="mr-1.5" aria-hidden="true" /> : <FaTimes className="mr-1.5" aria-hidden="true" />}
                    Upper and lowercase letters
                  </div>
                  <div className={`flex items-center text-xs ${/\d/.test(form.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {/\d/.test(form.newPassword) ? <FaCheck className="mr-1.5" aria-hidden="true" /> : <FaTimes className="mr-1.5" aria-hidden="true" />}
                    At least one number
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                minLength={6}
                className={`mt-1 block w-full px-4 py-3 sm:py-2.5 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                  passwordsDontMatch
                    ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                    : passwordsMatch
                    ? 'border-green-500 dark:border-green-500 focus:ring-green-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Confirm new password"
                autoComplete="new-password"
                aria-describedby="confirm-password-description"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded disabled:opacity-50"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p id="confirm-password-description" className="sr-only">Confirm your new password</p>
            {passwordsMatch && (
              <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center">
                <FaCheck className="mr-1.5" aria-hidden="true" />
                Passwords match
              </p>
            )}
            {passwordsDontMatch && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center">
                <FaTimes className="mr-1.5" aria-hidden="true" />
                Passwords do not match
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !passwordsMatch || form.newPassword.length < 6}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out shadow-md hover:shadow-lg active:scale-[0.98]"
              aria-busy={loading}
              aria-live="polite"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
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

export default ResetPassword;
