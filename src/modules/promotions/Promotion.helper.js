const Promotion = require("./Promotion.model");
const Box = require("../spatial/Box.model");
const Produit = require('../produits/Produit.model');
const AppError = require("../../utils/AppError");
const Boutique = require("../boutiques/Boutique.model");
const mongoose = require("mongoose");

// ─────────────────────────────────────────
// VALIDATION DE L'EXISTENCE DE LA BOUTIQUE
// ─────────────────────────────────────────

/**
 * Vérifie qu'une boutique existe et est active.
 * @param {ObjectId|string} boutiqueId
 * @param {ClientSession|null} session
 */
const assertBoutiqueExists = async (boutiqueId, session = null) => {
  if (!boutiqueId) {
    throw new AppError("ID boutique requis", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(boutiqueId)) {
    throw new AppError("ID boutique invalide", 400);
  }

  const boutique = await Boutique.findById(boutiqueId).session(session);

  if (!boutique) {
    throw new AppError("Boutique introuvable", 404);
  }

  if (boutique.status !== "ACTIVE") {
    throw new AppError("La boutique n'est pas active", 403);
  }
};

// ─────────────────────────────────────────
// RÉCUPÉRATION ET VALIDATION DU PRODUIT
// ─────────────────────────────────────────

/**
 * Récupère un produit lié à une boutique et valide son prix.
 * @param {ObjectId|string} produitId
 * @param {ObjectId|string} boutiqueId
 * @param {ClientSession|null} session
 * @returns {Promise<Produit>}
 */
const getProduitOrThrow = async (produitId, boutiqueId, session = null) => {
  if (!produitId) {
    throw new AppError("ID produit requis", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(produitId)) {
    throw new AppError("ID produit invalide", 400);
  }

  const produit = await Produit
    .findOne({ _id: produitId, boutiqueId })
    .session(session);

  if (!produit) {
    throw new AppError("Produit introuvable ou non lié à la boutique", 404);
  }

  if (produit.prix <= 0) {
    throw new AppError("Prix produit invalide", 400);
  }

  return produit;
};

// ─────────────────────────────────────────
// CALCUL DE LA RÉDUCTION (synchrone — pas de session)
// ─────────────────────────────────────────

/**
 * Calcule prixPromotion et pourcentageReduction à partir de l'un ou l'autre.
 * @param {number} prixOrigine
 * @param {Object} data  - Doit contenir pourcentageReduction OU prixPromotion
 * @param {boolean} requireOne - Si true, lève une erreur si aucun des deux n'est fourni
 * @returns {{ prixOrigine, prixPromotion, pourcentageReduction } | null}
 */
const computeReduction = (prixOrigine, data, requireOne = true) => {
  // ── Convertir en number si reçu comme string (form-data) ──
  let pourcentageReduction = data.pourcentageReduction !== undefined
    ? Number(data.pourcentageReduction)
    : undefined;

  let prixPromotion = data.prixPromotion !== undefined
    ? Number(data.prixPromotion)
    : undefined;

  // NaN check — si la conversion échoue
  if (pourcentageReduction !== undefined && isNaN(pourcentageReduction)) {
    throw new AppError("pourcentageReduction doit être un nombre", 400);
  }
  if (prixPromotion !== undefined && isNaN(prixPromotion)) {
    throw new AppError("prixPromotion doit être un nombre", 400);
  }

  const hasPercent = pourcentageReduction !== undefined;
  const hasPrix = prixPromotion !== undefined;

  if (requireOne && !hasPercent && !hasPrix) {
    throw new AppError("Fournir soit un pourcentage soit un prix promotionnel", 400);
  }

  if (!hasPercent && !hasPrix) return null;

  if (hasPercent && !hasPrix) {
    if (pourcentageReduction <= 0 || pourcentageReduction >= 100) {
      throw new AppError("Pourcentage invalide : doit être entre 0 et 100 exclus", 400);
    }
    prixPromotion = prixOrigine - (prixOrigine * (pourcentageReduction / 100));
  }

  if (hasPrix && !hasPercent) {
    if (prixPromotion <= 0 || prixPromotion >= prixOrigine) {
      throw new AppError(
        "Prix promotion invalide : doit être positif et inférieur au prix d'origine",
        400
      );
    }
    pourcentageReduction = ((prixOrigine - prixPromotion) / prixOrigine) * 100;
  }

  if (prixPromotion >= prixOrigine) {
    throw new AppError("La promotion ne génère aucune réduction réelle", 400);
  }

  return {
    prixOrigine,
    prixPromotion: Number(prixPromotion.toFixed(2)),
    pourcentageReduction: Number(pourcentageReduction.toFixed(2)),
  };
};

// ─────────────────────────────────────────
// RÉCUPÉRATION BOX + CENTRE COMMERCIAL
// ─────────────────────────────────────────

/**
 * Récupère la box et le centre commercial associés à une boutique.
 * Vérifie que le centre est actif.
 * @param {ObjectId|string} boutiqueId
 * @param {ClientSession|null} session
 * @returns {Promise<{ box: Box, centre: CentreCommercial }>}
 */
const getBoxAndCentre = async (boutiqueId, session = null) => {
  const box = await Box
    .findOne({ boutiqueId })
    .populate("centreCommercialId")
    .session(session);

  if (!box) {
    throw new AppError(
      "Aucune box trouvée pour cette boutique. Vérifiez l'affectation des emplacements.",
      404
    );
  }

  const centre = box.centreCommercialId;

  if (!centre) {
    throw new AppError("Centre commercial introuvable pour cette box", 404);
  }

  if (centre.status !== "ACTIVE") {
    throw new AppError("Le centre commercial est actuellement inactif", 403);
  }

  if (!centre.configuration) {
    throw new AppError(
      "Configuration du centre commercial manquante (règles promotions)",
      500
    );
  }

  return { box, centre };
};

// ─────────────────────────────────────────
// VALIDATION DES DATES PAR RAPPORT AUX RÈGLES DU CENTRE
// ─────────────────────────────────────────

/**
 * Valide les dates de début et de fin selon les règles de durée du centre.
 * Fonction synchrone — ne nécessite pas de session.
 * @param {string|Date} dateDebut
 * @param {string|Date} dateFin
 * @param {CentreCommercial} centre
 * @returns {{ debut: Date, fin: Date }}
 */
const validateDatesWithCentreRules = (dateDebut, dateFin, centre) => {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  if (isNaN(debut.getTime())) throw new AppError("dateDebut invalide", 400);
  if (isNaN(fin.getTime())) throw new AppError("dateFin invalide", 400);

  if (debut < new Date()) {
    throw new AppError("dateDebut ne peut pas être dans le passé", 400);
  }

  if (fin <= debut) {
    throw new AppError("dateFin doit être strictement après dateDebut", 400);
  }

  const diffJours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));

  const {
    min_promo_duration_in_days,
    max_promo_duration_in_days,
  } = centre.configuration;

  if (diffJours < min_promo_duration_in_days) {
    throw new AppError(
      `Durée trop courte. Minimum autorisé : ${min_promo_duration_in_days} jour(s)`,
      400
    );
  }

  if (diffJours > max_promo_duration_in_days) {
    throw new AppError(
      `Durée trop longue. Maximum autorisé : ${max_promo_duration_in_days} jour(s)`,
      400
    );
  }

  return { debut, fin };
};

