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

    productSlug: {
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

    status: {
      type: String,
      enum: ["AVAILABLE", "SOLD_OUT", "INACTIVE"],
      default: "AVAILABLE",
      index: true
    }
  },
  { timestamps: true }
);

produitSchema.index({ boutiqueId: 1, productSlug: 1 }, { unique: true });

produitSchema.pre('save', async function () {
  try {
    if (this.isModified('status')){
        this.status = this.status.toUpperCase();
    }
    if(this.status){
        this.status = this.status.toUpperCase();
    }
  } catch (error) {
    logger.error('insert failed', { error });
    throw error
  }
});
module.exports = mongoose.model("Produit", produitSchema);