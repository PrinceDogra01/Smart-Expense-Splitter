const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an expense title'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0, 'Amount must be positive'],
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  splitType: {
    type: String,
    enum: ['equal', 'custom'],
    default: 'equal',
  },
  splits: [splitSchema], // Array of how the expense is split
  description: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    default: 'Other',
  },
  isSettled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Expense', expenseSchema);

