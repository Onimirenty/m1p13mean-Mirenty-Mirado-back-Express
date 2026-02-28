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
    throw new AppError("dateFin doit être après dateDebut", 400);
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


exports.createPromotion = async (boutiqueId, data) => {

    /* ===============================
       1. Vérification produit
    =============================== */
    if (!boutiqueId) {
        throw new AppError("veuiller fournir une id de boutique", 404);
    }
    const boutique = await Boutique.findOne({ _id: boutiqueId });
    if (!boutique) {
        throw new AppError("la boutique fournie n'existe pas", 404);
    }

    const produit = await Produit.findOne({
        _id: data.produitId,
        boutiqueId
    });

    if (!produit) {
        throw new AppError("Produit introuvable ou non lié à la boutique", 404);
    }

    const prixOrigine = produit.prix;
    if (prixOrigine <= 0) {
        throw new AppError("Prix produit invalide", 400);
    }
    let { pourcentageReduction, prixPromotion } = data;
    const hasPercent = typeof pourcentageReduction === "number";
    const hasPrixPromo = typeof prixPromotion === "number";

    if (!hasPercent && !hasPrixPromo) {
        throw new AppError("Fournir soit un pourcentage soit un prix promotionnel", 400);
    }

    if (hasPercent && !hasPrixPromo) {
        if (pourcentageReduction <= 0 || pourcentageReduction >= 100) {
            throw new AppError("Pourcentage invalide", 400);
        }
        prixPromotion = prixOrigine - (prixOrigine * (pourcentageReduction / 100));
    }

    if (hasPrixPromo && !hasPercent) {
        if (prixPromotion <= 0 || prixPromotion >= prixOrigine) {
            throw new AppError("Prix promotion invalide", 400);
        }

        pourcentageReduction = ((prixOrigine - prixPromotion) / prixOrigine) * 100;
    }

    if (prixPromotion >= prixOrigine) {
        throw new AppError("La promotion doit être inférieure au prix initial", 400);
    }

    /* ===============================
       2. Validation dates
    =============================== */

    const debut = new Date(data.dateDebut);
    const fin = new Date(data.dateFin);

    if (isNaN(debut) || isNaN(fin)) {
        throw new AppError("Dates invalides", 400);
    }

    if (fin <= debut) {
        throw new AppError("dateFin doit être après dateDebut", 400);
    }

    const diffJours = Math.ceil(
        (fin - debut) / (1000 * 60 * 60 * 24)
    );

    /* ===============================
       3. Récupération box + centre
    =============================== */

    const box = await Box.findOne({ boutiqueId })
        .populate("centreCommercialId");

    if (!box) {
        throw new AppError("Aucun box associé à cette boutique", 404);
    }

    const centre = box.centreCommercialId;

    if (!centre || centre.status !== "ACTIVE") {
        throw new AppError("Centre commercial inactif", 403);
    }

    const {
        max_promo_per_boutique,
        min_promo_duration_in_days,
        max_promo_duration_in_days
    } = centre.configuration;

    if (
        diffJours < min_promo_duration_in_days ||
        diffJours > max_promo_duration_in_days
    ) {
        throw new AppError(`Durée autorisée : ${min_promo_duration_in_days} à ${max_promo_duration_in_days} jours`, 400);
    }

    /* ===============================
       4. Limite nombre promos
    =============================== */

    const activeCount = await Promotion.countDocuments({
        boutiqueId,
        status: "VALIDER",
        dateFin: { $gte: new Date() }
    });

    if (activeCount >= max_promo_per_boutique) {
        throw new AppError(`Limite atteinte (${max_promo_per_boutique})`, 400);
    }

    /* ===============================
       5. Création promotion
    =============================== */

    const promotion = await Promotion.create({
        ...data,
        boutiqueId,
        prixOrigine,
        pourcentageReduction: Number(pourcentageReduction.toFixed(2)),
        prixPromotion: Number(prixPromotion.toFixed(2)),
        localisation: {
            etage: box.etage,
            bloc: box.bloc,
            boxNumero: box.numero,
            centreNom: centre.name
        },
        status: "VALIDER"
    });

    return promotion;
};




