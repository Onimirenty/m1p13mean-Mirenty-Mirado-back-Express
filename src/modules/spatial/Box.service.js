const Box = require("./Box.model");
const AppError = require("../../utils/AppError");
const mongoose = require("mongoose");
const CentreCommercial = require("../centre_commercial/CentreCommercial.model");

/**
 * CREATE
 */
const createBox = async (data) => {
    try {
        const box = await Box.create(data);
        return box;
    } catch (error) {
        throw new AppError(`Failed to create Box: ${error.message}`, 500);
    }
};

/**
 * GET ALL
 */
const getAllBoxes = async (filters = {}) => {
    return await Box.find(filters)
        .populate("boutiqueId", "name") 
        .populate("centreCommercialId", "name")
        .sort({ createdAt: -1 });
};

/**
 * GET ONE
 */
const getBoxById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid Box ID", 400);
    }

    const box = await Box.findById(id)
        .populate("boutiqueId", "name")
        .populate("centreCommercialId", "name");

    if (!box) {
        throw new AppError("Box not found", 404);
    }

    return box;
};

const getBoxByCompositeKey = async ({ cmSlug, etage, bloc, numero }) => {

    // Validation primitive
    if (!cmSlug || etage === undefined || numero === undefined || !bloc) {
        throw new AppError("cmSlug, etage, bloc and numero are required", 400);
    }

    // Trouver le centre via son slug
    const centre = await CentreCommercial.findOne({ cmSlug: cmSlug });
    if (!centre) {
        throw new AppError("CentreCommercial not found", 404);
    }
    // Requête via index composite
    const box = await Box.findOne({
        centreCommercialId: centre._id,
        etage: Number(etage),
        bloc: bloc.trim().toUpperCase(),
        numero: Number(numero)
    })
        .populate("boutiqueId", "name")
        .populate("centreCommercialId", "cmSlug");

    if (!box) {
        throw new AppError("Box not found", 404);
    }

    return box;
};

/**
 * UPDATE
 */
const updateBox = async (id, data) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid Box ID", 400);
    }

    const box = await Box.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });

    if (!box) {
        throw new AppError("Box not found", 404);
    }

    return box;
};

/**
 * DELETE
 */
const deleteBox = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid Box ID", 400);
    }

    const box = await Box.findByIdAndDelete(id);

    if (!box) {
        throw new AppError("Box not found", 404);
    }

    return box;
};

module.exports = {
    createBox,
    getAllBoxes,
    getBoxById,
    getBoxByCompositeKey,
    updateBox,
    deleteBox
};