const Expense = require('../models/Expense');
const Group = require('../models/Group');

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { title, amount, paidBy, group, splitType, splits, description, category, date } = req.body;

    if (!title || !amount || !group) {
      return res.status(400).json({ message: 'Please provide title, amount, and group' });
    }

    // Verify group exists and user is a member
    const groupDoc = await Group.findById(group);
    if (!groupDoc) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = groupDoc.members.some(m => m.toString() === (paidBy || req.user._id).toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Calculate splits
    let expenseSplits = [];
    if (splitType === 'equal') {
      // Equal split among all members
      const memberIds = groupDoc.members.map(m => m.toString());
      const perPersonAmount = amount / memberIds.length;

      expenseSplits = memberIds.map(memberId => ({
        userId: memberId,
        amount: perPersonAmount,
        percentage: (1 / memberIds.length) * 100,
      }));
    } else if (splitType === 'custom' && splits && splits.length > 0) {
      // Custom split
      const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalSplit - amount) > 0.01) {
        return res.status(400).json({ message: 'Split amounts must equal the total amount' });
      }

      expenseSplits = splits.map(split => ({
        userId: split.userId,
        amount: split.amount,
        percentage: (split.amount / amount) * 100,
      }));
    } else {
      return res.status(400).json({ message: 'Invalid split type or splits data' });
    }

    const expense = await Expense.create({
      title,
      amount,
      paidBy: paidBy || req.user._id,
      group,
      splitType,
      splits: expenseSplits,
      description: description || '',
      category: category || 'Other',
      date: date ? new Date(date) : new Date(),
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('group', 'name')
      .populate('splits.userId', 'name email');

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all expenses for a group
// @route   GET /api/expenses/group/:groupId
// @access  Private
const getExpensesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('group', 'name')
      .populate('splits.userId', 'name email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email')
      .populate('group', 'name')
      .populate('splits.userId', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify user is a member of the group
    const group = await Group.findById(expense.group._id);
    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify user is a member of the group
    const group = await Group.findById(expense.group);
    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, amount, splitType, splits, description, category, date } = req.body;

    if (title) expense.title = title;
    if (amount !== undefined) expense.amount = amount;
    if (splitType) expense.splitType = splitType;
    if (description !== undefined) expense.description = description;
    if (category) expense.category = category;
    if (date) expense.date = new Date(date);

    // Recalculate splits if amount or splitType changed
    if (amount !== undefined || splitType) {
      if (expense.splitType === 'equal') {
        const memberIds = group.members.map(m => m.toString());
        const perPersonAmount = expense.amount / memberIds.length;
        expense.splits = memberIds.map(memberId => ({
          userId: memberId,
          amount: perPersonAmount,
          percentage: (1 / memberIds.length) * 100,
        }));
      } else if (expense.splitType === 'custom' && splits) {
        const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalSplit - expense.amount) > 0.01) {
          return res.status(400).json({ message: 'Split amounts must equal the total amount' });
        }
        expense.splits = splits.map(split => ({
          userId: split.userId,
          amount: split.amount,
          percentage: (split.amount / expense.amount) * 100,
        }));
      }
    }

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('group', 'name')
      .populate('splits.userId', 'name email');

    res.json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify user is a member of the group
    const group = await Group.findById(expense.group);
    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all expenses for current user
// @route   GET /api/expenses
// @access  Private
const getMyExpenses = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id });
    const groupIds = groups.map(g => g._id);

    const expenses = await Expense.find({
      group: { $in: groupIds },
    })
      .populate('paidBy', 'name email')
      .populate('group', 'name')
      .populate('splits.userId', 'name email')
      .sort({ date: -1 })
      .limit(50); // Limit to recent 50 expenses

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createExpense,
  getExpensesByGroup,
  getExpense,
  updateExpense,
  deleteExpense,
  getMyExpenses,
};

