const mongoose = require("mongoose");
const utils = require("../../utils/Utils")

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

categorieSchema.pre('save', async function () {
  try {
    this.nom = utils.generateSlugPreserveCase(this.nom);
  } catch (error) {
    logger.error('Password hashing failed', { error });
    throw error
  }
});

module.exports = mongoose.model("Categorie", categorieSchema);