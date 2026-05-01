const Board = require('../models/Board');

const requireBoardAdmin = async (req, res, next) => {
  try {
    const boardId = req.params.boardId || req.params.id;
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const member = board.members.find(
      (m) => m.user.toString() === req.user.id.toString()
    );

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.board = board;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { requireBoardAdmin };
