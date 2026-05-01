const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    list: { type: mongoose.Schema.Types.ObjectId, ref: 'List' },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    position: { type: Number, default: 0 },
    dueDate: { type: Date },
    labels: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Card', cardSchema);
