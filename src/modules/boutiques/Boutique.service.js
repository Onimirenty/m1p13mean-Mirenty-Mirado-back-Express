const Boutique = require("./Boutique.model");
const AppError = require("../../utils/AppError");
const Utils = require("../../utils/Utils");
const mongoose = require("mongoose");
const Box = require('../spatial/Box.model');



const createBoutique = async (data) => {
  // 1. On sépare boxIds du reste des données de la boutique
  const { boxIds, ...boutiqueData } = data;
  const { name, ownerId, categorieId } = boutiqueData;

  if (!name || !ownerId || !categorieId) {
    throw new AppError("Veuillez fournir le nom, le proprio et la categorie de la boutique", 400);
  }

  if (!boxIds || !Array.isArray(boxIds)) {
    throw new AppError("Veuillez fournir un tableau valide de boxIds", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Vérifier les box
    const boxes = await Box.find({
      _id: { $in: boxIds },
      status: "AVAILABLE",
    }).session(session);

    if (boxes.length !== boxIds.length) {
      throw new AppError("Certaines box ne sont pas disponibles", 400);
    }

    // 3. Créer la boutique en utilisant TOUTES les données (boutiqueData)
    // Cela inclura boutiqueSlug, description, contact, images, etc.
    const boutique = await Boutique.create(
      [boutiqueData],
      { session }
    );

    const boutiqueId = boutique[0]._id;

    // 4. Assigner les box
    await Box.updateMany(
      { _id: { $in: boxIds } },
      {
        $set: {
          boutiqueId: boutiqueId,
          status: "OCCUPIED",
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return boutique[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const getBoutiqueWithBoxesById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Boutique ID", 400);
  }
  const boutique = await Boutique.findById(id)
    .populate("categorieId", "name")
    .populate("ownerId", "email");

  if (!boutique) {
    throw new Error("Boutique non trouvée");
  }
  const boxes = await Box.find({ boutiqueId: id });

  return {
    boutique,
    boxes,
  };
};


const getAllBoutiques = async () => {
  return await Boutique.aggregate([
    {
      $lookup: {
        from: "boxes",
        localField: "_id",
        foreignField: "boutiqueId",
        as: "boxes",
      },
    },
  ]);
};

const getBoutiqueById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Boutique ID", 400);
  }

  const boutique = await Boutique.findById(id)
    .populate("categorieId", "name")
    .populate("ownerId", "email");

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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Libérer les box
    await Box.updateMany(
      { boutiqueId: id },
      {
        $set: {
          boutiqueId: null,
          status: "AVAILABLE",
        },
      },
      { session }
    );

    // 2. Supprimer la boutique
    const boutiqueSupprime = await Boutique.findById(id).session(session);
    boutiqueSupprime.status = "INACTIVE";

    await boutiqueSupprime.save({ session });
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  createBoutique,
  getAllBoutiques,
  getBoutiqueById,
  updateBoutique,
  deleteBoutique,
  getBoutiqueWithBoxesById
};