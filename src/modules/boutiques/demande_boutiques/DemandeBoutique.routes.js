const express = require("express");
const router = express.Router();
const { checkToken } = require("../../../middlewares/auth.middleware");
const { checkRole } = require("../../../middlewares/role.middleware");
const DemandeController = require("./DemandeBoutique.controller");

router.post("/", checkToken, DemandeController.create);
router.get("/", checkToken, checkRole("admin"), DemandeController.getAll);
router.get("/:id", checkToken, checkRole("admin"), DemandeController.getOne);
router.patch("/:id/approve", checkToken, checkRole("admin"), DemandeController.approve);
router.patch("/:id/reject", checkToken, checkRole("admin"), DemandeController.reject);

module.exports = router;