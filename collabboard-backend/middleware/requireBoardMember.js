const Board = require('../models/Board');
const AppError = require('../utils/AppError');

const requireBoardMember = async (req, res, next) => {
  try {
    const boardId = req.body.boardId || req.params.boardId || req.params.id;
    const board = await Board.findById(boardId);
    if (!board) throw new AppError('Board not found', 404);

    const isMember = board.members.some(
      (m) => m.user.toString() === req.user.id.toString()
    );
    if (!isMember) throw new AppError('Access denied', 403);

    req.board = board;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireBoardMember };
