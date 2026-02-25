const Categorie = require("./Category.model");
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger')


exports.createCategorie = async (nom, iconClass) => {
    try {
        if (!nom || !iconClass) {
            throw new AppError("Category.service.createCategorie : nom and iconClass are required", 400);
        }
        const existing = await Categorie.findOne({ nom });
        if (existing) {
            throw new AppError("Category.service.createCategorie : Categorie already exists", 409);
        }
        const categorie = await Categorie.create({ nom, iconClass });
        logger.info("Category.service.createCategorie : Categorie created:", categorie);
        return categorie;
    } catch (error) {
        logger.error("Category.service.createCategorie : Error creating categorie:", error.message);
        throw error;
    }
};

exports.getAllCategories = async () => {
    try {
        const categories = await Categorie.find().sort({ nom: 1 });
        return categories;

    } catch (error) {
        logger.error("Category.service.getAllCategories : Error getting all categories:", error.message);
        throw error;
    }
};

exports.getCategorieByName = async (name) => {
    try {
        const categorie = await Categorie.findOne({ nom: name });
        if (!categorie) {
            throw new AppError("Category.service.getCategorieByName : Categorie not found", 404);
        }
        return categorie;
    } catch (error) {
        logger.error("Category.service.getCategorieByName : ", error.message)
        throw error;
    }
};

exports.updateCategorieById = async (nom, iconClass, id) => {
    try {

        const categorie = await Categorie.findByIdAndUpdate(
            id,
            { nom, iconClass },
            { new: true, runValidators: true }
        );

        if (!categorie) {
            throw new AppError("Category.service.updateCategorieById : Categorie not found", 404);
        }

        return categorie;
    } catch (error) {
        logger.error("Category.service.updateCategorie : ", error.message);
        throw error;
    }
};
exports.updateCategorieByName = async (nom, newNom, iconClass) => {
    try {
        const categorie = await Categorie.findOneAndUpdate(
            { nom },
            { nom: newNom, iconClass },
            { new: true, runValidators: true }
        );

        if (!categorie) {
            throw new AppError("Category.service.updateCategorieByName : Categorie name or icon not found", 404);
        }

        return categorie;

    } catch (error) {
        logger.error("Category.service.updateCategorieByName : ", error.message);
        throw error;
    }
};

exports.deleteCategorieById = async (id) => {
    try {
        const categorie = await Categorie.findByIdAndDelete(id);

        if (!categorie) {
            throw new AppError("Category.service.deleteCategorieById : Categorie not found", 404);
        }

        logger.info("Category.service.deleteCategorieById :  Categorie deleted successfully");
    } catch (error) {
        logger.error("Category.service.deleteCategorieById : Invalid ID", error.message);
        throw error;
    }
};
exports.deleteCategorieByName = async (nom) => {
    try {
        const categorie = await Categorie.findOneAndDelete({ nom });

        if (!categorie) {
            throw new AppError(
                "Category.service.deleteCategorieByName : Categorie not found", 404);
        }
        logger.info("Category.service.deleteCategorieByName : Categorie deleted successfully");
    } catch (error) {
        logger.error("Category.service.deleteCategorieByName : ", error.message);
        throw error;
    }
};