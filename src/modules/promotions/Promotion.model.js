const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
    {
        titre: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        dateDebut: {
            type: Date,
            required: true
        },
        dateFin: {
            type: Date,
            required: true
        },
        produitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Produit",
            required: true, // Une promo doit cibler un produit
            index: true
        },
        image: {
            type: String
        },
        prixOrigine: {
            type: Number,
            required: true
        },
        pourcentageReduction: {
            type: Number,
            required: true
        },
        prixPromotion: {
            type: Number,
            required: true
        },

        // Liaison et Localisation
        boutiqueId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Boutique",
            required: true,
            index: true
        },

        // Système de statuts
        status: {
            type: String,
            enum: ["BROUILLON", "VALIDER", "EXPIRER", "RETIRER"],
            default: "VALIDER" // Validation automatique selon le CDC
        },
        localisation: {
            etage: Number,
            bloc: String,
            boxNumero: Number,
            centreNom: String
        },

        // Pour le tri par priorité du Cahier des Charges
        prioriteAffichage: {
            type: String,
            enum: ["URGENT", "RECENT", "NORMAL"],
            default: "NORMAL"
        },
        // Statistiques de visibilité
        stats: {
            vues: { type: Number, default: 0 },
            cliques: { type: Number, default: 0 }
        }
    },
    { timestamps: true }
);

// Index pour l'affichage par priorité (Date de fin proche)
promotionSchema.index({
    status: 1,
    dateFin: 1,
    createdAt: -1
});

promotionSchema.index({
    status: 1,
    dateFin: 1,
    createdAt: -1
});

promotionSchema.pre("validate", function () {
    if (this.dateFin <= this.dateDebut) {
        throw new Error("dateFin must be after dateDebut");
    }
});

module.exports = mongoose.model("Promotion", promotionSchema);