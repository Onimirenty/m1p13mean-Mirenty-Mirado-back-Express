const Boutique = require("./Boutique.model");
const AppError = require("../../utils/AppError");
const Utils = require("../../utils/Utils");
const mongoose = require("mongoose");
const Box = require('../spatial/Box.model');

// ─────────────────────────────────────────
// HELPERS PRIVÉS
// ─────────────────────────────────────────

const validateObjectId = (id, label = "ID") => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`${label} invalide`, 400);
  }
};

const validatePagination = (page, limit) => {
  const p = parseInt(page);
  const l = parseInt(limit);
  if (isNaN(p) || p < 1) throw new AppError("Le paramètre 'page' doit être un entier >= 1", 400);
  if (isNaN(l) || l < 1 || l > 100) throw new AppError("Le paramètre 'limit' doit être entre 1 et 100", 400);
  return { page: p, limit: l };
};

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────

const createBoutique = async (data) => {
  if (!data || typeof data !== "object") {
    throw new AppError("Données manquantes", 400);
  }

  const { boxIds, ...boutiqueData } = data;
  const { name, ownerId, categorieId } = boutiqueData;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new AppError("Le nom de la boutique est requis", 400);
  }
  if (!ownerId) {
    throw new AppError("L'identifiant du propriétaire est requis", 400);
  }
  if (!categorieId) {
    throw new AppError("L'identifiant de la catégorie est requis", 400);
  }

  validateObjectId(ownerId, "ownerId");
  validateObjectId(categorieId, "categorieId");

  if (!boxIds || !Array.isArray(boxIds) || boxIds.length === 0) {
    throw new AppError("Veuillez fournir un tableau non vide de boxIds", 400);
  }

  const invalidIds = boxIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    throw new AppError(`boxIds invalides : ${invalidIds.join(", ")}`, 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const boxes = await Box.find({
      _id: { $in: boxIds },
      status: "AVAILABLE",
    }).session(session);

    if (boxes.length !== boxIds.length) {
      throw new AppError("Certaines box sont introuvables ou ne sont pas disponibles", 400);
    }

    const boutique = await Boutique.create([boutiqueData], { session });
    const boutiqueId = boutique[0]._id;

    await Box.updateMany(
      { _id: { $in: boxIds } },
      { $set: { boutiqueId, status: "OCCUPIED" } },
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

// ─────────────────────────────────────────
// READ — ADMIN
// ─────────────────────────────────────────

const getAllBoutiques = async (filters = {}) => {
  const allowedFilters = {};

  if (filters.status) {
    const s = filters.status.toUpperCase();
    const allowed = ["ACTIVE", "INACTIVE", "SUSPENDED"];
    if (!allowed.includes(s)) {
      throw new AppError(`Statut invalide. Valeurs acceptées : ${allowed.join(", ")}`, 400);
    }
    allowedFilters.status = s;
  }

  if (filters.categorieId) {
    validateObjectId(filters.categorieId, "categorieId");
    allowedFilters.categorieId = new mongoose.Types.ObjectId(filters.categorieId);
  }

  if (filters.ownerId) {
    validateObjectId(filters.ownerId, "ownerId");
    allowedFilters.ownerId = new mongoose.Types.ObjectId(filters.ownerId);
  }

  return Boutique.aggregate([
    { $match: allowedFilters },
    {
      $lookup: {
        from: "boxes",
        localField: "_id",
        foreignField: "boutiqueId",
        as: "boxes",
      },
    },
    { $sort: { createdAt: -1 } },
  ]);
};

const getBoutiqueById = async (id) => {
  validateObjectId(id, "ID boutique");

  const boutique = await Boutique.findById(id)
    .populate("categorieId", "nom iconClass")
    .populate("ownerId", "email name");

  if (!boutique) {
    throw new AppError("Boutique introuvable", 404);
  }

  return boutique;
};

const getBoutiqueWithBoxesById = async (id) => {
  validateObjectId(id, "ID boutique");

  const boutique = await Boutique.findById(id)
    .populate("categorieId", "nom iconClass")
    .populate("ownerId", "email name");

  if (!boutique) {
    throw new AppError("Boutique introuvable", 404);
  }

  const boxes = await Box.find({ boutiqueId: id });

  return { boutique, boxes };
};

const getBoutiquesByStatus = async (status) => {
  const filter = {};

  if (status) {
    const s = status.toUpperCase();
    const allowed = ["ACTIVE", "INACTIVE", "SUSPENDED"];
    if (!allowed.includes(s)) {
      throw new AppError(`Statut invalide. Valeurs acceptées : ${allowed.join(", ")}`, 400);
    }
    filter.status = s;
  }

  return Boutique.find(filter)
    .populate("categorieId", "nom iconClass")
    .populate("ownerId", "email name")
    .sort({ createdAt: -1 });
};

// ─────────────────────────────────────────
// READ — OWNER
// ─────────────────────────────────────────

const getBoutiqueDetailForOwner = async (boutiqueId) => {
  validateObjectId(boutiqueId, "ID boutique");

  const boutique = await Boutique.findById(boutiqueId)
    .populate("categorieId", "nom iconClass");

  if (!boutique) {
    throw new AppError("Boutique introuvable", 404);
  }

  const boxes = await Box.find({ boutiqueId })
    .populate("centreCommercialId", "name");

  const box = boxes[0] || null;
  const zone = box
    ? {
      etage: box.etage,
      bloc: box.bloc,
      boxNumero: box.numero,
      centre: box.centreCommercialId?.name || null,
    }
    : null;

  return {
    _id: boutique._id,
    nom: boutique.name,
    description: boutique.description || null,
    logoUrl: boutique.images?.[0]?.url || null,
    categorie: boutique.categorieId,
    zone,
    horaires: boutique.opening || null,
    contacts: boutique.contact || null,
    vues: boutique.statsSnapshot?.totalViews || 0,
    createdAt: boutique.createdAt,
  };
};

// ─────────────────────────────────────────
// READ — PUBLIC
// ─────────────────────────────────────────

const getPublicBoutiques = async ({ page = 1, limit = 10, query, category } = {}) => {
  const { page: p, limit: l } = validatePagination(page, limit);

  const filter = { status: "ACTIVE" };

  if (query) {
    if (typeof query !== "string" || query.trim().length < 1) {
      throw new AppError("Le paramètre 'query' doit être une chaîne non vide", 400);
    }
    filter.name = { $regex: query.trim(), $options: "i" };
  }

  if (category) {
    if (typeof category !== "string" || category.trim().length < 1) {
      throw new AppError("Le paramètre 'category' doit être une chaîne non vide", 400);
    }
    const Categorie = require("../categories/Category.model");
    const cat = await Categorie.findOne({ nom: { $regex: category.trim(), $options: "i" } });
    if (cat) {
      filter.categorieId = cat._id;
    } else {
      // Catégorie inconnue → résultat vide garanti, on retourne directement
      return {
        data: [],
        pagination: { page: p, limit: l, totalItems: 0, hasMore: false },
      };
    }
  }

  const [total, boutiques] = await Promise.all([
    Boutique.countDocuments(filter),
    Boutique.find(filter)
      .populate("categorieId", "nom iconClass")
      .skip((p - 1) * l)
      .limit(l)
      .sort({ createdAt: -1 }),
  ]);

  const data = boutiques.map((b) => ({
    _id: b._id,
    nom: b.name,
    logoUrl: b.images?.[0]?.url || null,
    categorie: b.categorieId,
    horaires: b.opening || null,
    contact: b.contact?.phone || null,
    vues: b.statsSnapshot?.totalViews || 0,
    createdAt: b.createdAt,
  }));

  return {
    data,
    pagination: {
      page: p,
      limit: l,
      totalItems: total,
      hasMore: p * l < total,
    },
  };
};

const getPublicBoutiqueById = async (id) => {
  validateObjectId(id, "ID boutique");

  const boutique = await Boutique.findById(id)
    .populate("categorieId", "nom iconClass");

  if (!boutique || boutique.status !== "ACTIVE") {
    throw new AppError("Boutique introuvable", 404);
  }

  const boxes = await Box.find({ boutiqueId: id })
    .populate("centreCommercialId", "name");

  const box = boxes[0] || null;

  return {
    _id: boutique._id,
    nom: boutique.name,
    description: boutique.description || null,
    logoUrl: boutique.images?.[0]?.url || null,
    categorie: boutique.categorieId,
    zone: box
      ? {
        etage: box.etage,
        bloc: box.bloc,
        boxNumero: box.numero,
        centre: box.centreCommercialId?.name || null,
      }
      : null,
    horaires: boutique.opening || null,
    contacts: boutique.contact || null,
    vues: boutique.statsSnapshot?.totalViews || 0,
    createdAt: boutique.createdAt,
  };
};

// ─────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────

const updateBoutique = async (id, data) => {
  validateObjectId(id, "ID boutique");

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new AppError("Aucune donnée fournie pour la mise à jour", 400);
  }

  // 1. Bloquer les champs que le CALLER ne doit pas envoyer
  // boutiqueSlug est retiré de la liste car il sera généré en interne depuis name
  const forbidden = ["ownerId", "statsSnapshot"];
  forbidden.forEach((field) => {
    if (data[field] !== undefined) {
      throw new AppError(`Le champ '${field}' ne peut pas être modifié directement`, 400);
    }
  });

  // 2. Bloquer explicitement boutiqueSlug envoyé directement par le caller
  if (data.boutiqueSlug !== undefined) {
    throw new AppError("Le slug ne peut pas être modifié directement, modifiez le nom", 400);
  }

  // 3. Générer le slug en interne à partir du name
  if (data.name) {
    if (typeof data.name !== "string" || !data.name.trim()) {
      throw new AppError("Le nom fourni est invalide", 400);
    }
    data.boutiqueSlug = Utils.generateSlug(data.name.trim());
  }

  if (data.status) {
    const allowed = ["ACTIVE", "INACTIVE", "SUSPENDED"];
    if (!allowed.includes(data.status.toUpperCase())) {
      throw new AppError(`Statut invalide. Valeurs acceptées : ${allowed.join(", ")}`, 400);
    }
    data.status = data.status.toUpperCase();
  }

  if (data.categorieId) {
    validateObjectId(data.categorieId, "categorieId");
  }

  const boutique = await Boutique.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!boutique) {
    throw new AppError("Boutique introuvable", 404);
  }

  return boutique;
};

