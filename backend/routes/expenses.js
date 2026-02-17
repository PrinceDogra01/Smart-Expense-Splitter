const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createExpense,
  getExpensesByGroup,
  getExpense,
  updateExpense,
  deleteExpense,
  getMyExpenses,
} = require('../controllers/expenseController');

router.use(protect); // All routes require authentication

router.route('/')
  .post(createExpense)
  .get(getMyExpenses);

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

router.get('/group/:groupId', getExpensesByGroup);

module.exports = router;

