const Annonce = require("./Annonce.model");
const AppError = require("../../utils/AppError");
const mongoose = require("mongoose");

const createAnnonce = async (data) => {
  const { title, content, createdBy } = data;
  if (!title || !content) throw new AppError("title et content sont requis", 400);
  return Annonce.create({ title, content, createdBy });
};

const getAllAnnonces = async () => {
  return Annonce.find()
    .populate("createdBy", "email name")
    .sort({ createdAt: -1 });
};

const getAnnonceById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("ID annonce invalide", 400);
  const annonce = await Annonce.findById(id).populate("createdBy", "email name");
  if (!annonce) throw new AppError("Annonce introuvable", 404);
  return annonce;
};

const updateAnnonce = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("ID annonce invalide", 400);
  const annonce = await Annonce.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!annonce) throw new AppError("Annonce introuvable", 404);
  return annonce;
};

const deleteAnnonce = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("ID annonce invalide", 400);
  const annonce = await Annonce.findByIdAndDelete(id);
  if (!annonce) throw new AppError("Annonce introuvable", 404);
  return annonce;
};

module.exports = {
  createAnnonce,
  getAllAnnonces,
  getAnnonceById,
  updateAnnonce,
  deleteAnnonce,
};