const setBoutiqueStatus = async (id, status) => {
  validateObjectId(id, "ID boutique");

  const allowed = ["ACTIVE", "INACTIVE", "SUSPENDED"];
  const normalized = (status || "").toUpperCase();

  if (!allowed.includes(normalized)) {
    throw new AppError(`Statut invalide. Valeurs acceptées : ${allowed.join(", ")}`, 400);
  }

  const boutique = await Boutique.findByIdAndUpdate(
    id,
    { status: normalized },
    { new: true, runValidators: true }
  );

  if (!boutique) {
    throw new AppError("Boutique introuvable", 404);
  }

  return boutique;
};

// ─────────────────────────────────────────
// DELETE / DÉSACTIVATION
// ─────────────────────────────────────────


const deactivateBoutique = async (id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const boutique = await Boutique.findById(id).session(session);
    if (!boutique) throw new AppError("Boutique introuvable", 404);
    if (boutique.status === "INACTIVE") throw new AppError("Déjà inactive", 400);

    await Box.updateMany(
      { boutiqueId: id },
      { $set: { boutiqueId: null, status: "AVAILABLE" } },
      { session }
    );

    boutique.status = "INACTIVE";
    await boutique.save({ session });
    await session.commitTransaction();

    return boutique;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ─────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────

module.exports = {
  createBoutique,
  getAllBoutiques,
  getBoutiqueById,
  getBoutiqueWithBoxesById,
  getBoutiquesByStatus,
  getBoutiqueDetailForOwner,
  getPublicBoutiques,
  getPublicBoutiqueById,
  updateBoutique,
  setBoutiqueStatus,
  deactivateBoutique,
};