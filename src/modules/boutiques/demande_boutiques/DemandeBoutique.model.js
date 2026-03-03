const mongoose = require("mongoose");
const logger = require('../../../utils/logger');


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
      required: true
    },


    contact: {
      telephone: String,
      emailBoutique: String
    },
    logoUrl: {
      type: String,
      default: null
    },

    logoPublicId: {
      type: String,
      default: null
    },
    opening: {
      days: {
        firstDay: String,
        lastDay: String
      }, // e.g. ["Monday", "Tuesday"]
      hours: {
        openingTime: String, // e.g. "09:00"
        closingTime: String  // e.g. "18:00"
      }
    },
    password: {
      type: String,
      // required: [true, 'Password is required'],
      minlength: 6,
      select: false
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