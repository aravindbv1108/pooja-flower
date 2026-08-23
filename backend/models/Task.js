const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskName: { type: String, required: true },
    master: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true },
    masterNameSnapshot: { type: String, required: true },
    price: { type: Number, required: true }, // snapshot rate at time of task creation
    unit: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true, min: 1 },
    completedDays: { type: Number, default: 0 },
    missedDays: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 }, // earned so far (sum of completed day amounts)
    expectedAmount: { type: Number, default: 0 }, // sum of all planned day amounts
    totalPaid: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Pending', 'Partially Paid', 'Paid'], default: 'Pending' },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'], default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
