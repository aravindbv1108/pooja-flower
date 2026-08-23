const asyncHandler = require('../utils/asyncHandler');
const Master = require('../models/Master');
const Task = require('../models/Task');

// GET /api/masters?search=&status=&sort=&page=&limit=
const getMasters = asyncHandler(async (req, res) => {
  const { search = '', status, sort = 'newest', page = 1, limit = 20 } = req.query;

  const filter = { owner: req.user._id };
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (status) filter.status = status;

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_high: { price: -1 },
    price_low: { price: 1 },
  };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, parseInt(limit));

  const [masters, total] = await Promise.all([
    Master.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Master.countDocuments(filter),
  ]);

  // Attach per-master usage stats (tasks + quantity + earnings)
  const masterIds = masters.map((m) => m._id);
  const stats = await Task.aggregate([
    { $match: { owner: req.user._id, master: { $in: masterIds } } },
    {
      $group: {
        _id: '$master',
        totalTasks: { $sum: 1 },
        totalQuantity: { $sum: '$totalQuantity' },
        totalEarnings: { $sum: '$totalAmount' },
      },
    },
  ]);
  const statMap = new Map(stats.map((s) => [String(s._id), s]));

  const enriched = masters.map((m) => {
    const s = statMap.get(String(m._id));
    return {
      ...m.toObject(),
      totalTasks: s?.totalTasks || 0,
      totalQuantity: s?.totalQuantity || 0,
      totalEarnings: s?.totalEarnings || 0,
    };
  });

  res.json({
    success: true,
    data: enriched,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getMaster = asyncHandler(async (req, res) => {
  const master = await Master.findOne({ _id: req.params.id, owner: req.user._id });
  if (!master) return res.status(404).json({ success: false, message: 'Master not found.' });
  res.json({ success: true, data: master });
});

const createMaster = asyncHandler(async (req, res) => {
  const { name, price, unit, customUnit, note } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Flower garland name is required.' });
  if (price === undefined || Number(price) <= 0)
    return res.status(400).json({ success: false, message: 'Price must be greater than 0.' });
  if (!unit) return res.status(400).json({ success: false, message: 'Unit is required.' });
  if (unit === 'Other' && !customUnit) return res.status(400).json({ success: false, message: 'Custom unit is required when Unit is Other.' });

  const master = await Master.create({
    owner: req.user._id,
    name: name.trim(),
    price: Number(price),
    unit,
    customUnit: unit === 'Other' ? customUnit : '',
    note: note || '',
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: master });
});

const updateMaster = asyncHandler(async (req, res) => {
  const master = await Master.findOne({ _id: req.params.id, owner: req.user._id });
  if (!master) return res.status(404).json({ success: false, message: 'Master not found.' });

  const { name, price, unit, customUnit, note, status } = req.body;

  if (price !== undefined && Number(price) <= 0)
    return res.status(400).json({ success: false, message: 'Price must be greater than 0.' });

  if (name !== undefined) master.name = name.trim();
  if (price !== undefined) master.price = Number(price);
  if (unit !== undefined) master.unit = unit;
  if (customUnit !== undefined) master.customUnit = customUnit;
  if (note !== undefined) master.note = note;
  if (status !== undefined) master.status = status;

  await master.save();
  // NOTE: existing tasks keep their own price/unit snapshot - not touched here.
  res.json({ success: true, data: master });
});

const deleteMaster = asyncHandler(async (req, res) => {
  const master = await Master.findOne({ _id: req.params.id, owner: req.user._id });
  if (!master) return res.status(404).json({ success: false, message: 'Master not found.' });

  const usedByTasks = await Task.exists({ master: master._id });
  if (usedByTasks) {
    // Soft delete / archive instead of destroying financial history
    master.status = 'Archived';
    await master.save();
    return res.json({ success: true, message: 'Master is used by existing tasks, so it was archived instead of deleted.', data: master });
  }

  await master.deleteOne();
  res.json({ success: true, message: 'Master deleted.' });
});

module.exports = { getMasters, getMaster, createMaster, updateMaster, deleteMaster };
