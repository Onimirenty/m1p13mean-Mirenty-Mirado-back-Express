const mongoose = require("mongoose");
const { generateSlug } = require("../../utils/Utils");


const boutiqueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    boutiqueSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },

    description: String,

    categorieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorie",
      required: true,
      index: true
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true
    },

    contact: {
      phone: String,
      email: String
    },

    images: [
      {
        type: {
          type: String
        },
        url: String
      }
    ],
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
    statsSnapshot: {
      totalViews: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

//quand async throw ,quand pas async next 

boutiqueSchema.pre("validate", function () {
  // 1. Si un slug est fourni manuellement, on le nettoie (slugify + lowercase)
  if (this.boutiqueSlug ) {
    this.boutiqueSlug = generateSlug(this.boutiqueSlug);
  }
  // 2. Si AUCUN slug n'est fourni MAIS que le nom est présent/modifié
  else if (!this.boutiqueSlug && this.name && this.isModified('name')) {
    this.boutiqueSlug = generateSlug(this.name);
  }
  // 3. Normalisation du status
  if (this.status) {
    this.status = this.status.toUpperCase();
  }
});

module.exports = mongoose.model("Boutique", boutiqueSchema);