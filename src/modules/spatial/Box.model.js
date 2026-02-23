const mongoose = require("mongoose");

const boxSchema = new mongoose.Schema(
  {
    etage: {
      type: Number,
      required: true,
    },

    bloc: {
      type: String,
      required: [true, "Bloc(theme) is required"],
      trim: true,
      uppercase: true
    },

    numero: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "PENDING", "OCCUPIED"],
      default: "AVAILABLE",
      index: true
    },

    boutiqueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      default: null
    },

    centreCommercialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CentreCommercial",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

boxSchema.index(
  { centreCommercialId: 1, etage: 1, bloc: 1, numero: 1 },
  { unique: true }
);

boxSchema.pre("save", function (next) {
  if (this.status === "OCCUPIED" && !this.boutiqueId) {
    return next(new Error("OCCUPIED box must have boutiqueId"));
  }

  if (this.status === "AVAILABLE") {
    this.boutiqueId = null;
  }

  next();
});

module.exports = mongoose.model("Box", boxSchema);