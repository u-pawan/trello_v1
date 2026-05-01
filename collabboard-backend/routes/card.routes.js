const express = require('express');
const router = express.Router();
const {
  createCard,
  getCards,
  updateCard,
  moveCard,
  deleteCard,
  assignCard,
} = require('../controllers/card.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createCard);
router.get('/:listId', getCards);
router.put('/:id/move', moveCard);
router.put('/:id/assign', assignCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

module.exports = router;
