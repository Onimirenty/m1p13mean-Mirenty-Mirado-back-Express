const mongoose = require("mongoose");
const DemandeBoutique = require("./DemandeBoutique.model");
const Boutique = require("../Boutique.model");
const Box = require("../../spatial/Box.model");
const User = require("../../users/User.model");
const AppError = require("../../../utils/AppError");

/**
 * CREATE DEMANDE
 * - Box doit être AVAILABLE
 * - Boutique créée en PENDING
 * - Box passe en PENDING
 */
const createDemandeBoutique = async (data) => {
  const { boxId } = data;

  if (!mongoose.Types.ObjectId.isValid(boxId)) {
    throw new AppError("Invalid boxId", 400);
  }

  const box = await Box.findById(boxId);
  if (!box) throw new AppError("Box not found", 404);

  if (box.status !== "AVAILABLE") {
    throw new AppError("Box is not available", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const demande = await DemandeBoutique.create([{
      ...data,
      status: "PENDING"
    }], { session });

    box.status = "PENDING";
    await box.save({ session });

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
    .populate("boxId")
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
    .populate("boxId")
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
const approveDemande = async (demandeId, ownerData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const demande = await DemandeBoutique.findById(demandeId)
      .populate("boxId")
      .session(session);

    if (!demande) throw new AppError("Demande not found", 404);
    if (demande.status !== "PENDING")
      throw new AppError("Demande already processed", 400);

    // Create owner
    const owner = await User.create([{
      ...ownerData,
      role: "PROPRIETAIRE"
    }], { session });

    // Update box
    demande.boxId.status = "OCCUPIED";
    await demande.boxId.save({ session });

    // Update demande
    demande.status = "APPROVED";
    demande.ownerId = owner[0]._id;
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
      .populate("boxId")
      .session(session);

    if (!demande) throw new AppError("Demande not found", 404);
    if (demande.status !== "PENDING")
      throw new AppError("Demande already processed", 400);

    demande.status = "REJECTED";
    demande.rejectionReason = reason;

    demande.boxId.status = "AVAILABLE";
    await demande.boxId.save({ session });

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