const express = require('express');
const router = express.Router();

const { checkToken } = require('../../middlewares/auth.middleware');
const { checkRole } = require('../../middlewares/role.middleware');
const { requireMultipart, uploadBoutiqueImage, uploadProduitImages, uploadPromotionImage } = require('../../middlewares/upload.middleware');

const MeController = require('./Me.controller');

// Toutes les routes /me/* nécessitent un token OWNER
router.use(checkToken, checkRole('OWNER'));

// ── Profil boutique ───────────────────────
router.get('/boutique', MeController.getMonProfil);
router.put('/boutique', requireMultipart, uploadBoutiqueImage, MeController.updateMonProfil);

// ── Produits ──────────────────────────────
router.get('/produits', MeController.getMesProduits);
router.post('/produits', requireMultipart, uploadProduitImages, MeController.createProduit);

// ── Promotions ────────────────────────────
router.get('/promotions', MeController.getMesPromotions);
router.post('/promotions', requireMultipart, uploadPromotionImage, MeController.createPromotion);

// ── Statistiques ──────────────────────────
router.get('/stats', MeController.getMesStats);

module.exports = router;
