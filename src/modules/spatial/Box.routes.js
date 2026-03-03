const express = require("express");
const router = express.Router();

const { checkToken } = require("../../middlewares/auth.middleware");
const { checkRole } = require("../../middlewares/role.middleware");
const { requireMultipart, uploadBoxImage } = require("../../middlewares/upload.middleware");

const BoxController = require("./Box.controller");

router.get("/composite", checkToken, checkRole("ADMIN"), BoxController.getBoxByCompositeKey);
router.get("/", checkToken, checkRole("ADMIN"), BoxController.getAllBoxes);
router.get("/:id", checkToken, checkRole("ADMIN","OWNER"), BoxController.getBoxById);
router.delete("/:id", checkToken, checkRole("ADMIN"), BoxController.deleteBox);

router.post("/", checkToken, checkRole("ADMIN"), requireMultipart, uploadBoxImage, BoxController.createBox);
router.put("/:id", checkToken, checkRole("ADMIN"), requireMultipart, uploadBoxImage, BoxController.updateBox);

module.exports = router;

