const mongoose = require("mongoose");

const demandeBoutiqueSchema = new mongoose.Schema(
  {
    nomBoutique: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String
    },

    categorieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorie",
      required: true,
      index: true
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required : true
    },


    contact: {
      telephone: String,
      emailBoutique: String
    },

    documents: {
      rcsNumber: String,
      nifNumber: String,
      statNumber: String,
      rcsFileUrl: String,
      nifFileUrl: String,
      statFileUrl: String
    },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING"
    },
    boxIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Box",
        required: true,
        index: true
      }
    ],

    commentaireAdmin: String
  },
  { timestamps: true }
);

demandeBoutiqueSchema.index({ status: 1 });
demandeBoutiqueSchema.index({ ownerId: 1 });

demandeBoutiqueSchema.pre('save', async function () {
  try {
    this.status = this.status.toUpperCase();
  } catch (error) {
    logger.error('insert failed', { error });
    throw error
  }
});

module.exports = mongoose.model("DemandeBoutique", demandeBoutiqueSchema);