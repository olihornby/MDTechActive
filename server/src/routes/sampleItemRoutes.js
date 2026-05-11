const express = require('express');

const {
  listSampleItems,
  getSampleItemById,
  createSampleItem,
  updateSampleItem,
  deleteSampleItem,
} = require('../controllers/sampleItemController');

const router = express.Router();

router.get('/', listSampleItems);
router.get('/:id', getSampleItemById);
router.post('/', createSampleItem);
router.patch('/:id', updateSampleItem);
router.delete('/:id', deleteSampleItem);

module.exports = router;
