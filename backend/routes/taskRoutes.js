const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask } = require('../controllers/taskController');
const { getDays, addDay, updateDay, deleteDay } = require('../controllers/dailyRecordController');
const { getPayments, createPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.patch('/:id/status', updateTaskStatus);

router.route('/:taskId/days').get(getDays).post(addDay);
router.route('/:taskId/days/:dayId').put(updateDay).delete(deleteDay);

router.route('/:taskId/payments').get(getPayments).post(createPayment);

module.exports = router;
