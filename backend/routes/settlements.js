const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSettlements,
  createSettlement,
  updateSettlement,
  getSettlementSuggestions,
} = require('../controllers/settlementController');

router.use(protect); // All routes require authentication

router.post('/', createSettlement);
router.get('/group/:groupId', getSettlements);
router.get('/group/:groupId/suggestions', getSettlementSuggestions);
router.put('/:id', updateSettlement);

module.exports = router;

