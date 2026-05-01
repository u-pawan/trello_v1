const express = require('express');
const router = express.Router();
const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
} = require('../controllers/board.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireBoardAdmin } = require('../middleware/role.middleware');

router.use(protect);

router.post('/', createBoard);
router.get('/', getBoards);
router.get('/:id', getBoardById);
router.put('/:id', requireBoardAdmin, updateBoard);
router.delete('/:id', requireBoardAdmin, deleteBoard);

module.exports = router;