// ─────────────────────────────────────────
// VÉRIFICATION DE LA LIMITE DE PROMOTIONS PAR BOUTIQUE
// ─────────────────────────────────────────

/**
 * Vérifie que la boutique n'a pas dépassé la limite de promotions actives.
 * @param {ObjectId|string} boutiqueId
 * @param {CentreCommercial} centre
 * @param {ClientSession|null} session
 */
const assertPromotionLimit = async (boutiqueId, centre, session = null) => {
  const activeCount = await Promotion.countDocuments({
    boutiqueId,
    status: "VALIDER",
    dateFin: { $gte: new Date() },
  }).session(session);

  const max = centre.configuration.max_promo_per_boutique;

  if (activeCount >= max) {
    throw new AppError(
      `Limite de promotions actives atteinte pour cette boutique (max : ${max})`,
      400
    );
  }
};

// ─────────────────────────────────────────
// VÉRIFICATION DU CHEVAUCHEMENT DE PROMOTIONS
// ─────────────────────────────────────────

/**
 * Vérifie qu'il n'existe pas de promotion active chevauchante pour le même produit.
 * @param {Object}            params
 * @param {ObjectId|string}   params.produitId
 * @param {Date}              params.dateDebut
 * @param {Date}              params.dateFin
 * @param {ObjectId|string}   [params.excludeId]  - ID à exclure (pour une mise à jour)
 * @param {ClientSession|null}[params.session]
 */
const checkPromotionOverlap = async ({
  produitId,
  dateDebut,
  dateFin,
  excludeId = null,
  session = null,
}) => {
  if (!produitId || !dateDebut || !dateFin) {
    throw new AppError(
      "produitId, dateDebut et dateFin sont requis pour la vérification du chevauchement",
      400
    );
  }

  const query = {
    produitId,
    status: { $in: ["VALIDER", "BROUILLON"] },
    dateDebut: { $lte: dateFin },
    dateFin: { $gte: dateDebut },
  };

  if (excludeId) {
    if (!mongoose.Types.ObjectId.isValid(excludeId)) {
      throw new AppError("excludeId invalide", 400);
    }
    query._id = { $ne: excludeId };
  }

  const overlapping = await Promotion.findOne(query).session(session);

  if (overlapping) {
    throw new AppError(
      "Une promotion existe déjà pour ce produit sur la période sélectionnée",
      400
    );
  }
};

// ─────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────

module.exports = {
  assertBoutiqueExists,
  getProduitOrThrow,
  computeReduction,
  getBoxAndCentre,
  validateDatesWithCentreRules,
  assertPromotionLimit,
  checkPromotionOverlap,
};