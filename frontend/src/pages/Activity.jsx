import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { groupsAPI, expensesAPI, settlementsAPI } from '../services/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import {
  FaSpinner,
  FaUsers,
  FaReceipt,
  FaEdit,
  FaMoneyBillWave,
  FaCheckCircle,
  FaPlus,
  FaUserPlus,
  FaClock,
} from 'react-icons/fa';

const Activity = () => {
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getUser();

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const [groupsRes, expensesRes] = await Promise.all([
        groupsAPI.getAll(),
        expensesAPI.getAll(),
      ]);

      setGroups(groupsRes.data);
      setExpenses(expensesRes.data);

      // Fetch settlements for all groups (handle errors gracefully)
      const groupIds = groupsRes.data.map(g => g._id);
      if (groupIds.length > 0) {
        const settlementPromises = groupIds.map(groupId =>
          settlementsAPI.getByGroup(groupId).catch(() => ({ data: [] }))
        );
        const settlementResults = await Promise.all(settlementPromises);
        const allSettlements = settlementResults.flatMap(res => res.data || []);
        setSettlements(allSettlements);
      }
    } catch (error) {
      toast.error('Failed to load activity data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to relative time
  const formatTimeAgo = (date) => {
    if (!date) return 'Unknown time';
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  // Build activities from all data sources
  const activities = useMemo(() => {
    const activityList = [];

    // Group activities
    groups.forEach(group => {
      // Group created
      if (group.createdBy?._id && String(group.createdBy._id) === String(currentUser?._id)) {
        activityList.push({
          id: `group-created-${group._id}`,
          type: 'group_created',
          icon: FaUsers,
          iconColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900',
          description: `You created the group "${group.name}"`,
          groupName: group.name,
          groupId: group._id,
          timestamp: group.createdAt || new Date(),
        });
      }

      // User added to group (if not the creator)
      if (group.createdBy?._id && String(group.createdBy._id) !== String(currentUser?._id)) {
        activityList.push({
          id: `group-joined-${group._id}`,
          type: 'group_joined',
          icon: FaUserPlus,
          iconColor: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900',
          description: `You joined the group "${group.name}"`,
          groupName: group.name,
          groupId: group._id,
          timestamp: group.createdAt || new Date(),
        });
      }
    });

    // Expense activities
    expenses.forEach(expense => {
      const isPaidBy = expense.paidBy?._id && String(expense.paidBy._id) === String(currentUser?._id);
      const isInSplit = expense.splits?.some(split => {
        const userId = split.userId?._id || split.userId;
        return String(userId) === String(currentUser?._id);
      });

      if (isPaidBy || isInSplit) {
        // Expense added
        activityList.push({
          id: `expense-added-${expense._id}`,
          type: 'expense_added',
          icon: FaReceipt,
          iconColor: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-100 dark:bg-purple-900',
          description: isPaidBy
            ? `You added ₹${expense.amount.toFixed(2)} for "${expense.title}" in ${expense.group?.name || 'a group'}`
            : `Expense "${expense.title}" (₹${expense.amount.toFixed(2)}) was added in ${expense.group?.name || 'a group'}`,
          groupName: expense.group?.name || 'Unknown Group',
          groupId: expense.group?._id || expense.group,
          amount: expense.amount,
          timestamp: expense.createdAt || expense.date || new Date(),
        });

        // Note: Expense updates are not tracked separately in the current model
        // If needed, this can be added when expense update functionality is implemented
      }
    });

    // Settlement activities
    settlements.forEach(settlement => {
      const isFromUser = settlement.fromUser?._id && String(settlement.fromUser._id) === String(currentUser?._id);
      const isToUser = settlement.toUser?._id && String(settlement.toUser._id) === String(currentUser?._id);

      if (isFromUser || isToUser) {
        if (settlement.status === 'paid') {
          // Payment made
          activityList.push({
            id: `payment-${settlement._id}`,
            type: 'payment_made',
            icon: FaMoneyBillWave,
            iconColor: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900',
            description: isFromUser
              ? `You paid ₹${settlement.amount.toFixed(2)} to ${settlement.toUser?.name || 'someone'} in ${settlement.group?.name || 'a group'}`
              : `You received ₹${settlement.amount.toFixed(2)} from ${settlement.fromUser?.name || 'someone'} in ${settlement.group?.name || 'a group'}`,
            groupName: settlement.group?.name || 'Unknown Group',
            groupId: settlement.group?._id || settlement.group,
            amount: settlement.amount,
            timestamp: settlement.paymentDate || settlement.updatedAt || settlement.createdAt || new Date(),
          });
        } else if (settlement.status === 'pending') {
          // Settlement created
          activityList.push({
            id: `settlement-${settlement._id}`,
            type: 'settlement_created',
            icon: FaCheckCircle,
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-100 dark:bg-indigo-900',
            description: isFromUser
              ? `Settlement created: You owe ₹${settlement.amount.toFixed(2)} to ${settlement.toUser?.name || 'someone'} in ${settlement.group?.name || 'a group'}`
              : `Settlement created: ${settlement.fromUser?.name || 'Someone'} owes you ₹${settlement.amount.toFixed(2)} in ${settlement.group?.name || 'a group'}`,
            groupName: settlement.group?.name || 'Unknown Group',
            groupId: settlement.group?._id || settlement.group,
            amount: settlement.amount,
            timestamp: settlement.createdAt || new Date(),
          });
        }
      }
    });

    // Sort by timestamp (newest first)
    return activityList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [groups, expenses, settlements, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Activity
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Timeline of your recent activities across all groups
          </p>
        </div>

        {/* Activity Timeline */}
        {activities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-gray-100 dark:border-gray-700"
          >
            <FaClock className="mx-auto text-gray-400 mb-4" size={40} />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No activity yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              Your activities will appear here as you create groups, add expenses, and make payments.
            </p>
            <Link
              to="/groups/new"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <FaPlus />
              <span>Create Your First Group</span>
            </Link>
          </motion.div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100 dark:border-gray-700">
            <div className="relative">
              {/* Timeline line - hidden on very small screens, visible on sm+ */}
              <div className="hidden sm:block absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

              <div className="space-y-4 sm:space-y-6">
                {activities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="relative flex items-start space-x-3 sm:space-x-4"
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${activity.bgColor} flex items-center justify-center shadow-md`}>
                          <Icon className={`text-base sm:text-xl ${activity.iconColor}`} />
                        </div>
                      </div>

                      {/* Activity content */}
                      <div className="flex-1 min-w-0 pt-0 sm:pt-1">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium mb-2 break-words">
                            {activity.description}
                          </p>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <Link
                              to={activity.groupId ? `/groups/${activity.groupId}` : '#'}
                              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium break-all"
                            >
                              {activity.groupName}
                            </Link>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              <FaClock className="mr-1" />
                              {formatTimeAgo(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;

