const mongoose = require("mongoose");

const produitSchema = new mongoose.Schema(
  {
    boutiqueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    ProductSlug: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },

    description: String,

    prix: {
      type: Number,
      required: true
    },

    images: [String],

    statut: {
      type: String,
      enum: ["AVAILABLE", "SOLD_OUT", "INACTIVE"],
      default: "AVAILABLE",
      index: true
    }
  },
  { timestamps: true }
);

produitSchema.index({ boutiqueId: 1, ProductSlug: 1 }, { unique: true });

module.exports = mongoose.model("Produit", produitSchema);