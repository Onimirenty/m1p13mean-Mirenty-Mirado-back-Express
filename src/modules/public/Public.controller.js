const PublicService = require('./Public.service');

// ─────────────────────────────────────────
// BOUTIQUES
// ─────────────────────────────────────────

exports.getBoutiques = async (req, res, next) => {
  try {
    const result = await PublicService.getBoutiques(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getBoutiqueById = async (req, res, next) => {
  try {
    const boutique = await PublicService.getBoutiqueById(req.params.id);
    res.status(200).json(boutique);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// PROMOTIONS
// ─────────────────────────────────────────

exports.getPromotions = async (req, res, next) => {
  try {
    const result = await PublicService.getPromotions(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getPromotionById = async (req, res, next) => {
  try {
    const promotion = await PublicService.getPromotionById(req.params.id);
    res.status(200).json(promotion);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// RECHERCHE GLOBALE
// ─────────────────────────────────────────

exports.searchGlobal = async (req, res, next) => {
  try {
    const result = await PublicService.searchGlobal(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// PLAN DU CENTRE
// ─────────────────────────────────────────

// exports.getPlanCentre = async (req, res, next) => {
//   try {
//     const plan = await PublicService.getPlanCentre();
//     res.status(200).json(plan);
//   } catch (error) {
//     next(error);
//   }
// };
