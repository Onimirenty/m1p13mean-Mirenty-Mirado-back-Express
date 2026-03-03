// src/modules/views/View.model.js
const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['BOUTIQUE', 'PROMOTION', 'CENTRE'],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    // visitorKey = userId si connecté, UUID si non connecté
    visitorKey: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Index pour éviter de compter deux fois la même vue (même visiteur + même cible)
viewSchema.index({ targetType: 1, targetId: 1, visitorKey: 1 }, { unique: true });

module.exports = mongoose.model('View', viewSchema);
