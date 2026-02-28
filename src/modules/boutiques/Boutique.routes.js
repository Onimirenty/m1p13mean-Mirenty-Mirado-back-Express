const express = require("express");
const router = express.Router();

const { checkToken } = require("../../middlewares/auth.middleware");
const { checkRole } = require("../../middlewares/role.middleware");

const BoutiqueController = require("./Boutique.controller");

router.put("/:id", checkToken, checkRole("ADMIN"), BoutiqueController.updateBoutique);
router.post("/", checkToken, checkRole("ADMIN"), BoutiqueController.createBoutique);
router.get("/", checkToken, checkRole("ADMIN"), BoutiqueController.getAllBoutiques);
router.get("/:id", checkToken, checkRole("ADMIN"), BoutiqueController.getBoutiqueById);
router.get("/plus-boxes/:id", checkToken, checkRole("ADMIN"), BoutiqueController.getBoutiqueAndBoxesById);
router.delete("/:id", checkToken, checkRole("ADMIN"), BoutiqueController.deleteBoutique);

module.exports = router;
