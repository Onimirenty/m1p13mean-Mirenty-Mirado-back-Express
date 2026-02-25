const express = require("express");
const router = express.Router();

const { checkToken } = require("../../middlewares/auth.middleware");
const { checkRole } = require("../../middlewares/role.middleware");

const BoxController = require("./Box.controller");

// ADMIN ONLY
router.post("/", checkToken, checkRole("admin"), BoxController.createBox);
router.get("/", checkToken, checkRole("admin"), BoxController.getAllBoxes);
router.get("/:id", checkToken, checkRole("admin"), BoxController.getBoxById);
router.put("/:id", checkToken, checkRole("admin"), BoxController.updateBox);
router.delete("/:id", checkToken, checkRole("admin"), BoxController.deleteBox);
router.get(
    "/centre/:centreId/etage/:etage/bloc/:bloc/numero/:numero",
    checkToken,
    checkRole("admin"),
    BoxController.getBoxByCompositeKey
);

module.exports = router;