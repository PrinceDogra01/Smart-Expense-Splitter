const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getGroupBalances,
  getBalanceSummary,
} = require('../controllers/balanceController');

router.use(protect); // All routes require authentication

router.get('/summary', getBalanceSummary);
router.get('/group/:groupId', getGroupBalances);

module.exports = router;

