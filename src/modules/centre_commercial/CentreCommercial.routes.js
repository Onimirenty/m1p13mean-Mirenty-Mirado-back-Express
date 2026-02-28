

const express = require("express");
const router = express.Router();
const { checkToken } = require('../../middlewares/auth.middleware');
const { checkRole } = require('../../middlewares/role.middleware');

const CentreController = require("./CentreCommercial.controller.js");


router.get("/:id", checkToken, checkRole('ADMIN'), CentreController.getCentreController);
router.post("/centre", checkToken, checkRole('ADMIN'), CentreController.createCentreController);
router.put("/:id", checkToken, checkRole("ADMIN"), CentreController.updateCentre);
router.patch("/:id", checkToken, checkRole("ADMIN"), CentreController.patchCentre);


module.exports = router;