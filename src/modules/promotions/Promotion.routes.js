const express = require("express");
const router = express.Router();

const PromotionController = require("./Promotion.controller");
const { checkToken } = require("../../middlewares/auth.middleware");
const { checkRole } = require("../../middlewares/role.middleware");

// --- ROUTES PUBLIQUES (OU VISITEURS CONNECTÉS) ---
// Récupère les promos selon l'ordre de priorité du CDC
router.get("/vitrine", PromotionController.getVitrine);
router.get("/:id", PromotionController.getPromotionById);

// --- ROUTES PROTÉGÉES (OWNER & ADMIN) ---
router.post("/", checkToken, checkRole("OWNER", "ADMIN"), PromotionController.createPromotion);
router.put("/:id", checkToken, checkRole("OWNER", "ADMIN"), PromotionController.updatePromotion);
router.patch("/:id", checkToken, checkRole("OWNER", "ADMIN"), PromotionController.patchPromotion);
router.delete("/:id", checkToken, checkRole("OWNER", "ADMIN"), PromotionController.deletePromotion);

module.exports = router;