const mongoose = require("mongoose");

const categorieSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    iconClass: {
      type: String,
      required: true,
      unique: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

categorieSchema.index({ nom: 1 }, { unique: true });
module.exports = mongoose.model("Categorie", categorieSchema);