const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { createCard, getCards, updateCard, moveCard, deleteCard, assignCard } = require('../controllers/card.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(protect);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 }),
    body('listId').isMongoId().withMessage('Invalid list ID'),
    body('boardId').isMongoId().withMessage('Invalid board ID'),
  ],
  validate,
  createCard
);

router.get(
  '/:listId',
  [param('listId').isMongoId().withMessage('Invalid list ID')],
  validate,
  getCards
);

router.put(
  '/:id/move',
  [
    param('id').isMongoId().withMessage('Invalid card ID'),
    body('sourceListId').isMongoId().withMessage('Invalid source list ID'),
    body('destListId').isMongoId().withMessage('Invalid destination list ID'),
    body('position').isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
  ],
  validate,
  moveCard
);

router.put(
  '/:id/assign',
  [
    param('id').isMongoId().withMessage('Invalid card ID'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  assignCard
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid card ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 500 }),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
    body('labels').optional().isArray(),
  ],
  validate,
  updateCard
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid card ID')],
  validate,
  deleteCard
);

module.exports = router;
