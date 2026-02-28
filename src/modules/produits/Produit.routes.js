const express = require("express");
const router = express.Router();

const { checkToken } = require("../../middlewares/auth.middleware");
const { checkRole } = require("../../middlewares/role.middleware");
const ProduitController = require("./Produit.controller");

// Tout le monde (ou les clients) peut voir les produits, donc potentiellement pas de checkToken pour les GET
// Mais selon ton architecture, on peut sécuriser :
router.get("/", checkToken, ProduitController.getAllProduits);
router.get("/:id", checkToken, ProduitController.getProduitById);

// Seuls les admins et potentiellement les propriétaires de boutique peuvent modifier les produits
router.post("/", checkToken, checkRole("ADMIN", "OWNER"), ProduitController.createProduit);
router.put("/:id", checkToken, checkRole("ADMIN", "OWNER"), ProduitController.updateProduit);
router.delete("/:id", checkToken, checkRole("ADMIN", "OWNER"), ProduitController.deleteProduit);

module.exports = router;