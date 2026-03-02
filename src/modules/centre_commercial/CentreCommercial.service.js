const CentreCommercial = require("./CentreCommercial.model");
const logger = require("../../utils/logger");
const AppError = require("../../utils/AppError");
const Utils = require("../../utils/Utils");
const mongoose = require("mongoose");

const createCentreCommercial = async (data) => {
  try {
    // 1. Vérification minimale
    if (!data.name || !data.name.trim()) {
      throw new AppError("Le nom du centre est obligatoire", 400);
    }

    // 2. Génération slug
    const cmSlug = Utils.generateSlug(data.name);

    // 3. Vérifier unicité
    const existing = await CentreCommercial.findOne({
      $or: [{ name: data.name }, { cmSlug: cmSlug }]
    });

    if (existing) {
      throw new AppError("Ce centre commercial existe déjà", 409);
    }

    // 4. Création
    const centre = new CentreCommercial({
      ...data,
      cmSlug: cmSlug
    });

    await centre.save();

    return centre;
  } catch (error) {
    throw error;
  }
};
const getCentreCommercialById = async (id) => {
  // 1. Validation de l'ID MongoDB
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("ID du Centre Commercial invalide", 400);
  }
  // 2. Recherche du centre
  const centre = await CentreCommercial.findById(id);
  // 3. Vérification d'existence
  if (!centre) {
    throw new AppError("Centre Commercial introuvable", 404);
  }
  return centre;
};
const updateCentreCommercial = async (id, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("ID de centre invalide", 400);
  }
  // On utilise { new: true, runValidators: true } pour récupérer le doc modifié 
  // et forcer la validation du schéma (enum status, etc.)
  const centre = await CentreCommercial.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  if (!centre) {
    throw new AppError("Centre commercial introuvable", 404);
  }

  return centre;
};
module.exports = {
  createCentreCommercial,
  getCentreCommercialById,
  updateCentreCommercial
};