const Promotion = require("./Promotion.model");
const Box = require("../spatial/Box.model");
const Produit = require('../produits/Produit.model')
const AppError = require("../../utils/AppError");
const centreCommerciale = require("../centre_commercial/CentreCommercial.model");
const Boutique = require("../boutiques/Boutique.model");


const assertBoutiqueExists = async (boutiqueId) => {
    if (!boutiqueId) {
        throw new AppError("ID boutique requis", 404);
    }

    const boutique = await Boutique.findById(boutiqueId);
    if (!boutique) {
        throw new AppError("Boutique introuvable", 404);
    }
};

const getProduitOrThrow = async (produitId, boutiqueId) => {
    const produit = await Produit.findOne({ _id: produitId, boutiqueId });

    if (!produit) {
        throw new AppError("Produit introuvable ou non lié à la boutique", 404);
    }

    if (produit.prix <= 0) {
        throw new AppError("Prix produit invalide", 400);
    }

    return produit;
};

const computeReduction = (prixOrigine, data, requireOne = true) => {
    let { pourcentageReduction, prixPromotion } = data;

    const hasPercent = typeof pourcentageReduction === "number";
    const hasPrix = typeof prixPromotion === "number";

    if (requireOne && !hasPercent && !hasPrix) {
        throw new AppError("Fournir soit un pourcentage soit un prix promotionnel", 400);
    }

    if (!hasPercent && !hasPrix) return null;

    if (hasPercent && !hasPrix) {
        if (pourcentageReduction <= 0 || pourcentageReduction >= 100) {
            throw new AppError("Pourcentage invalide", 400);
        }

        prixPromotion = prixOrigine - (prixOrigine * (pourcentageReduction / 100));
    }

    if (hasPrix && !hasPercent) {
        if (prixPromotion <= 0 || prixPromotion >= prixOrigine) {
            throw new AppError("Prix promotion invalide", 400);
        }

        pourcentageReduction =
            ((prixOrigine - prixPromotion) / prixOrigine) * 100;
    }

    if (prixPromotion >= prixOrigine) {
        throw new AppError("Promotion invalide", 400);
    }

    return {
        prixOrigine,
        prixPromotion: Number(prixPromotion.toFixed(2)),
        pourcentageReduction: Number(pourcentageReduction.toFixed(2))
    };
};

const getBoxAndCentre = async (boutiqueId) => {
    const box = await Box.findOne({ boutiqueId })
        .populate("centreCommercialId");

    if (!box) {
        throw new AppError("Box introuvable", 404);
    }

    const centre = box.centreCommercialId;

    if (!centre || centre.status !== "ACTIVE") {
        throw new AppError("Centre commercial inactif", 403);
    }

    return { box, centre };
};

const validateDatesWithCentreRules = (dateDebut, dateFin, centre) => {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (isNaN(debut) || isNaN(fin)) {
        throw new AppError("Dates invalides", 400);
    }

    if (fin <= debut) {
        throw new AppError("dateFin doit être après(superieur a ) dateDebut", 400);
    }

    const diffJours = Math.ceil(
        (fin - debut) / (1000 * 60 * 60 * 24)
    );

    const {
        min_promo_duration_in_days,
        max_promo_duration_in_days
    } = centre.configuration;

    if (
        diffJours < min_promo_duration_in_days ||
        diffJours > max_promo_duration_in_days
    ) {
        throw new AppError(
            `Durée autorisée : ${min_promo_duration_in_days} à ${max_promo_duration_in_days} jours`,
            400
        );
    }

    return { debut, fin };
};

const assertPromotionLimit = async (boutiqueId, centre) => {
    const activeCount = await Promotion.countDocuments({
        boutiqueId,
        status: "VALIDER",
        dateFin: { $gte: new Date() }
    });

    if (activeCount >= centre.configuration.max_promo_per_boutique) {
        throw new AppError(
            `Limite atteinte (${centre.configuration.max_promo_per_boutique})`,
            400
        );
    }
};

/**
 * Vérifie s'il existe une promotion chevauchante
 * @param {Object} params
 * @param {ObjectId} params.produitId
 * @param {Date} params.dateDebut
 * @param {Date} params.dateFin
 * @param {ObjectId} [params.excludeId] -> pour update
 * @param {ClientSession} [params.session]
 */
const checkPromotionOverlap = async ({
    produitId,
    dateDebut,
    dateFin,
    excludeId = null,
    session = null
}) => {

    if (!produitId || !dateDebut || !dateFin) {
        throw new AppError("Missing required fields for overlap check", 400);
    }

    const query = {
        produitId,
        status: { $in: ["VALIDER", "BROUILLON"] },
        dateDebut: { $lte: dateFin },
        dateFin: { $gte: dateDebut }
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const overlapping = await Promotion.findOne(query).session(session);

    if (overlapping) {
        throw new AppError(
            "A promotion already exists for this product during the selected period",
            400
        );
    }
};

module.exports = {
    assertBoutiqueExists,
    getProduitOrThrow,
    computeReduction,
    getBoxAndCentre,
    validateDatesWithCentreRules,
    assertPromotionLimit,
    checkPromotionOverlap
};