const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Other'], default: 'Cash' },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentSchema.index({ task: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
