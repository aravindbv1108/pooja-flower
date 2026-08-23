const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const Master = require('../models/Master');
const DailyRecord = require('../models/DailyRecord');
const Payment = require('../models/Payment');
const { generateTaskName } = require('../utils/taskNaming');
const { aggregateTaskFromRecords, calculatePaymentStatus, round2 } = require('../utils/calculations');

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// GET /api/tasks?status=&master=&search=&page=&limit=
const getTasks = asyncHandler(async (req, res) => {
  const { status, master, search, page = 1, limit = 20 } = req.query;
  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (master) filter.master = master;
  if (search) filter.taskName = { $regex: search, $options: 'i' };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, parseInt(limit));

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: tasks,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const [dailyRecords, payments] = await Promise.all([
    DailyRecord.find({ task: task._id }).sort({ dayNumber: 1 }),
    Payment.find({ task: task._id }).sort({ paymentDate: -1 }),
  ]);

  res.json({ success: true, data: { task, dailyRecords, payments } });
});

// POST /api/tasks  - creates task + auto-generates all daily record placeholders
const createTask = asyncHandler(async (req, res) => {
  const { masterId, totalDays, startDate } = req.body;

  if (!masterId) return res.status(400).json({ success: false, message: 'Please select a master.' });
  if (!totalDays || Number(totalDays) <= 0)
    return res.status(400).json({ success: false, message: 'Total days must be greater than 0.' });
  if (!startDate) return res.status(400).json({ success: false, message: 'Start date is required.' });

  const master = await Master.findOne({ _id: masterId, owner: req.user._id });
  if (!master) return res.status(404).json({ success: false, message: 'Master not found.' });

  const days = parseInt(totalDays);
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return res.status(400).json({ success: false, message: 'Invalid start date.' });
  const end = addDays(start, days - 1);

  const unit = master.unit === 'Other' ? master.customUnit : master.unit;
  const taskName = generateTaskName(master.name, start, end);

  const task = await Task.create({
    owner: req.user._id,
    taskName,
    master: master._id,
    masterNameSnapshot: master.name,
    price: master.price, // snapshot - historical tasks stay accurate even if master price changes later
    unit,
    startDate: start,
    endDate: end,
    totalDays: days,
    status: 'ACTIVE',
    createdBy: req.user._id,
  });

  // Auto-generate placeholder daily records for every day in the task
  const records = [];
  for (let i = 0; i < days; i++) {
    records.push({
      owner: req.user._id,
      task: task._id,
      dayNumber: i + 1,
      date: addDays(start, i),
      quantity: 0,
      unit,
      rate: master.price,
      amount: 0,
      status: 'NOT_STARTED',
      createdBy: req.user._id,
    });
  }
  await DailyRecord.insertMany(records);

  res.status(201).json({ success: true, data: task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const { taskName, status } = req.body;
  if (taskName !== undefined) task.taskName = taskName;
  if (status !== undefined) task.status = status;
  await task.save();

  res.json({ success: true, data: task });
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { status },
    { new: true }
  );
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
  res.json({ success: true, data: task });
});

// Prefer archive over hard delete for tasks with financial history
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const hasPayments = await Payment.exists({ task: task._id });
  if (hasPayments || task.totalAmount > 0) {
    task.status = 'ARCHIVED';
    await task.save();
    return res.json({ success: true, message: 'Task has financial history, so it was archived instead of deleted.', data: task });
  }

  await DailyRecord.deleteMany({ task: task._id });
  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted.' });
});

/**
 * Recomputes and persists all aggregate fields on a task based on its
 * current daily records and payments. Called after any daily-record or
 * payment mutation to keep data consistent (see spec section 63).
 */
const recalculateTask = async (taskId) => {
  const task = await Task.findById(taskId);
  if (!task) return null;

  const records = await DailyRecord.find({ task: taskId });
  const agg = aggregateTaskFromRecords(records);

  const paymentAgg = await Payment.aggregate([
    { $match: { task: task._id } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalPaid = round2(paymentAgg[0]?.total || 0);

  task.completedDays = agg.completedDays;
  task.missedDays = agg.missedDays;
  task.totalQuantity = agg.totalQuantity;
  task.totalAmount = agg.totalAmount;
  task.expectedAmount = agg.expectedAmount;
  task.totalPaid = totalPaid;
  task.pendingAmount = round2(Math.max(agg.totalAmount - totalPaid, 0));
  task.paymentStatus = calculatePaymentStatus(agg.totalAmount, totalPaid);

  // Auto-complete task once every day is completed, unless user cancelled/archived it
  if (task.completedDays + task.missedDays >= task.totalDays && task.status === 'ACTIVE') {
    task.status = 'COMPLETED';
  } else if (task.completedDays + task.missedDays < task.totalDays && task.status === 'COMPLETED') {
    task.status = 'ACTIVE';
  }

  await task.save();
  return task;
};

module.exports = { getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask, recalculateTask };
