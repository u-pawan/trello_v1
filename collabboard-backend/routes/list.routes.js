const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { createList, getLists, updateList, deleteList, reorderLists } = require('../controllers/list.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(protect);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('boardId').isMongoId().withMessage('Invalid board ID'),
  ],
  validate,
  createList
);

router.get(
  '/:boardId',
  [param('boardId').isMongoId().withMessage('Invalid board ID')],
  validate,
  getLists
);

// reorder must come before /:id
router.put(
  '/reorder',
  [body('lists').isArray({ min: 1 }).withMessage('Lists array required')],
  validate,
  reorderLists
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid list ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }),
  ],
  validate,
  updateList
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid list ID')],
  validate,
  deleteList
);

module.exports = router;
