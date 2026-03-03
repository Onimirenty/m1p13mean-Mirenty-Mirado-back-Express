const express = require("express");
const router = express.Router();
const AnnonceController = require("./Annonce.controller");
const { checkToken } = require("../../middlewares/auth.middleware");
const { checkRole } = require("../../middlewares/role.middleware");

router.get("/", AnnonceController.getAllAnnonces);
router.get("/:id", AnnonceController.getAnnonceById);

router.post("/", checkToken, checkRole("ADMIN"), AnnonceController.createAnnonce);
router.put("/:id", checkToken, checkRole("ADMIN"), AnnonceController.updateAnnonce);
router.delete("/:id", checkToken, checkRole("ADMIN"), AnnonceController.deleteAnnonce);

module.exports = router;
