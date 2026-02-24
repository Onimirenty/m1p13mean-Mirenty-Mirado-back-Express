const CentreCommercial = require("./CentreCommercial.model");
const logger = require("../../utils/logger");
const AppError = require("../../utils/AppError");
const Utils = require("../../utils/Utils");

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

module.exports = {
  createCentreCommercial
};