exports.updatePromotion = async (promotionId,  data) => {
    const boutiqueId = data.boutiqueId;
    /* ===============================
       1. Récupération promotion
    =============================== */

    const promotion = await Promotion.findOne({
        _id: promotionId,
        boutiqueId
    });

    if (!promotion) {
        throw new AppError("Promotion introuvable", 404);
    }

    const now = new Date();

    if (promotion.dateFin < now) {
        throw new AppError("Impossible de modifier une promotion expirée", 400);
    }

    /* ===============================
       2. Produit (si changement)
    =============================== */

    let produit = null;

    if (data.produitId) {
        produit = await Produit.findOne({
            _id: data.produitId,
            boutiqueId
        });

        if (!produit) {
            throw new AppError("Produit invalide", 404);
        }
    } else {
        produit = await Produit.findById(promotion.produitId);
    }

    const prixOrigine = produit.prix;

    /* ===============================
       3. Recalcul réduction si modifiée
    =============================== */

    let pourcentageReduction = data.pourcentageReduction;
    let prixPromotion = data.prixPromotion;

    const hasPercent = typeof pourcentageReduction === "number";
    const hasPrixPromo = typeof prixPromotion === "number";

    if (hasPercent || hasPrixPromo) {

        if (prixOrigine <= 0) {
            throw new AppError("Prix produit invalide", 400);
        }

        if (hasPercent && !hasPrixPromo) {

            if (pourcentageReduction <= 0 || pourcentageReduction >= 100) {
                throw new AppError("Pourcentage invalide", 400);
            }

            prixPromotion =
                prixOrigine - (prixOrigine * (pourcentageReduction / 100));
        }

        if (hasPrixPromo && !hasPercent) {

            if (prixPromotion <= 0 || prixPromotion >= prixOrigine) {
                throw new AppError("Prix promotion invalide", 400);
            }

            pourcentageReduction =
                ((prixOrigine - prixPromotion) / prixOrigine) * 100;
        }

        if (prixPromotion >= prixOrigine) {
            throw new AppError("Promotion invalide", 400);
        }

        promotion.prixOrigine = prixOrigine;
        promotion.prixPromotion = Number(prixPromotion.toFixed(2));
        promotion.pourcentageReduction = Number(
            pourcentageReduction.toFixed(2)
        );
    }

    /* ===============================
       4. Validation dates si modifiées
    =============================== */

    if (data.dateDebut || data.dateFin) {

        const debut = new Date(data.dateDebut || promotion.dateDebut);
        const fin = new Date(data.dateFin || promotion.dateFin);

        if (isNaN(debut) || isNaN(fin)) {
            throw new AppError("Dates invalides", 400);
        }

        if (fin <= debut) {
            throw new AppError("dateFin doit être après dateDebut", 400);
        }

        const diffJours = Math.ceil(
            (fin - debut) / (1000 * 60 * 60 * 24)
        );

        const box = await Box.findOne({ boutiqueId })
            .populate("centreCommercialId");

        if (!box) {
            throw new AppError("Box introuvable", 404);
        }

        const centre = box.centreCommercialId;

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

        promotion.dateDebut = debut;
        promotion.dateFin = fin;
    }

    /* ===============================
       5. Champs autorisés modifiables
    =============================== */

    if (data.titre) promotion.titre = data.titre;
    if (data.description) promotion.description = data.description;
    if (data.image) promotion.image = data.image;
    if (data.prioriteAffichage)
        promotion.prioriteAffichage = data.prioriteAffichage;

    /* ===============================
       6. Sauvegarde
    =============================== */

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
        dateDebut: { $lte: now },
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
