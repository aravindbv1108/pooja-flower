const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const DailyRecord = require('../models/DailyRecord');
const Payment = require('../models/Payment');

// GET /api/reports/task/:id - full clearance/statement data for one task
const getTaskReport = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id }).populate('master', 'name');
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const [dailyRecords, payments] = await Promise.all([
    DailyRecord.find({ task: task._id }).sort({ dayNumber: 1 }),
    Payment.find({ task: task._id }).sort({ paymentDate: 1 }),
  ]);

  res.json({
    success: true,
    data: {
      business: {
        name: req.user.businessName,
        phone: req.user.phone,
        whatsapp: req.user.whatsapp,
        address: req.user.address,
        logoUrl: req.user.logoUrl,
        ownerName: req.user.ownerName,
        signatureLabel: req.user.signatureLabel,
        reportFooter: req.user.reportFooter,
      },
      task,
      dailyRecords,
      payments,
    },
  });
});

// GET /api/reports/daily?date=YYYY-MM-DD
const getDailyReport = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const target = date ? new Date(date) : new Date();
  const start = new Date(target); start.setHours(0, 0, 0, 0);
  const end = new Date(target); end.setHours(23, 59, 59, 999);

  const records = await DailyRecord.find({ owner: req.user._id, date: { $gte: start, $lte: end } })
    .populate('task', 'taskName masterNameSnapshot');

  const totalQuantity = records.reduce((s, r) => s + r.quantity, 0);
  const totalAmount = records.reduce((s, r) => s + r.amount, 0);

  res.json({ success: true, data: { date: start, records, totalQuantity, totalAmount } });
});

// GET /api/reports/monthly?year=&month=  (month 1-12)
const getMonthlyReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = parseInt(req.query.month) || now.getMonth() + 1;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const records = await DailyRecord.find({ owner: req.user._id, date: { $gte: start, $lte: end }, status: 'COMPLETED' });
  const payments = await Payment.find({ owner: req.user._id, paymentDate: { $gte: start, $lte: end } });

  const totalQuantity = records.reduce((s, r) => s + r.quantity, 0);
  const totalEarned = records.reduce((s, r) => s + r.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  res.json({ success: true, data: { year, month, totalQuantity, totalEarned, totalPaid, recordCount: records.length } });
});

module.exports = { getTaskReport, getDailyReport, getMonthlyReport };
