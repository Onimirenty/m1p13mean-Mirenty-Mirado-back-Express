const Promotion = require("./Promotion.model");
const Box = require("../spatial/Box.model");
const Produit = require('../produits/Produit.model')
const AppError = require("../../utils/AppError");
const centreCommerciale = require("../centre_commercial/CentreCommercial.model");
const Boutique = require("../boutiques/Boutique.model");
const BoutiqueHelper = require("./Promotion.helper");
const mongoose = require("mongoose");



exports.createPromotion = async (boutiqueId, data) => {
    const session = await mongoose.startSession();
    try {
        return await session.withTransaction(async () => {
            await BoutiqueHelper.assertBoutiqueExists(boutiqueId);
            const produit = await BoutiqueHelper.getProduitOrThrow(data.produitId, boutiqueId, session);
            const reduction = BoutiqueHelper.computeReduction(produit.prix, data, true);
            const { box, centre } = await BoutiqueHelper.getBoxAndCentre(boutiqueId, session);
            const { debut, fin } = BoutiqueHelper.validateDatesWithCentreRules(data.dateDebut, data.dateFin, centre);
            await BoutiqueHelper.assertPromotionLimit(boutiqueId, centre, session);
            await BoutiqueHelper.checkPromotionOverlap({ produitId: data.produitId, dateDebut: debut, dateFin: fin, session });
            const promotion = await Promotion.create(
                [{
                    ...data,
                    boutiqueId,
                    ...reduction,
                    dateDebut: debut,
                    dateFin: fin,
                    localisation: {
                        etage: box.etage,
                        bloc: box.bloc,
                        boxNumero: box.numero,
                        centreNom: centre.name
                    },
                    status: "VALIDER"
                }],
                { session }
            );

            return promotion[0];
        });

    } finally {
        session.endSession();
    }
};

exports.updatePromotion = async (promotionId, data) => {
    const { boutiqueId } = data;
    const promotion = await Promotion.findOne({
        _id: promotionId,
        boutiqueId
    });
    if (!promotion) {
        throw new AppError("Promotion introuvable", 404);
    }
    if (promotion.dateFin < new Date()) {
        throw new AppError("Promotion expirée", 400);
    }
    const produit = data.produitId
        ? await BoutiqueHelper.getProduitOrThrow(data.produitId, boutiqueId)
        : await Produit.findById(promotion.produitId);
    const reduction = BoutiqueHelper.computeReduction(produit.prix, data, false);
    if (reduction) {
        Object.assign(promotion, reduction);
    }
    if (data.dateDebut || data.dateFin) {
        const { centre } = await BoutiqueHelper.getBoxAndCentre(boutiqueId);

        const { debut, fin } = BoutiqueHelper.validateDatesWithCentreRules(
            data.dateDebut || promotion.dateDebut,
            data.dateFin || promotion.dateFin,
            centre
        );
        promotion.dateDebut = debut;
        promotion.dateFin = fin;
    }
    if (data.titre) { promotion.titre = data.titre; }
    if (data.description) { promotion.description = data.description; }
    if (data.image) { promotion.image = data.image; }
    if (data.prioriteAffichage) {
        promotion.prioriteAffichage = data.prioriteAffichage;
    }

    await promotion.save();

    return promotion;
};

/**
 * Récupère les promotions pour la vitrine selon l'ordre de priorité du CDC :
 * 1. Urgence (expire bientôt)
 * 2. Nouveauté (récemment ajoutées)
 * 3. En cours
 */
exports.getPromotionsDisplay = async () => {

    const now = new Date();

    return Promotion.find({
        status: "VALIDER",
        dateFin: { $gte: now }
    })
        .populate({
            path: "boutiqueId",
            select: "name boutiqueSlug"
        })
        .sort({
            dateFin: 1,
            createdAt: -1
        })
        .lean();
};
