const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { createBoard, getBoards, getBoardById, updateBoard, deleteBoard } = require('../controllers/board.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireBoardAdmin } = require('../middleware/role.middleware');
const validate = require('../middleware/validate');

router.use(protect);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title too long'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  ],
  validate,
  createBoard
);

router.get('/', getBoards);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid board ID')],
  validate,
  getBoardById
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid board ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  requireBoardAdmin,
  updateBoard
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid board ID')],
  validate,
  requireBoardAdmin,
  deleteBoard
);

module.exports = router;
