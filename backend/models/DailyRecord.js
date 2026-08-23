const mongoose = require('mongoose');

const dailyRecordSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    dayNumber: { type: Number, required: true },
    date: { type: Date, required: true },
    quantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, required: true },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, default: 0, min: 0 }, // = quantity * rate, computed server-side
    status: { type: String, enum: ['NOT_STARTED', 'PENDING', 'COMPLETED', 'MISSED'], default: 'NOT_STARTED' },
    note: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

dailyRecordSchema.index({ task: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model('DailyRecord', dailyRecordSchema);
