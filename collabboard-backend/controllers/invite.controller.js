const { v4: uuidv4 } = require('uuid');
const Board = require('../models/Board');
const User = require('../models/User');
const InviteToken = require('../models/InviteToken');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const AppError = require('../utils/AppError');

const sendInvite = async (req, res) => {
  const { email, boardId } = req.body;

  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);

  // Only board admins can invite
  const requestingMember = board.members.find(
    (m) => m.user.toString() === req.user.id.toString()
  );
  if (!requestingMember || requestingMember.role !== 'admin') {
    throw new AppError('Only board admins can send invitations', 403);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const alreadyMember = board.members.some(
      (m) => m.user.toString() === existingUser._id.toString()
    );
    if (alreadyMember) throw new AppError('User is already a board member', 400);
  }

  // Invalidate any pending invites for this email+board
  await InviteToken.updateMany(
    { email, board: boardId, used: false },
    { used: true }
  );

  const token = uuidv4();
  await InviteToken.create({ token, email, board: boardId, invitedBy: req.user.id });

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

  // Notify board members about the invite (not self-notification)
  const boardMembers = board.members.filter(
    (m) => m.user.toString() !== req.user.id.toString()
  );
  const io = req.app.get('io');
  for (const m of boardMembers) {
    const notif = await Notification.create({
      user: m.user,
      actor: req.user.id,
      type: 'member_invited',
      board: boardId,
      message: `invited ${email} to the board`,
    });
    io.to(`user:${m.user}`).emit('notification:new', notif);
  }

  res.json({ message: `Invitation sent to ${email}` });
};

const acceptInvite = async (req, res) => {
  const { token } = req.params;
  const invite = await InviteToken.findOne({ token });

  if (!invite) throw new AppError('Invalid invitation token', 404);
  if (invite.used) throw new AppError('Invitation already used', 400);
  if (invite.expiresAt < new Date()) throw new AppError('Invitation has expired', 400);

  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found. Please register first.', 404);

  if (user.email !== invite.email) {
    throw new AppError('This invitation was sent to a different email address', 403);
  }

  const board = await Board.findById(invite.board);
  if (!board) throw new AppError('Board not found', 404);

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
};

module.exports = { sendInvite, acceptInvite };
