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
      index: true
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

    statut: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
      index: true
    },

    commentaireAdmin: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("DemandeBoutique", demandeBoutiqueSchema);