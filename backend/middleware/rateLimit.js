const rateLimit = require('express-rate-limit');

// Limit invite creation: 10 invites per 15 minutes per IP (and we'll key by user in route if needed)
const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many invitations sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { inviteLimiter };
