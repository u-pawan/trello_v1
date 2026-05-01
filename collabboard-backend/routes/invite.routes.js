const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sendInvite, acceptInvite } = require('../controllers/invite.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Too many invitations sent, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/',
  protect,
  inviteLimiter,
  [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('boardId').isMongoId().withMessage('Invalid board ID'),
  ],
  validate,
  sendInvite
);

router.get(
  '/:token',
  protect,
  [param('token').notEmpty().withMessage('Token is required')],
  validate,
  acceptInvite
);

module.exports = router;
