const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const DailyRecord = require('../models/DailyRecord');
const { calculateDailyAmount } = require('../utils/calculations');
const { recalculateTask } = require('./taskController');

const getDays = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, owner: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const days = await DailyRecord.find({ task: task._id }).sort({ dayNumber: 1 });
  res.json({ success: true, data: days });
});

// Used only for edge cases (e.g. extending a task with an extra day). Normal flow
// creates all days automatically when the task itself is created.
const addDay = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, owner: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const lastDay = await DailyRecord.findOne({ task: task._id }).sort({ dayNumber: -1 });
  const dayNumber = (lastDay?.dayNumber || 0) + 1;
  const { date, quantity = 0 } = req.body;

  const amount = calculateDailyAmount(quantity, task.price);
  const record = await DailyRecord.create({
    owner: req.user._id,
    task: task._id,
    dayNumber,
    date: date ? new Date(date) : new Date(),
    quantity,
    unit: task.unit,
    rate: task.price,
    amount,
    status: quantity > 0 ? 'COMPLETED' : 'NOT_STARTED',
    createdBy: req.user._id,
  });

  task.totalDays += 1;
  await task.save();
  await recalculateTask(task._id);

  res.status(201).json({ success: true, data: record });
});

// PUT /api/tasks/:taskId/days/:dayId  - update quantity/date/status for a day.
// Backend always recomputes the amount; it never trusts a client-sent amount.
const updateDay = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, owner: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const record = await DailyRecord.findOne({ _id: req.params.dayId, task: task._id });
  if (!record) return res.status(404).json({ success: false, message: 'Day record not found.' });

  const { date, quantity, status, note } = req.body;

  if (quantity !== undefined) {
    if (Number(quantity) < 0) return res.status(400).json({ success: false, message: 'Quantity cannot be negative.' });
    record.quantity = Number(quantity);
    record.amount = calculateDailyAmount(record.quantity, record.rate); // server-side recalculation, never trust frontend
  }
  if (date !== undefined) record.date = new Date(date);
  if (note !== undefined) record.note = note;

  if (status !== undefined) {
    const valid = ['NOT_STARTED', 'PENDING', 'COMPLETED', 'MISSED'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    record.status = status;
    if (status === 'MISSED') {
      record.quantity = 0;
      record.amount = 0;
    }
  } else if (quantity !== undefined && record.status === 'NOT_STARTED' && record.quantity > 0) {
    record.status = 'COMPLETED';
  }

  await record.save();
  const updatedTask = await recalculateTask(task._id);

  res.json({ success: true, data: { record, task: updatedTask } });
});

const deleteDay = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, owner: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const record = await DailyRecord.findOne({ _id: req.params.dayId, task: task._id });
  if (!record) return res.status(404).json({ success: false, message: 'Day record not found.' });

  await record.deleteOne();
  await recalculateTask(task._id);

  res.json({ success: true, message: 'Day record deleted.' });
});

module.exports = { getDays, addDay, updateDay, deleteDay };
