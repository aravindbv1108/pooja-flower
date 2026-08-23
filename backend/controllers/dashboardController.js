const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const DailyRecord = require('../models/DailyRecord');
const Payment = require('../models/Payment');

// GET /api/dashboard/stats - all top-level stat cards, computed via aggregation
const getStats = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;

  const [taskAgg] = await Task.aggregate([
    { $match: { owner: ownerId } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$totalPaid' },
        pendingAmount: { $sum: '$pendingAmount' },
        totalQuantity: { $sum: '$totalQuantity' },
        totalTasks: { $sum: 1 },
        totalWorkingDays: { $sum: '$totalDays' },
        completedWorkingDays: { $sum: '$completedDays' },
        missedDays: { $sum: '$missedDays' },
        activeTasks: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
        completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
      },
    },
  ]);

  const stats = taskAgg || {
    totalEarnings: 0, totalPaid: 0, pendingAmount: 0, totalQuantity: 0,
    totalTasks: 0, totalWorkingDays: 0, completedWorkingDays: 0, missedDays: 0,
    activeTasks: 0, completedTasks: 0,
  };
  delete stats._id;

  res.json({ success: true, data: stats });
});

// GET /api/dashboard/earnings?range=7d|30d|3m|6m|1y|all
const getEarnings = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const { range = '30d' } = req.query;

  const rangeToDays = { '7d': 7, '30d': 30, '3m': 90, '6m': 180, '1y': 365 };
  const match = { owner: ownerId, status: 'COMPLETED' };

  if (range !== 'all' && rangeToDays[range]) {
    const since = new Date();
    since.setDate(since.getDate() - rangeToDays[range]);
    match.date = { $gte: since };
  }

  const data = await DailyRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        amount: { $sum: '$amount' },
        quantity: { $sum: '$quantity' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', amount: 1, quantity: 1 } },
  ]);

  res.json({ success: true, data });
});

const getQuantity = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const data = await DailyRecord.aggregate([
    { $match: { owner: ownerId, status: 'COMPLETED' } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, quantity: { $sum: '$quantity' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', quantity: 1 } },
  ]);
  res.json({ success: true, data });
});

const getTaskStatus = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const data = await Task.aggregate([
    { $match: { owner: ownerId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);
  res.json({ success: true, data });
});

const getPaymentSummary = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const [agg] = await Task.aggregate([
    { $match: { owner: ownerId } },
    { $group: { _id: null, totalEarned: { $sum: '$totalAmount' }, totalPaid: { $sum: '$totalPaid' }, totalPending: { $sum: '$pendingAmount' } } },
  ]);
  res.json({ success: true, data: agg || { totalEarned: 0, totalPaid: 0, totalPending: 0 } });
});

// Recent activity feed built from real DailyRecord and Payment timestamps
const getRecentActivity = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;

  const [recentDays, recentPayments] = await Promise.all([
    DailyRecord.find({ owner: ownerId, status: { $in: ['COMPLETED', 'MISSED'] } })
      .sort({ updatedAt: -1 }).limit(10).populate('task', 'taskName masterNameSnapshot'),
    Payment.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(10).populate('task', 'taskName masterNameSnapshot'),
  ]);

  const activity = [
    ...recentDays.map((d) => ({
      type: d.status === 'COMPLETED' ? 'day_completed' : 'day_missed',
      message: `${d.task?.masterNameSnapshot || 'Task'} — Day ${d.dayNumber} ${d.status === 'COMPLETED' ? 'completed' : 'marked as missed'}`,
      amount: d.amount,
      timestamp: d.updatedAt,
    })),
    ...recentPayments.map((p) => ({
      type: 'payment_recorded',
      message: `₹${p.amount} payment recorded for ${p.task?.masterNameSnapshot || 'a task'}`,
      amount: p.amount,
      timestamp: p.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);

  res.json({ success: true, data: activity });
});

module.exports = { getStats, getEarnings, getQuantity, getTaskStatus, getPaymentSummary, getRecentActivity };
