const express = require('express');
const router = express.Router();
const { updatePayment, deletePayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/:id').put(updatePayment).delete(deletePayment);

module.exports = router;
