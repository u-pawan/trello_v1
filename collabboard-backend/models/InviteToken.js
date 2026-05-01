const mongoose = require('mongoose');

const inviteTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InviteToken', inviteTokenSchema);
