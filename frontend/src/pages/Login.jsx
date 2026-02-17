import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { setToken, setUser } from '../utils/auth';
import toast from 'react-hot-toast';
import { FaSpinner } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { token, _id, name, email } = response.data;

      setToken(token);
      setUser({ _id, name, email });

      toast.success('Login successful!');
      // Short delay so toast is visible and transition feels smooth
      await new Promise((r) => setTimeout(r, 200));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || error.message || 'Login failed');
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
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to SplitX
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Smart Expense Splitter
          </p>
        </div>
        
        <form className="mt-6 sm:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 block w-full px-4 py-3 sm:py-2.5 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your email"
                aria-describedby="email-description"
              />
              <p id="email-description" className="sr-only">Enter your registered email address</p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                  tabIndex={loading ? -1 : 0}
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 block w-full px-4 py-3 sm:py-2.5 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
                aria-describedby="password-description"
              />
              <p id="password-description" className="sr-only">Enter your account password</p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out shadow-md hover:shadow-lg active:scale-[0.98]"
              aria-busy={loading}
              aria-live="polite"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center space-y-2 pt-2">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                tabIndex={loading ? -1 : 0}
              >
                Sign up
              </Link>
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
              Sign up uses email OTP — we send a 6-digit code to your email; enter it on the sign up page.
            </p>
          </div>
        </form>
        <div className="text-center pt-4">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Built with <span className="text-red-500">❤️</span> by{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Prince Kumar
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
