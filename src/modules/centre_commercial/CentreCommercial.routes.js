

const express = require("express");
const router = express.Router();
const { checkToken } = require('../../middlewares/auth.middleware');
const { checkRole } = require('../../middlewares/role.middleware');

const createCentreController  =  require("./CentreCommercial.controller.js");


router.post("/centre", checkToken, checkRole('ADMIN'), createCentreController.createCentreController);

module.exports = router;