const mongoose = require("mongoose");
const logger = require('../../utils/logger')
const AppError = require('../../utils/AppError')

const DEFAULT_CENTRE_ID = new mongoose.Types.ObjectId(process.env.CM_ID);

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
      index: true,
      default: DEFAULT_CENTRE_ID
    },
    dimension: {
      length: { type: Number, required: false },
      width: { type: Number, required: false },
      height: { type: Number, required: false }
    },
    vanillaImageUrl: {
      type: String, required: false
    },
  },
  { timestamps: true }
);

boxSchema.index(
  { centreCommercialId: 1, etage: 1, bloc: 1, numero: 1 },
  { unique: true }
);

boxSchema.pre("save", function () {

  if (this.status === "OCCUPIED" && !this.boutiqueId) {
    throw new AppError("OCCUPIED box must have boutiqueId", 400);
  }

  if (this.status === "AVAILABLE") {
    this.boutiqueId = null;
  }
  if (this.status) {
    this.status = this.status.toUpperCase();
  }
  if (this.isModified('status')) {
    this.status = this.status.toUpperCase();

  }
});



module.exports = mongoose.model("Box", boxSchema);