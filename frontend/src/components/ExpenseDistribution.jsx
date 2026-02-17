import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { FaCrown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f97316', // orange
  '#06b6d4', // cyan
];

const ExpenseDistribution = ({ expenses = [], members = [], groupName = '' }) => {
  const navigate = useNavigate();
  // Calculate total expense share per member
  const memberExpenseData = useMemo(() => {
    if (!expenses || expenses.length === 0 || !members || members.length === 0) {
      return [];
    }

    // Create a map to track total owed amount per member
    const memberTotals = {};
    
    // Initialize all members with 0
    members.forEach(member => {
      const memberId = String(member._id);
      memberTotals[memberId] = {
        memberId: memberId,
        memberName: member.name,
        totalOwed: 0,
      };
    });

    // Calculate total owed from all expenses
    expenses.forEach(expense => {
      if (expense.splits && Array.isArray(expense.splits)) {
        expense.splits.forEach(split => {
          // Handle both populated (object) and unpopulated (string ID) userId
          const userId = split.userId?._id 
            ? String(split.userId._id) 
            : split.userId 
            ? String(split.userId) 
            : null;
          
          if (userId && memberTotals[userId]) {
            memberTotals[userId].totalOwed += Number(split.amount || 0);
          }
        });
      }
    });

    // Convert to array and calculate percentages
    const totalExpense = Object.values(memberTotals).reduce(
      (sum, m) => sum + m.totalOwed, 
      0
    );

    const data = Object.values(memberTotals)
      .map(member => ({
        name: member.memberName,
        value: member.totalOwed,
        percentage: totalExpense > 0 ? (member.totalOwed / totalExpense) * 100 : 0,
        memberId: String(member.memberId),
      }))
      .filter(item => item.value > 0) // Only show members with expenses
      .sort((a, b) => b.value - a.value); // Sort by value descending

    return data;
  }, [expenses, members]);

  // Find the member with highest percentage
  const highestMember = memberExpenseData.length > 0 
    ? memberExpenseData[0] 
    : null;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom label function
  const renderLabel = (entry) => {
    return `${entry.name}: ${entry.percentage.toFixed(1)}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">
            {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Amount: <span className="font-medium">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Share: <span className="font-medium">{data.payload.percentage.toFixed(2)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (memberExpenseData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 max-w-md w-full">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Expense Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Add expenses to see the distribution breakdown
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Chart Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
        {/* Minimal Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 flex items-center gap-1 transition-colors"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {groupName ? `${groupName} - Expense Distribution` : 'Group Expense Distribution'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Visual breakdown of expense shares across group members
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Pie Chart */}
          <div className="w-full">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={memberExpenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={140}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {memberExpenseData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke={entry.memberId === highestMember?.memberId ? '#fbbf24' : 'none'}
                      strokeWidth={entry.memberId === highestMember?.memberId ? 3 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Member List with Details */}
          <div className="space-y-4">
            <div className="space-y-3">
              {memberExpenseData.map((member, index) => {
                const isHighest = member.memberId === highestMember?.memberId;
                return (
                  <motion.div
                    key={member.memberId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className={`relative bg-gradient-to-r ${
                      isHighest
                        ? 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-300 dark:border-amber-700'
                        : 'from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-600'
                    } rounded-xl p-5 shadow-md transition-all duration-300 hover:shadow-lg`}
                  >
                    {isHighest && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-white rounded-full p-2 shadow-lg">
                        <FaCrown className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          {member.name}
                          {isHighest && (
                            <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full font-medium">
                              Highest Share
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(member.value)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {member.percentage.toFixed(2)}% of total expenses
                        </p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${member.percentage}%` }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: memberExpenseData.length * 0.1 + 0.2, duration: 0.4 }}
              className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    Total Group Expenses
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(
                      memberExpenseData.reduce((sum, m) => sum + m.value, 0)
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    Active Members
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {memberExpenseData.length}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExpenseDistribution;

