const Settlement = require('../models/Settlement');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { minimizeSettlements, calculateBalances } = require('./balanceController');

// @desc    Get settlements for a group
// @route   GET /api/settlements/group/:groupId
// @access  Private
const getSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Verify user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const settlements = await Settlement.find({ group: groupId })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('group', 'name')
      .sort({ createdAt: -1 });

    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a settlement (mark expense as settled)
// @route   POST /api/settlements
// @access  Private
const createSettlement = async (req, res) => {
  try {
    const { fromUser, toUser, groupId, amount, expenseIds } = req.body;

    if (!fromUser || !toUser || !groupId || !amount) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Verify group and membership
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Verify the settlement is for the current user
    if (fromUser !== req.user._id.toString() && toUser !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only create settlements involving yourself' });
    }

    const settlement = await Settlement.create({
      fromUser,
      toUser,
      group: groupId,
      amount,
      expenses: expenseIds || [],
      status: 'pending',
    });

    const populatedSettlement = await Settlement.findById(settlement._id)
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('group', 'name');

    res.status(201).json(populatedSettlement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update settlement status (mark as paid)
// @route   PUT /api/settlements/:id
// @access  Private
const updateSettlement = async (req, res) => {
  try {
    const { status, paymentId } = req.body;

    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    // Verify user is involved in the settlement
    const isInvolved = 
      settlement.fromUser.toString() === req.user._id.toString() ||
      settlement.toUser.toString() === req.user._id.toString();

    if (!isInvolved) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (status) settlement.status = status;
    if (paymentId) settlement.paymentId = paymentId;
    if (status === 'paid') {
      settlement.paymentDate = new Date();

      // Mark related expenses as settled
      if (settlement.expenses && settlement.expenses.length > 0) {
        await Expense.updateMany(
          { _id: { $in: settlement.expenses } },
          { isSettled: true }
        );
      }
    }

    await settlement.save();

    const populatedSettlement = await Settlement.findById(settlement._id)
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('group', 'name');

    res.json(populatedSettlement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get suggested settlements for a group
// @route   GET /api/settlements/group/:groupId/suggestions
// @access  Private
const getSettlementSuggestions = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const balances = await calculateBalances(groupId);
    const suggestions = minimizeSettlements(balances);

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSettlements,
  createSettlement,
  updateSettlement,
  getSettlementSuggestions,
};

