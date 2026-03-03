const mongoose = require("mongoose");
const logger = require('../../utils/logger');
const AppError = require('../../utils/AppError');

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
      default: () => new mongoose.Types.ObjectId(process.env.CM_ID)
    },

    dimension: {
      length: { type: Number, required: false },
      width: { type: Number, required: false },
      height: { type: Number, required: false }
    },

    // URL de la photo de l'emplacement (vide ou occupé) affichée dans le frontend
    vanillaImageUrl: {
      type: String,
      required: false,
      default: null
    },

    // ID Cloudinary de la photo → conservé pour supprimer l'ancienne image
    // lors d'une mise à jour ou suppression de la box
    vanillaImagePublicId: {
      type: String,
      required: false,
      default: null
    },
  },
  { timestamps: true }
);

boxSchema.index(
  { centreCommercialId: 1, etage: 1, bloc: 1, numero: 1 },
  { unique: true }
);

// boxSchema.pre("save", function () {
//   if (this.status === "OCCUPIED" && !this.boutiqueId) {
//     throw new AppError("OCCUPIED box must have boutiqueId", 400);
//   }

//   if (this.status === "AVAILABLE") {
//     this.boutiqueId = null;
//   }

//   if (this.isModified('status')) {
//     this.status = this.status.toUpperCase();
//   }
// });

boxSchema.pre("save", function () {
  if (this.status === "OCCUPIED" && !this.boutiqueId) {
    const err = new Error("OCCUPIED box must have boutiqueId");
    err.name = "ValidationError";
    err.errors = {
      boutiqueId: { message: "OCCUPIED box must have boutiqueId" }
    };
    throw err;
  }

  if (this.status === "AVAILABLE") {
    this.boutiqueId = null;
  }

  if (this.isModified("status")) {
    this.status = this.status.toUpperCase();
  }
});

module.exports = mongoose.model("Box", boxSchema);