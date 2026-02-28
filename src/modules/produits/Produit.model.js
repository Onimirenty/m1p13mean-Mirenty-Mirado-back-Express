const mongoose = require("mongoose");
const utils = require("../../utils/Utils");
const logger = require("../../utils/logger");

const produitSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    productSlug: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
    },
    prix: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    boutiqueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      required: true,
      index: true,
    },
    categorieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorie",
      required: true,
      index: true,
    },
    images: [
      {
        type: String, // URLs des images
      }
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

// Index composé pour s'assurer qu'une boutique n'a pas deux produits avec le même nom

produitSchema.pre('save', async function (next) {
  try {
    if (this.isModified('nom')) {
      this.productSlug = utils.generateSlug(this.nom);
    }
  } catch (error) {
    logger.error('Product slug generation failed', { error });
    next(error);
  }
});

produitSchema.index({ boutiqueId: 1, productSlug: 1 }, { unique: true });


module.exports = mongoose.model("Produit", produitSchema);