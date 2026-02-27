const mongoose = require("mongoose");
const DemandeBoutique = require("./DemandeBoutique.model");
const Boutique = require("../Boutique.model");
const Box = require("../../spatial/Box.model");
const User = require("../../users/User.model");
const AppError = require("../../../utils/AppError");
const Utils = require("../../../utils/Utils");



const createDemandeBoutique = async (data) => {
  const { boxIds } = data;

  if (!Array.isArray(boxIds) || boxIds.length === 0) {
    throw new AppError("boxIds must be a non-empty array", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const boxes = await Box.find({
      _id: { $in: boxIds },
      status: "AVAILABLE"
    }).session(session);

    if (boxes.length !== boxIds.length) {
      throw new AppError("Some boxes not available", 400);
    }

    const demande = await DemandeBoutique.create([{
      ...data,
      status: "PENDING"
    }], { session });

    await Box.updateMany(
      { _id: { $in: boxIds } },
      { status: "PENDING" },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return demande[0];

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};




/**
 * GET ALL
 */
const getAllDemandes = async () => {
  return await DemandeBoutique.find()
    .populate("boxIds")
    .populate("categorieId")
    .sort({ createdAt: -1 });
};


/**
 * GET ONE
 */
const getDemandeById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid demande ID", 400);
  }

  const demande = await DemandeBoutique.findById(id)
    .populate("boxIds")
    .populate("categorieId");

  if (!demande) throw new AppError("Demande not found", 404);

  return demande;
};


/**
 * APPROVE (ADMIN)
 * - Création propriétaire
 * - Box → OCCUPIED
 * - Boutique → ACTIVE
 * - Demande → APPROVED
 */
const approveDemande = async (demandeId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const demande = await DemandeBoutique.findById(demandeId).session(session);
    if (!demande) {
      throw new AppError("Demande de creation de boutique introuvable", 404);
    }
    if (demande.status !== "PENDING") {
      throw new Error("Demande de creation de boutique  déjà traitée", 409);
    }
    const { boxIds, nomBoutique, ownerId, categorieId } = demande;

    // 1. Vérifier disponibilité des box
    const boxes = await Box.find({
      _id: { $in: boxIds },
      status: "PENDING",
    }).session(session);

    if (boxes.length !== boxIds.length) {
      throw new AppError("Certaines box ne sont plus disponibles", 409);
    }

    // 2. Créer la boutique
    const boutiqueSlug = Utils.generateSlugPreserveCase();
    const boutique = await Boutique.create(
      [{ name: nomBoutique, ownerId: ownerId, categorieId, boutiqueSlug: boutiqueSlug }],
      { session }
    );

    // const boutiqueInstance = new Boutique({
    //   name: nomBoutique,
    //   ownerId,
    //   categorieId
    // });

    // const boutique = await boutiqueInstance.save({ session });
    console.log("1111111111111111111111111111111111111111111111111111111111111111111111111111111111111");

    const boutiqueId = boutique[0]._id;

    // 3. Assigner les box (SEULE source de vérité)
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

    // 4. Update demande
    demande.status = "ACCEPTED";
    await demande.save({ session });

    await session.commitTransaction();
    session.endSession();

    return boutique[0];
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};


/**
 * REJECT (ADMIN)
 * - Box → AVAILABLE
 * - Demande → REJECTED
 */
const rejectDemande = async (demandeId, reason) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const demande = await DemandeBoutique.findById(demandeId)
      .populate("boxIds")
      .session(session);

    if (!demande) throw new AppError("Demande not found", 404);
    if (demande.status !== "PENDING")
      throw new AppError("Demande already processed", 400);

    demande.status = "REJECTED";
    demande.commentaireAdmin = reason;

    await Box.updateMany(
      { _id: { $in: demande.boxIds } },
      { status: "AVAILABLE" },
      { session }
    );

    await demande.save({ session });

    await session.commitTransaction();
    session.endSession();

    return demande;

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};


module.exports = {
  createDemandeBoutique,
  getAllDemandes,
  getDemandeById,
  approveDemande,
  rejectDemande
};