const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const Payment = require('../models/Payment');
const { recalculateTask } = require('./taskController');

const getPayments = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, owner: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const payments = await Payment.find({ task: task._id }).sort({ paymentDate: -1 });
  res.json({ success: true, data: payments });
});

const createPayment = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, owner: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const { amount, paymentDate, paymentMethod, notes, allowAdvance } = req.body;

  if (!amount || Number(amount) <= 0)
    return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0.' });

  // By default, do not allow total paid to exceed total earned unless the
  // client explicitly opts into recording an advance payment.
  const wouldBePaid = task.totalPaid + Number(amount);
  if (wouldBePaid > task.totalAmount && !allowAdvance) {
    return res.status(400).json({
      success: false,
      message: `This payment would exceed the total earned amount (₹${task.totalAmount}). Enable "advance payment" to proceed anyway.`,
    });
  }

  const payment = await Payment.create({
    owner: req.user._id,
    task: task._id,
    amount: Number(amount),
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    paymentMethod: paymentMethod || 'Cash',
    notes: notes || '',
    createdBy: req.user._id,
  });

  const updatedTask = await recalculateTask(task._id);

  res.status(201).json({ success: true, data: { payment, task: updatedTask } });
});

const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, owner: req.user._id });
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

  const { amount, paymentDate, paymentMethod, notes } = req.body;
  if (amount !== undefined) {
    if (Number(amount) <= 0) return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
    payment.amount = Number(amount);
  }
  if (paymentDate !== undefined) payment.paymentDate = new Date(paymentDate);
  if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
  if (notes !== undefined) payment.notes = notes;

  await payment.save();
  const task = await recalculateTask(payment.task);

  res.json({ success: true, data: { payment, task } });
});

const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, owner: req.user._id });
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

  const taskId = payment.task;
  await payment.deleteOne();
  const task = await recalculateTask(taskId);

  res.json({ success: true, message: 'Payment deleted.', data: { task } });
});

module.exports = { getPayments, createPayment, updatePayment, deletePayment };
