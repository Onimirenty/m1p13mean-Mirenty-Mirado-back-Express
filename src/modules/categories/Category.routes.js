const express = require("express");
const router = express.Router();
const { checkToken } = require('../../middlewares/auth.middleware');
const { checkRole } = require('../../middlewares/role.middleware');

const categorieController = require("./Category.controller");

router.post("/",checkToken,checkRole('admin'), categorieController.createCategorie);
router.get("/",checkToken,checkRole('admin'), categorieController.getAllCategories);
router.get("/:nom",checkToken,checkRole('admin'), categorieController.getCategory);
router.put("/:nom",checkToken,checkRole('admin'), categorieController.updateCategory);
router.delete("/:nom",checkToken,checkRole('admin'), categorieController.deleteCategory);

module.exports = router;