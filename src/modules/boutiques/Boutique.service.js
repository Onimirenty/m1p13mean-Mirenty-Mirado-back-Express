const Boutique = require("./Boutique.model");
const AppError = require("../../utils/AppError");
const Utils = require("../../utils/Utils");
const mongoose = require("mongoose");



const createBoutique = async (data) => {
  if (!data.name || !data.categorieId || !data.ownerId) {
    throw new AppError("name, categorieId and ownerId are required", 400);
  }

  const existing = await Boutique.findOne({ name: data.name });
  if (existing) {
    throw new AppError("Boutique with same name already exists", 409);
  }
  const boutique = await Boutique.create(data);

  return boutique;
};

const getAllBoutiques = async (filters = {}) => {
  return await Boutique.find(filters)
    .populate("categorieId", "nom")
    .populate("ownerId", "email")
    .populate("boxIds")
    .sort({ createdAt: -1 });
};


const getBoutiqueById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Boutique ID", 400);
  }

  const boutique = await Boutique.findById(id)
    .populate("categorieId", "nom")
    .populate("ownerId", "email")
    .populate("boxIds");

  if (!boutique) {
    throw new AppError("Boutique not found", 404);
  }

  return boutique;
};


const updateBoutique = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Boutique ID", 400);
  }

  if (data.name) {
    data.boutiqueSlug = Utils.generateSlug(data.name);
  }

  const boutique = await Boutique.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });

  if (!boutique) {
    throw new AppError("Boutique not found", 404);
  }

  return boutique;
};


const deleteBoutique = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Boutique ID", 400);
  }

  const boutique = await Boutique.findByIdAndDelete(id);

  if (!boutique) {
    throw new AppError("Boutique not found", 404);
  }

  return boutique;
};

module.exports = {
  createBoutique,
  getAllBoutiques,
  getBoutiqueById,
  updateBoutique,
  deleteBoutique
};