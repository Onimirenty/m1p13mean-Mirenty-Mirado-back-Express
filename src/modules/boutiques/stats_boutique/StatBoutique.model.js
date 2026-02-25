const mongoose = require("mongoose");

const statsBoutiqueSchema = new mongoose.Schema(
  {
    boutiqueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      required: true,
      index: true
    },

    periodType: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY"],
      required: true
    },

    periodStart: {
      type: Date,
      required: true
    },

    periodEnd: {
      type: Date,
      required: true
    },

    metrics: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

statsBoutiqueSchema.index(
  { boutiqueId: 1, periodStart: 1 },
  { unique: true }
);

module.exports = mongoose.model("StatsBoutique", statsBoutiqueSchema);