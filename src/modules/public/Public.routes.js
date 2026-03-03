const express = require('express');
const router = express.Router();

const PublicController = require('./Public.controller');

// Routes publiques — aucune authentification requise

// ── Boutiques ─────────────────────────────
router.get('/boutiques', PublicController.getBoutiques);
router.get('/boutiques/:id', PublicController.getBoutiqueById);

// ── Promotions ────────────────────────────
router.get('/promotions', PublicController.getPromotions);
router.get('/promotions/:id', PublicController.getPromotionById);

// ── Recherche globale ─────────────────────
router.get('/search', PublicController.searchGlobal);

// ── Plan du centre ────────────────────────
// router.get('/center/plan', PublicController.getPlanCentre);

module.exports = router;
