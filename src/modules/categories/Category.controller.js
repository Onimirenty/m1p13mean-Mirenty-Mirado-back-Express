const Categorie = require("./Category.model");
const CategorieService = require("./Category.service");
const AppError = require('../../utils/AppError');

exports.createCategorie = async (req, res,next ) => {
    try {
        const { nom, iconClass } = req.body;
        const categorie = await CategorieService.createCategorie(nom, iconClass);
        res.status(201).json(categorie);
    } catch (error) {
        next(error);
    };
};

exports.getAllCategories = async (req, res,next ) => {
    try {
        const categories = await CategorieService.getAllCategories();
        res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
};

exports.getCategory = async (req, res,next ) => {
    try {
        const categorie = await CategorieService.getCategorieByName(req.params.nom);
        res.status(200).json(categorie);
    } catch (error) {
        next(error);
    }
};

exports.updateCategory= async (req, res,next ) => {
    try {
        const { nom, iconClass } = req.body;
        console.log("Category.controller.updateCategory : nom body = ", nom,"new nom(param) =",req.params.nom,"  icon : " ,iconClass);
        const categorie = await CategorieService.updateCategorieByName(req.params.nom, nom ,iconClass);
        res.status(200).json(categorie);
    } catch (error) {
        next(error);
    }
};

// DELETE
exports.deleteCategory= async (req, res,next ) => {
    try {
        const categorie = await CategorieService.deleteCategorieByName(req.params.nom);

        if (!categorie) {
            return res.status(404).json({ message: "Categorie not found" });
        }

        res.status(200).json({ message: "Categorie deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: "Invalid ID" });
    }
};