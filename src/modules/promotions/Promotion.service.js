const Promotion = require("./Promotion.model");
const Box = require("../spatial/Box.model");
const Produit = require('../produits/Produit.model')
const AppError = require("../../utils/AppError");
const centreCommerciale = require("../centre_commercial/CentreCommercial.model");
const Boutique = require("../boutiques/Boutique.model");
const PromotionHelper = require("./Promotion.helper");
const mongoose = require("mongoose");


exports.createPromotion = async (boutiqueId, data) => {
    const session = await mongoose.startSession();
    try {
        return await session.withTransaction(async () => {
            // 1. La boutique existe ?
            await PromotionHelper.assertBoutiqueExists(boutiqueId, session);
            // 2. Le produit appartient bien à cette boutique ?
            const produit = await PromotionHelper.getProduitOrThrow(
                data.produitId, boutiqueId, session
            );
            // 3. Calcul de la réduction (synchrone, pas de DB)
            const reduction = PromotionHelper.computeReduction(produit.prix, data, true);
            // 4. Récupérer box + centre (nécessaire pour la suite)
            const { box, centre } = await PromotionHelper.getBoxAndCentre(boutiqueId, session);
            // 5. Valider les dates selon les règles du centre (synchrone)
            const { debut, fin } = PromotionHelper.validateDatesWithCentreRules(data.dateDebut, data.dateFin, centre);
            // 6. Vérifier la limite de promos actives par boutique
            await PromotionHelper.assertPromotionLimit(boutiqueId, centre, session);
            // 7. Vérifier chevauchement (debut et fin sont maintenant définis)
            await PromotionHelper.checkPromotionOverlap({
                produitId: data.produitId,
                dateDebut: debut,
                dateFin: fin,
                session
            });
            // 8. Créer la promotion
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
    if (!boutiqueId) {
        throw new AppError("boutiqueId est requis", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(boutiqueId)) {
        throw new AppError("boutiqueId invalide", 400);
    }

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
        ? await PromotionHelper.getProduitOrThrow(data.produitId, boutiqueId)
        : await Produit.findById(promotion.produitId);
    const reduction = PromotionHelper.computeReduction(produit.prix, data, false);
    if (reduction) {
        Object.assign(promotion, reduction);
    }
    if (data.dateDebut || data.dateFin) {
        const { centre } = await PromotionHelper.getBoxAndCentre(boutiqueId);

        const { debut, fin } = PromotionHelper.validateDatesWithCentreRules(
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
