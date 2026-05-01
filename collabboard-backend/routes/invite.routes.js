const express = require('express');
const router = express.Router();
const { sendInvite, acceptInvite } = require('../controllers/invite.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, sendInvite);
router.get('/:token', protect, acceptInvite);

module.exports = router;
