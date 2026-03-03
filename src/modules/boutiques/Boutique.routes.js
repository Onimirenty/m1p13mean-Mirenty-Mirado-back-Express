const express = require("express");
const router = express.Router();

const { checkToken } = require("../../middlewares/auth.middleware");
const { checkRole } = require("../../middlewares/role.middleware");
const { requireMultipart, uploadBoutiqueImage } = require("../../middlewares/upload.middleware");


const BoutiqueController = require("./Boutique.controller");

// router.get("/",  BoutiqueController.getAllBoutiques);
// router.get("/:id", BoutiqueController.getBoutiqueById);

router.get("/plus-boxes/:id", checkToken, checkRole("ADMIN"), BoutiqueController.getBoutiqueAndBoxesById);
router.put("/deactivate/:id", checkToken, checkRole("ADMIN"), BoutiqueController.deactivateBoutique);
router.put("/:id", checkToken, checkRole("ADMIN"), requireMultipart, uploadBoutiqueImage, BoutiqueController.updateBoutique);
router.post("/", checkToken, checkRole("ADMIN"), requireMultipart, uploadBoutiqueImage, BoutiqueController.createBoutique);

module.exports = router;
