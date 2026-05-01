const express = require('express');
const router = express.Router();
const {
  createList,
  getLists,
  updateList,
  deleteList,
  reorderLists,
} = require('../controllers/list.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createList);
router.get('/:boardId', getLists);
// reorder must come before /:id to avoid "reorder" being treated as an id
router.put('/reorder', reorderLists);
router.put('/:id', updateList);
router.delete('/:id', deleteList);

module.exports = router;
