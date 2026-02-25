const express = require("express");
const router = express.Router();

const { checkToken } = require("../../middlewares/auth.middleware");
const { checkRole } = require("../../middlewares/role.middleware");

const BoutiqueController = require("./Boutique.controller");

// ADMIN ONLY
router.post("/", checkToken, checkRole("admin"), BoutiqueController.createBoutique);
router.get("/", checkToken, checkRole("admin"), BoutiqueController.getAllBoutiques);
router.get("/:id", checkToken, checkRole("admin"), BoutiqueController.getBoutiqueById);
router.put("/:id", checkToken, checkRole("admin"), BoutiqueController.updateBoutique);
router.delete("/:id", checkToken, checkRole("admin"), BoutiqueController.deleteBoutique);

module.exports = router;