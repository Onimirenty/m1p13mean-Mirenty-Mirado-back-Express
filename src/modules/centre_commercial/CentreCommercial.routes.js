

const express = require("express");
const router = express.Router();
const { checkToken } = require('../../middlewares/auth.middleware');
const { checkRole } = require('../../middlewares/role.middleware');
const { requireMultipart, uploadCentreCommercialImage } = require('../../middlewares/upload.middleware');


const CentreController = require("./CentreCommercial.controller.js");


router.get("/:id", checkToken, checkRole('ADMIN'), CentreController.getCentreController);
router.post("/centre", checkToken, checkRole('ADMIN'), requireMultipart, uploadCentreCommercialImage, CentreController.createCentreController);
router.put("/:id", checkToken, checkRole("ADMIN"), requireMultipart, uploadCentreCommercialImage, CentreController.updateCentre);
router.patch("/:id", checkToken, checkRole("ADMIN"), requireMultipart, uploadCentreCommercialImage, CentreController.patchCentre);


module.exports = router;