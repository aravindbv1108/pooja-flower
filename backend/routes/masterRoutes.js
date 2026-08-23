const express = require('express');
const router = express.Router();
const { getMasters, getMaster, createMaster, updateMaster, deleteMaster } = require('../controllers/masterController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getMasters).post(createMaster);
router.route('/:id').get(getMaster).put(updateMaster).delete(deleteMaster);

module.exports = router;
