import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaSignOutAlt, FaMoon, FaSun, FaUserMinus, FaUser, FaHistory, FaBars, FaTimes } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { removeToken, removeUser, getUser } from '../utils/auth';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUserState] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState('choose'); // 'choose' | 'confirm'
  const [deleteDataChoice, setDeleteDataChoice] = useState(false); // true = delete account and data
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUserState(getUser());
  }, []);

  const doLogout = () => {
    setLoggingOut(true);
    try {
      localStorage.setItem('loggingOut', '1');
    } catch (e) {}
    // Small delay for smooth transition
    setTimeout(() => {
      removeToken();
      removeUser();
      navigate('/login', { replace: true });
      setTimeout(() => {
        try {
          localStorage.removeItem('loggingOut');
        } catch (e) {}
        setLoggingOut(false);
      }, 500);
    }, 200);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = (yes) => {
    setShowLogoutConfirm(false);
    if (yes) {
      // Slight delay so modal closes before redirect
      setTimeout(() => doLogout(), 150);
    }
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteModal(true);
    setDeleteStep('choose');
    setDeleteDataChoice(false);
  };

  const handleDeleteChoose = (withData) => {
    setDeleteDataChoice(withData);
    setDeleteStep('confirm');
  };

  const handleDeleteConfirm = async (yes) => {
    if (!yes) {
      setShowDeleteModal(false);
      setDeleteStep('choose');
      return;
    }
    setDeleting(true);
    try {
      await authAPI.deleteAccount(deleteDataChoice);
      toast.success('Account deleted');
      setShowDeleteModal(false);
      setDeleteStep('choose');
      doLogout();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <Link to="/dashboard" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  SplitX
                </span>
              </Link>
              
              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link
                  to="/profile"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <FaUser className="text-xs" />
                    <span>Profile</span>
                  </span>
                </Link>
                <Link
                  to="/activity"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/activity'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <FaHistory className="text-xs" />
                    <span>Activity</span>
                  </span>
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
              {user && (
                <span className="text-gray-700 dark:text-gray-300 text-sm hidden sm:block">
                  {user.name}
                </span>
              )}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              </button>
              <button
                onClick={handleDeleteAccountClick}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Delete account"
              >
                <FaUserMinus size={18} />
                <span className="hidden sm:inline text-sm">Delete account</span>
              </button>
              <button
                onClick={handleLogoutClick}
                disabled={loggingOut}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={loggingOut}
              >
                {loggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Logging out...</span>
                  </>
                ) : (
                  <>
                    <FaSignOutAlt />
                    <span className="hidden sm:inline">Logout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-4 py-3 space-y-1">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  location.pathname === '/profile'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FaUser />
                <span>Profile</span>
              </Link>
              <Link
                to="/activity"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  location.pathname === '/activity'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FaHistory />
                <span>Activity</span>
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Logout</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => handleLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => handleLogoutConfirm(true)}
                disabled={loggingOut}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loggingOut ? 'Logging out...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            {deleteStep === 'choose' ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete account</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Choose what you want to delete:</p>
                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={() => handleDeleteChoose(false)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-medium block">Delete account only</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Remove your account. You can sign up again with the same email.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteChoose(true)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <span className="font-medium block">Delete account and data</span>
                    <span className="text-xs opacity-90">Permanently delete your account and all your groups, expenses, and data.</span>
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {deleteDataChoice
                    ? 'This will permanently delete your account and all your data (groups, expenses). You will need to sign up again to use the app.'
                    : 'This will delete your account. You can sign up again with the same email.'}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteConfirm(true)}
                    disabled={deleting}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

