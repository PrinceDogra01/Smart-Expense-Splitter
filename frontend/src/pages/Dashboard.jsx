import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaUsers, FaRupeeSign, FaArrowUp, FaArrowDown, FaReceipt, FaBrain, FaExclamationTriangle } from 'react-icons/fa';
import { groupsAPI, inviteAPI, balancesAPI, expensesAPI } from '../services/api';
import { buildInsights } from '../utils/aiInsights';
import { getPendingInviteToken, clearPendingInviteToken } from './AcceptInvite';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // After login/register: if user had a pending invite, accept it and redirect to group
  useEffect(() => {
    const pendingToken = getPendingInviteToken();
    if (!pendingToken) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await inviteAPI.accept(pendingToken);
        clearPendingInviteToken();
        if (!cancelled && res.data?.group?._id) {
          toast.success(res.data.message || 'You have joined the group!');
          navigate(`/groups/${res.data.group._id}`, { replace: true });
          return;
        }
      } catch (err) {
        clearPendingInviteToken();
        toast.error(err.response?.data?.message || 'Invitation expired or invalid');
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, balanceRes, expensesRes] = await Promise.all([
        groupsAPI.getAll(),
        balancesAPI.getSummary(),
        expensesAPI.getAll(),
      ]);
      setGroups(groupsRes.data);
      setBalanceSummary(balanceRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const insights = useMemo(() => buildInsights(expenses), [expenses, buildInsights]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of your expenses and balances
          </p>
        </div>

        {/* Balance Summary Cards */}
        {balanceSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Total Paid
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    ₹{balanceSummary.totalPaid.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <FaRupeeSign className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Total Owed
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    ₹{balanceSummary.totalOwed.toFixed(2)}
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                  <FaReceipt className="text-orange-600 dark:text-orange-400" size={24} />
                </div>
              </div>
            </div>

            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${
              balanceSummary.netBalance >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Net Balance
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${
                    balanceSummary.netBalance >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {balanceSummary.netBalance >= 0 ? (
                      <span className="flex items-center">
                        <FaArrowUp className="mr-1" />
                        ₹{balanceSummary.netBalance.toFixed(2)}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaArrowDown className="mr-1" />
                        ₹{Math.abs(balanceSummary.netBalance).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  balanceSummary.netBalance >= 0 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : 'bg-red-100 dark:bg-red-900'
                }`}>
                  {balanceSummary.netBalance >= 0 ? (
                    <FaArrowUp className="text-green-600 dark:text-green-400" size={24} />
                  ) : (
                    <FaArrowDown className="text-red-600 dark:text-red-400" size={24} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI-Powered Insights (Beta) */}
        {expenses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-3 gap-2">
              <FaBrain className="text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI-Powered Insights <span className="text-xs font-semibold text-purple-500 uppercase tracking-wide">(Beta)</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Next month prediction */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  Predicted spend next month (all groups)
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{insights.prediction.total.toFixed(0)}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Based on recent monthly trends and moving averages.
                </p>
              </div>

              {/* Overspend warning */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Current month vs normal
                  </p>
                  {insights.overspend && (
                    <FaExclamationTriangle className="text-yellow-500" />
                  )}
                </div>
                {insights.overspend ? (
                  <>
                    <p className="text-sm mt-2 text-red-500 dark:text-red-400 font-semibold">
                      You are spending about {(insights.overspend.ratio * 100).toFixed(0)}% of your normal month.
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Typical month: ₹{insights.overspend.prevAvg.toFixed(0)} • This month: ₹{insights.overspend.thisMonthTotal.toFixed(0)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm mt-2 text-green-600 dark:text-green-400 font-semibold">
                    Your spending is within your usual range.
                  </p>
                )}
              </div>

              {/* Suggested budgets */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                  Suggested safe budgets per group
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto text-sm">
                  {groups.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      Create groups to see budget suggestions.
                    </p>
                  )}
                  {groups
                    .filter((g) => insights.budgets[g._id])
                    .sort((a, b) => (insights.budgets[b._id] || 0) - (insights.budgets[a._id] || 0))
                    .slice(0, 4)
                    .map((group) => (
                      <div key={group._id} className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-200">
                          {group.name}
                        </span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          ₹{insights.budgets[group._id].toFixed(0)}
                        </span>
                      </div>
                    ))}
                  {groups.filter((g) => insights.budgets[g._id]).length === 0 && groups.length > 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      Not enough history yet. Budgets appear after at least one full month of data.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Groups Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Groups
            </h2>
            <Link
              to="/groups/new"
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              <span>New Group</span>
            </Link>
          </div>

          {groups.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <FaUsers className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No groups yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first group to start splitting expenses
              </p>
              <Link
                to="/groups/new"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
                <span>Create Group</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <Link
                  key={group._id}
                  to={`/groups/${group._id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {group.name}
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      {group.type}
                    </span>
                  </div>
                  {group.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <FaUsers className="mr-2" />
                    <span>{group.members?.length || 0} members</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Group Balances Summary */}
        {balanceSummary && balanceSummary.groupBalances && balanceSummary.groupBalances.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Group Balances
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Owed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Net Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {balanceSummary.groupBalances.map((balance) => (
                      <tr key={balance.group._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/groups/${balance.group._id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {balance.group.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ₹{balance.totalPaid.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ₹{balance.totalOwed.toFixed(2)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          balance.netBalance >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {balance.netBalance >= 0 ? '+' : ''}₹{balance.netBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

