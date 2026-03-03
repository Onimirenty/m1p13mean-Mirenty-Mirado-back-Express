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
  console.log("[createDemandeBoutique] data reçu :", JSON.stringify({
    nomBoutique: data.nomBoutique,
    logoUrl: data.logoUrl,
    logoPublicId: data.logoPublicId,
    opening: data.opening,
    password: data.password ? "***" : null,
  }));
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
    // select: false sur password → on le sélectionne explicitement
    const demande = await DemandeBoutique
      .findById(demandeId)
      .select('+password')
      .session(session);

    if (!demande) {
      throw new AppError("Demande de creation de boutique introuvable", 404);
    }

    if (demande.status !== "PENDING") {
      throw new AppError("Demande de creation de boutique déjà traitée", 409);
    }

    const { boxIds, nomBoutique, ownerId, categorieId } = demande;

    const boutiqueSlug = Utils.generateSlugPreserveCase(nomBoutique);

    // ── Construire les données boutique avec les nouveaux champs ──
    const boutiqueData = {
      name: nomBoutique,
      ownerId: ownerId,
      categorieId: categorieId,
      boutiqueSlug: boutiqueSlug,

      // Horaires depuis la demande
      ...(demande.opening?.days?.firstDay && {
        opening: demande.opening
      }),

      // Contact depuis la demande
      ...(demande.contact?.telephone && {
        contact: { phone: demande.contact.telephone }
      }),

      // Description depuis la demande
      ...(demande.description && {
        description: demande.description
      }),

      // Logo depuis la demande
      ...(demande.logoUrl && {
        images: [{ type: "logo", url: demande.logoUrl }],
        imagePublicIds: demande.logoPublicId ? [demande.logoPublicId] : [],
      }),
    };

    const [boutique] = await Boutique.create([boutiqueData], { session });

    const updateResult = await Box.updateMany(
      { _id: { $in: boxIds }, status: "PENDING" },
      { $set: { boutiqueId: boutique._id, status: "OCCUPIED" } },
      { session }
    );

    if (updateResult.modifiedCount !== boxIds.length) {
      throw new AppError("Certaines box ne sont plus disponibles", 409);
    }

    // ── Mettre à jour le user : rôle OWNER + password si fourni ──
    const userUpdate = { role: "OWNER" };

    if (demande.password) {
      // Le password de la demande va sur le compte User
      // Le pre-save hook de User.model hashera automatiquement
      const user = await User.findById(ownerId).session(session);
      if (user) {
        user.role = "OWNER";
        user.password = demande.password;
        await user.save({ session });
      }
    } else {
      await User.findByIdAndUpdate(ownerId, userUpdate, { session });
    }

    demande.status = "ACCEPTED";
    await demande.save({ session });

    await session.commitTransaction();
    session.endSession();

    return boutique;

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
    // const demande = await DemandeBoutique.findById(demandeId)
    //   .populate("boxIds")
    //   .session(session);
    const demande = await DemandeBoutique.findById(demandeId).session(session);

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
const normalizeBody = (body) => {
  const result = {};

  for (const [key, value] of Object.entries(body)) {
    if (key.includes(".")) {
      const parts = key.split(".");

      if (parts.length === 2) {
        const [parent, child] = parts;
        if (!result[parent]) result[parent] = {};
        result[parent][child] = value;

      } else if (parts.length === 3) {
        const [grandParent, parent, child] = parts;
        if (!result[grandParent]) result[grandParent] = {};
        if (!result[grandParent][parent]) result[grandParent][parent] = {};
        result[grandParent][parent][child] = value;
      }

    } else {
      result[key] = value;
    }
  }

  return result;
};

const mapClientFormatToDemandeBoutique = (clientData) => {
  const jours  = clientData.horaires?.jours  || "";
  const heures = clientData.horaires?.heures || "";

  // Accepter tiret long "–", tiret court "-", tiret moyen "—"
  const [firstDay, lastDay] = jours
    .split(/\s*[–—-]\s*/)
    .map(s => s.trim());

  // Accepter les deux séparateurs pour les heures aussi
  const timeParts = heures.split(/\s*[–—-]\s*/).map(s => s.trim());
  const openingTime = timeParts[0] || "";
  const closingTime = timeParts[1] || "";

  return {
    nomBoutique:  clientData.nom         || "",
    categorieId:  clientData.categorieId || "",
    boxIds:       clientData.zoneId ? [clientData.zoneId] : [],
    description:  clientData.description || "",
    password:     clientData.password    || "",

    contact: {
      telephone: clientData.contactBoutique || "",
    },

    opening: {
      days: {
        firstDay:  firstDay  || "",
        lastDay:   lastDay   || "",
      },
      hours: {
        openingTime,
        closingTime,
      },
    },

    _userFields: {
      email:        clientData.email          || "",
      phone_number: clientData.contactProprio || "",
      password:     clientData.password       || "",
    },
  };
};
const mapDemandeBoutiqueToClientFormat = (demande, user) => {
  const box = demande.boxIds?.[0];

  const firstDay = demande.opening?.days?.firstDay || "";
  const lastDay = demande.opening?.days?.lastDay || "";
  const openTime = demande.opening?.hours?.openingTime || "";
  const closeTime = demande.opening?.hours?.closingTime || "";

  const jours = (firstDay && lastDay)
    ? `${firstDay}–${lastDay}`
    : firstDay || "";

  const heures = (openTime && closeTime)
    ? `${openTime} - ${closeTime}`
    : openTime || "";

  return {
    email: demande.ownerId?.email || user?.email || "",
    password: demande.password || "",
    nom: demande.nomBoutique || "",
    categorieId: demande.categorieId?._id?.toString()
      || demande.categorieId?.toString() || "",
    zoneId: box?._id?.toString() || box?.toString() || "",
    horaires: {
      jours,
      heures,
    },
    contactBoutique: demande.contact?.telephone || "",
    contactProprio: user?.phone_number || "",
    description: demande.description || "",
  };
};
module.exports = {
  createDemandeBoutique,
  getAllDemandes,
  getDemandeById,
  approveDemande,
  rejectDemande,
  mapDemandeBoutiqueToClientFormat,
  mapClientFormatToDemandeBoutique,
  normalizeBody
};