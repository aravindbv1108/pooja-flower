const express = require('express');
const router = express.Router();
const { getTaskReport, getDailyReport, getMonthlyReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/task/:id', getTaskReport);
router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);

module.exports = router;
