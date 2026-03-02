const Produit = require("./Produit.model");
const Boutique = require("../boutiques/Boutique.model");
const Categorie = require("../categories/Category.model");
const AppError = require("../../utils/AppError");
const mongoose = require("mongoose");

const createProduit = async (data) => {
  const { boutiqueId, categorieId } = data;

  // Vérifier si la boutique existe
  const boutiqueExists = await Boutique.findById(boutiqueId);
  if (!boutiqueExists) {
    throw new AppError("Boutique introuvable", 404);
  }

  // Vérifier si la catégorie existe
  const categorieExists = await Categorie.findById(categorieId);
  if (!categorieExists) {
    throw new AppError("Catégorie introuvable", 404);
  }

  const produit = await Produit.create(data);
  return produit;
};

const getAllProduits = async (filters = {}) => {
  // On peut filtrer par boutiqueId, categorieId, etc.
  return await Produit.find(filters)
    .populate("boutiqueId", "name boutiqueSlug")
    .populate("categorieId", "nom iconClass")
    .sort({ createdAt: -1 });
};

const getProduitById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("ID de produit invalide", 400);
  }

  const produit = await Produit.findById(id)
    .populate("boutiqueId", "name")
    .populate("categorieId", "nom");

  if (!produit) {
    throw new AppError("Produit introuvable", 404);
  }

  return produit;
};

const updateProduit = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("ID de produit invalide", 400);
  }

  const produit = await Produit.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!produit) {
    throw new AppError("Produit introuvable", 404);
  }

  return produit;
};

const deleteProduit = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("ID de produit invalide", 400);
  }

  const produit = await Produit.findByIdAndDelete(id);

  if (!produit) {
    throw new AppError("Produit introuvable", 404);
  }

  return produit;
};

module.exports = {
  createProduit,
  getAllProduits,
  getProduitById,
  updateProduit,
  deleteProduit,
};