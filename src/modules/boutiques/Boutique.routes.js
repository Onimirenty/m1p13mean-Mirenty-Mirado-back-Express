const express = require("express");
const router = express.Router();

const { checkToken } = require("../../middlewares/auth.middleware");
const { checkRole } = require("../../middlewares/role.middleware");
const { requireMultipart, uploadProduitImages } = require("../../middlewares/upload.middleware");


const BoutiqueController = require("./Boutique.controller");

router.get("/", checkToken, checkRole("ADMIN"), BoutiqueController.getAllBoutiques);
router.get("/:id", checkToken, checkRole("ADMIN"), BoutiqueController.getBoutiqueById);
router.get("/plus-boxes/:id", checkToken, checkRole("ADMIN"), BoutiqueController.getBoutiqueAndBoxesById);
router.delete("/:id", checkToken, checkRole("ADMIN"), BoutiqueController.deleteBoutique);

router.put("/:id", checkToken, checkRole("ADMIN"), requireMultipart, uploadProduitImages, BoutiqueController.updateBoutique);
router.post("/", checkToken, checkRole("ADMIN"), requireMultipart, uploadProduitImages, BoutiqueController.createBoutique);
module.exports = router;
