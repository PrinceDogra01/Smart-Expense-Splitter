import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { inviteAPI } from '../services/api';
import { isAuthenticated } from '../utils/auth';
import toast from 'react-hot-toast';

const PENDING_INVITE_TOKEN_KEY = 'pendingInviteToken';

export function getPendingInviteToken() {
  return sessionStorage.getItem(PENDING_INVITE_TOKEN_KEY);
}

export function setPendingInviteToken(token) {
  if (token) sessionStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
  else sessionStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
}

export function clearPendingInviteToken() {
  sessionStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
}

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link. Missing token.');
      setLoading(false);
      return;
    }
    setPendingInviteToken(token);

    const fetchInvite = async () => {
      try {
        const res = await inviteAPI.getByToken(token);
        setInviteInfo(res.data);
        setError(null);
      } catch (err) {
        const msg = err.response?.data?.message || 'This invitation is invalid or has expired.';
        setError(msg);
        setInviteInfo(null);
        clearPendingInviteToken();
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleJoin = async () => {
    if (!token || !inviteInfo) return;
    setJoining(true);
    try {
      const res = await inviteAPI.accept(token);
      clearPendingInviteToken();
      toast.success(res.data.message || 'You have joined the group!');
      navigate(`/groups/${res.data.group._id}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invitation unavailable</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            to="/dashboard"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const expiry = inviteInfo.expiresAt ? new Date(inviteInfo.expiresAt).toLocaleString() : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">You're invited!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          <strong className="text-gray-900 dark:text-white">{inviteInfo.inviterName}</strong> has invited you to join the group <strong className="text-gray-900 dark:text-white">{inviteInfo.groupName}</strong> on SplitX.
        </p>
        {expiry && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Invitation expires: {expiry}</p>
        )}

        {isAuthenticated() ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {joining ? 'Joining...' : 'Join Group'}
            </button>
            <Link to="/dashboard" className="block text-center text-sm text-gray-500 dark:text-gray-400 hover:underline">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Sign in or create an account to join this group.</p>
            <Link
              to="/login"
              className="block w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 text-center transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="block w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-center transition-colors"
            >
              Create account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
