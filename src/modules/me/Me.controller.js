const MeService = require('./Me.service');
const ProduitController = require('../produits/Produit.controller');
const PromotionController = require('../promotions/Promotion.controller');

// ─────────────────────────────────────────
// PROFIL BOUTIQUE
// ─────────────────────────────────────────

exports.getMonProfil = async (req, res, next) => {
  try {
    const profil = await MeService.getMonProfil(req.user.id);
    console.log("\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ ",req.user.id )
    res.status(200).json(profil);
  } catch (error) {
    next(error);
  }
};

exports.updateMonProfil = async (req, res, next) => {
  try {
    const uploadedImage = req.uploadedFiles?.[0] || null;

    const data = {
      ...req.body,
      ...(uploadedImage && {
        logoUrl: uploadedImage.url,
        logoPublicId: uploadedImage.publicId, 
      }),
    };

    const profil = await MeService.updateMonProfil(req.user.id, data);
    res.status(200).json(profil);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// PRODUITS
// ─────────────────────────────────────────

exports.getMesProduits = async (req, res, next) => {
  try {
    const produits = await MeService.getMesProduits(req.user.id);
    res.status(200).json(produits);
  } catch (error) {
    next(error);
  }
};

// Délègue au ProduitController existant après injection du boutiqueId
exports.createProduit = async (req, res, next) => {
  try {
    const boutiqueId = await MeService.getMesBoutiqueId(req.user.id);
    req.body.boutiqueId = boutiqueId.toString();
    return ProduitController.createProduit(req, res, next);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// PROMOTIONS
// ─────────────────────────────────────────

exports.getMesPromotions = async (req, res, next) => {
  try {
    const promotions = await MeService.getMesPromotions(req.user.id);
    res.status(200).json(promotions);
  } catch (error) {
    next(error);
  }
};

// Délègue au PromotionController existant après injection du boutiqueId
exports.createPromotion = async (req, res, next) => {
  try {
    const boutiqueId = await MeService.getMesBoutiqueId(req.user.id);
    req.body.boutiqueId = boutiqueId.toString();
    return PromotionController.createPromotion(req, res, next);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// STATISTIQUES
// ─────────────────────────────────────────

exports.getMesStats = async (req, res, next) => {
  try {
    const stats = await MeService.getMesStats(req.user.id);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};
