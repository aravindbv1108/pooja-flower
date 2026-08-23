const express = require('express');
const router = express.Router();
const {
  getStats, getEarnings, getQuantity, getTaskStatus, getPaymentSummary, getRecentActivity,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', getStats);
router.get('/earnings', getEarnings);
router.get('/quantity', getQuantity);
router.get('/task-status', getTaskStatus);
router.get('/payment-summary', getPaymentSummary);
router.get('/recent-activity', getRecentActivity);

module.exports = router;
