const { v4: uuidv4 } = require('uuid');
const Board = require('../models/Board');
const User = require('../models/User');
const InviteToken = require('../models/InviteToken');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

const sendInvite = async (req, res) => {
  try {
    const { email, boardId } = req.body;
    if (!email || !boardId) {
      return res.status(400).json({ message: 'Email and boardId are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is already a member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const alreadyMember = board.members.some(
        (m) => m.user.toString() === existingUser._id.toString()
      );
      if (alreadyMember) {
        return res.status(400).json({ message: 'User is already a board member' });
      }
    }

    const token = uuidv4();
    await InviteToken.create({
      token,
      email,
      board: boardId,
      invitedBy: req.user.id,
    });

    const inviteLink = `${process.env.CLIENT_URL}/invite/${token}`;
    await sendEmail({
      to: email,
      subject: `You've been invited to "${board.title}" on CollabBoard`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to CollabBoard!</h2>
          <p>You have been invited to join the board <strong>"${board.title}"</strong>.</p>
          <p>Click the link below to accept your invitation:</p>
          <a href="${inviteLink}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">
            Accept Invitation
          </a>
          <p>This link expires in 24 hours.</p>
          <p>If you did not expect this invitation, you can ignore this email.</p>
        </div>
      `,
    });

    // Create notification for board members (member_invited)
    await Notification.create({
      user: req.user.id,
      actor: req.user.id,
      type: 'member_invited',
      board: boardId,
      message: `invited ${email} to the board`,
    });

    res.json({ message: `Invitation sent to ${email}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await InviteToken.findOne({ token });

    if (!invite) {
      return res.status(404).json({ message: 'Invalid invitation token' });
    }
    if (invite.used) {
      return res.status(400).json({ message: 'Invitation already used' });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    // Check if emails match (optional security check)
    if (user.email !== invite.email) {
      return res.status(403).json({ message: 'This invitation was sent to a different email address' });
    }

    const board = await Board.findById(invite.board);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const alreadyMember = board.members.some(
      (m) => m.user.toString() === user._id.toString()
    );

    if (!alreadyMember) {
      board.members.push({ user: user._id, role: 'member' });
      await board.save();
      await User.findByIdAndUpdate(user._id, { $push: { boards: board._id } });
    }

    invite.used = true;
    await invite.save();

    res.json({ message: 'Successfully joined the board', boardId: board._id, board });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendInvite, acceptInvite };
