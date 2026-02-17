const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Settlement = require('../models/Settlement');

// Calculate balances for a group
const calculateBalances = async (groupId, userId = null) => {
  const expenses = await Expense.find({ 
    group: groupId,
    isSettled: false 
  }).populate('paidBy', 'name email').populate('splits.userId', 'name email');

  const balances = {}; // { userId: { totalPaid: 0, totalOwed: 0, netBalance: 0 } }

  expenses.forEach(expense => {
    const paidBy = expense.paidBy._id.toString();
    
    // Initialize balances
    if (!balances[paidBy]) {
      balances[paidBy] = { 
        totalPaid: 0, 
        totalOwed: 0, 
        netBalance: 0,
        user: expense.paidBy 
      };
    }

    balances[paidBy].totalPaid += expense.amount;

    // Process splits
    expense.splits.forEach(split => {
      const userId = split.userId._id ? split.userId._id.toString() : split.userId.toString();
      
      if (!balances[userId]) {
        balances[userId] = { 
          totalPaid: 0, 
          totalOwed: 0, 
          netBalance: 0,
          user: split.userId 
        };
      }

      balances[userId].totalOwed += split.amount;
    });
  });

  // Calculate net balance
  Object.keys(balances).forEach(userId => {
    balances[userId].netBalance = balances[userId].totalPaid - balances[userId].totalOwed;
  });

  // Filter by user if specified
  if (userId) {
    return balances[userId] || { totalPaid: 0, totalOwed: 0, netBalance: 0, user: null };
  }

  return balances;
};

// Minimize settlements using a greedy algorithm
const minimizeSettlements = (balances) => {
  const settlements = [];
  const balanceEntries = Object.entries(balances)
    .map(([userId, balance]) => ({
      userId,
      balance: balance.netBalance,
      user: balance.user,
    }))
    .filter(item => Math.abs(item.balance) > 0.01) // Ignore zero balances
    .sort((a, b) => a.balance - b.balance); // Sort by balance (debtors first)

  let i = 0;
  let j = balanceEntries.length - 1;

  while (i < j) {
    const debtor = balanceEntries[i];
    const creditor = balanceEntries[j];

    if (Math.abs(debtor.balance) < 0.01) {
      i++;
      continue;
    }
    if (Math.abs(creditor.balance) < 0.01) {
      j--;
      continue;
    }

    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

    settlements.push({
      fromUser: debtor.userId,
      fromUserName: debtor.user?.name || debtor.userId,
      toUser: creditor.userId,
      toUserName: creditor.user?.name || creditor.userId,
      amount: parseFloat(amount.toFixed(2)),
    });

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j--;
  }

  return settlements;
};

// @desc    Get balances for a group
// @route   GET /api/balances/group/:groupId
// @access  Private
const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Verify user is a member of the group
    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const balances = await calculateBalances(groupId);

    // Format balances for response
    const formattedBalances = Object.entries(balances).map(([userId, balance]) => ({
      userId,
      user: balance.user,
      totalPaid: parseFloat(balance.totalPaid.toFixed(2)),
      totalOwed: parseFloat(balance.totalOwed.toFixed(2)),
      netBalance: parseFloat(balance.netBalance.toFixed(2)),
    }));

    // Get minimized settlements
    const settlements = minimizeSettlements(balances);

    res.json({
      group: {
        _id: group._id,
        name: group.name,
      },
      balances: formattedBalances,
      settlements,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user's overall balance summary
// @route   GET /api/balances/summary
// @access  Private
const getBalanceSummary = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id });
    
    let totalPaid = 0;
    let totalOwed = 0;
    const groupBalances = [];

    for (const group of groups) {
      const balances = await calculateBalances(group._id.toString());
      const userBalance = balances[req.user._id.toString()];

      if (userBalance) {
        totalPaid += userBalance.totalPaid;
        totalOwed += userBalance.totalOwed;

        groupBalances.push({
          group: {
            _id: group._id,
            name: group.name,
          },
          totalPaid: parseFloat(userBalance.totalPaid.toFixed(2)),
          totalOwed: parseFloat(userBalance.totalOwed.toFixed(2)),
          netBalance: parseFloat(userBalance.netBalance.toFixed(2)),
        });
      }
    }

    const netBalance = totalPaid - totalOwed;

    res.json({
      totalPaid: parseFloat(totalPaid.toFixed(2)),
      totalOwed: parseFloat(totalOwed.toFixed(2)),
      netBalance: parseFloat(netBalance.toFixed(2)),
      groupBalances,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getGroupBalances,
  getBalanceSummary,
  calculateBalances,
  minimizeSettlements,
};

