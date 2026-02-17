const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth');
const {
  getInviteByToken,
  acceptInvite,
  resendInvite,
  cancelInvite,
} = require('../controllers/inviteController');

// Public: get invite details by token (for accept page)
router.get('/', getInviteByToken);

// Accept invite (optional auth - if logged in, add to group; else return needsAuth)
router.post('/accept', optionalProtect, acceptInvite);

// Protected: resend and cancel
router.post('/:id/resend', protect, resendInvite);
router.delete('/:id', protect, cancelInvite);

module.exports = router;
