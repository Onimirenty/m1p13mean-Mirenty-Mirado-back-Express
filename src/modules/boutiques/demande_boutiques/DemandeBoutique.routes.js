const express = require("express");
const router = express.Router();
const { checkToken } = require("../../../middlewares/auth.middleware");
const { checkRole } = require("../../../middlewares/role.middleware");
const { requireMultipart, uploadDocumentsLegaux } = require("../../../middlewares/upload.middleware");

const DemandeController = require("./DemandeBoutique.controller");

router.post("/", checkToken, requireMultipart, uploadDocumentsLegaux, DemandeController.create);
router.get("/", checkToken, checkRole("ADMIN"), DemandeController.getAll);
router.get("/:id", checkToken, checkRole("ADMIN"), DemandeController.getOne);
router.patch("/:id/approve", checkToken, checkRole("ADMIN"), DemandeController.approve);
router.patch("/:id/reject", checkToken, checkRole("ADMIN"), DemandeController.reject);

// router.post('/register-boutique', checkToken, requireMultipart, uploadDocumentsLegaux, DemandeController.create);


module.exports = router;