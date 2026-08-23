const mongoose = require('mongoose');

const masterSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      required: true,
      enum: ['Piece', 'KG', 'Meter', 'Bundle', 'Box', 'Packet', 'Dozen', 'Other'],
    },
    customUnit: { type: String, default: '' },
    note: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive', 'Archived'], default: 'Active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

masterSchema.index({ owner: 1, name: 1 });

masterSchema.virtual('displayUnit').get(function () {
  return this.unit === 'Other' ? this.customUnit : this.unit;
});
masterSchema.set('toJSON', { virtuals: true });
masterSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Master', masterSchema);
