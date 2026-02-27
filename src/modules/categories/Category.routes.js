const express = require("express");
const router = express.Router();
const { checkToken } = require('../../middlewares/auth.middleware');
const { checkRole } = require('../../middlewares/role.middleware');

const categorieController = require("./Category.controller");

router.post("/",checkToken,checkRole('ADMIN'), categorieController.createCategorie);
router.get("/",checkToken,checkRole('ADMIN'), categorieController.getAllCategories);
router.get("/:nom",checkToken,checkRole('ADMIN'), categorieController.getCategory);
router.put("/:nom",checkToken,checkRole('ADMIN'), categorieController.updateCategory);
router.delete("/:nom",checkToken,checkRole('ADMIN'), categorieController.deleteCategory);

module.exports = router;