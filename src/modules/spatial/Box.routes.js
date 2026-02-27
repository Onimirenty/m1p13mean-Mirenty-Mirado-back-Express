const express = require("express");
const router = express.Router();

const { checkToken } = require("../../middlewares/auth.middleware");
const { checkRole } = require("../../middlewares/role.middleware");

const BoxController = require("./Box.controller");

// ADMIN ONLY
router.get("/composite",checkToken,checkRole("ADMIN"),BoxController.getBoxByCompositeKey);
router.post("/", checkToken, checkRole("ADMIN"), BoxController.createBox);
router.get("/", checkToken, checkRole("ADMIN"), BoxController.getAllBoxes);
router.get("/:id", checkToken, checkRole("ADMIN"), BoxController.getBoxById);
router.put("/:id", checkToken, checkRole("ADMIN"), BoxController.updateBox);
router.delete("/:id", checkToken, checkRole("ADMIN"), BoxController.deleteBox);

module.exports = router;