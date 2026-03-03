const express = require('express');
const router = express.Router();

const { checkToken } = require('../../middlewares/auth.middleware');
const { checkRole } = require('../../middlewares/role.middleware');
const { requireMultipart, uploadBoutiqueImage } = require('../../middlewares/upload.middleware');

const AdminController = require('./admin.controller');

// Toutes les routes /admin/* nécessitent un token ADMIN
router.use(checkToken, checkRole('ADMIN'));

// ── Centre commercial ─────────────────────
router.get('/center', AdminController.getCentre);
router.put('/center', requireMultipart, uploadBoutiqueImage, AdminController.updateCentre);

// ── Boutiques ─────────────────────────────
router.get('/boutiques', AdminController.getAllBoutiquesAdmin);
router.patch('/boutiques/:id/validate', AdminController.validateBoutique);
router.patch('/boutiques/:id/activate', AdminController.activateBoutique);
router.patch('/boutiques/:id/disable', AdminController.disableBoutique);

// ── Catégories ────────────────────────────
router.post('/categories', AdminController.createCategorie);
router.get('/categories', AdminController.getAllCategories);

// ── Zones ─────────────────────────────────
router.post('/zones', AdminController.createZone);
router.get('/zones', AdminController.getAllZones);

// ── Promotions ────────────────────────────
router.get('/promotions', AdminController.getAllPromotionsAdmin);
router.patch('/promotions/:id', AdminController.patchPromotion);

// ── Annonces ──────────────────────────────
router.post('/annonces', AdminController.createAnnonce);
router.get('/annonces', AdminController.getAllAnnonces);

module.exports = router;
