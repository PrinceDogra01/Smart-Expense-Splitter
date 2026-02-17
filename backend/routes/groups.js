const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { inviteLimiter } = require('../middleware/rateLimit');
const {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMember,
  inviteMember,
} = require('../controllers/groupController');
const { getGroupInvites } = require('../controllers/inviteController');

router.use(protect); // All routes require authentication

router.route('/')
  .post(createGroup)
  .get(getGroups);

router.route('/:id')
  .get(getGroup)
  .put(updateGroup)
  .delete(deleteGroup);

router.put('/:id/members', addMembers);
router.delete('/:id/members/:memberId', removeMember);
router.get('/:id/invites', getGroupInvites);
router.post('/:id/invite', inviteLimiter, inviteMember);

module.exports = router;

