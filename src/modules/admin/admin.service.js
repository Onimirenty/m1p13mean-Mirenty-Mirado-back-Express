const mongoose = require('mongoose');

const BoutiqueService = require('../boutiques/Boutique.service');
const DemandeService = require('../boutiques/demande_boutiques/DemandeBoutique.service');
const CmService = require('../centre_commercial/CentreCommercial.service');
const CategorieService = require('../categories/Category.service');
const BoxService = require('../spatial/Box.service');
const AnnonceService = require('../annonce/Annonce.service');
const Promotion = require('../promotions/Promotion.model');
const Boutique = require('../boutiques/Boutique.model');
const AppError = require('../../utils/AppError');
const DemandeBoutique = require('../boutiques/demande_boutiques/DemandeBoutique.model');
  
const { normalizeBody } = require('../../utils/Utils');

// ─────────────────────────────────────────
// CENTRE COMMERCIAL
// ─────────────────────────────────────────

const getCentre = async () => {
  const centre = await CmService.getCentreCommercialById(process.env.CM_ID);
  return {
    nom: centre.name,
    description: centre.description,
    horaires: centre.horaires || null,
    contact: centre.contact?.phone || null,
    email: centre.contact?.email || null ,
  };
};
const updateCentre = async (body, uploadedImage) => {
  const updateData = normalizeBody({ ...body });

  if (uploadedImage) {
    updateData.planImageUrl = uploadedImage.url;
    updateData.planImagePublicId = uploadedImage.publicId;
  }

  const centre = await CmService.updateCentreCommercial(process.env.CM_ID, updateData);

  return {
    nom: centre.name,
    description: centre.description,
    horaires: centre.horaires || null,
    contact: centre.contact?.phone || null,
    email: centre.contact?.email || null,
    planImageUrl: centre.planImageUrl || null,
  };
};


// ─────────────────────────────────────────
// BOUTIQUES
// ─────────────────────────────────────────
const getAllBoutiques = async (query) => {
  // ── Cas spécial : EN_ATTENTE → retourner les DemandeBoutique PENDING ──
  if (query.status?.toUpperCase() === "EN_ATTENTE") {
    const demandes = await DemandeBoutique.find({ status: "PENDING" })
      .populate('categorieId', 'nom iconClass')
      .populate('ownerId', 'email')
      .sort({ createdAt: -1 });

    return demandes.map(d => ({
      _id:       d._id,
      email:     d.ownerId?.email || null,
      nom:       d.nomBoutique,
      categorie: d.categorieId,
      horaires:  d.opening || null,
      contact:   d.contact?.telephone || null,
      status:    "EN_ATTENTE",
      type:      "DEMANDE",   // ← pour que le frontend sache que c'est une demande
      createdAt: d.createdAt,
    }));
  }

  // ── Cas normal : ACTIVE | INACTIVE | SUSPENDED ──
  const filter = {};

  if (query.status) {
    const statuses = query.status
      .split("|")
      .map(s => s.trim().toUpperCase())
      .filter(s => ["ACTIVE", "INACTIVE", "SUSPENDED"].includes(s));

    if (statuses.length === 0) {
      throw new AppError("Statut invalide. Valeurs acceptées : ACTIVE, INACTIVE, SUSPENDED, EN_ATTENTE", 400);
    }

    filter.status = statuses.length === 1
      ? statuses[0]
      : { $in: statuses };
  }

  const boutiques = await Boutique.find(filter)
    .populate('categorieId', 'nom iconClass')
    .populate('ownerId', 'email')
    .sort({ createdAt: -1 });

  return boutiques.map(b => ({
    _id:       b._id,
    email:     b.ownerId?.email || null,
    nom:       b.name,
    logoUrl:   b.images?.[0]?.url || null,
    categorie: b.categorieId,
    horaires:  b.opening || null,
    contact:   b.contact?.phone || null,
    status:    b.status,
    type:      "BOUTIQUE",
    createdAt: b.createdAt,
  }));
};

const validateBoutique = async (id) => {
  const boutique = await DemandeService.approveDemande(id);
  return {
    _id: boutique._id,
    nom: boutique.name,
    status: boutique.status,
  };
};

const activateBoutique = async (id) => {
  const boutique = await BoutiqueService.updateBoutique(id, { status: 'ACTIVE' });
  return {
    _id: boutique._id,
    nom: boutique.name,
    status: boutique.status,
  };
};

const disableBoutique = async (id) => {
  const boutique = await BoutiqueService.deactivateBoutique(id);
  return { _id: boutique._id, nom: boutique.name, status: boutique.status };
};

// ─────────────────────────────────────────
// CATÉGORIES
// ─────────────────────────────────────────

const createCategorie = async (nom, iconClass) => {
  return CategorieService.createCategorie(nom, iconClass);
};

const getAllCategories = async () => {
  return CategorieService.getAllCategories();
};

// ─────────────────────────────────────────
// ZONES / BOXES
// ─────────────────────────────────────────

const createZone = async (body) => {
  return BoxService.createBox({
    ...body,
    centreCommercialId: body.centreCommercialId || process.env.CM_ID,
  });
};

const getAllZones = async (query) => {
  const filter = {};

  if (query.status) {
    // Support "AVAILABLE|PENDING|OCCUPIED" → { status: { $in: [...] } }
    const statuses = query.status
      .split("|")
      .map(s => s.trim().toUpperCase())
      .filter(s => ["AVAILABLE", "PENDING", "OCCUPIED"].includes(s));

    if (statuses.length === 0) {
      throw new AppError("Statut invalide. Valeurs acceptées : AVAILABLE, PENDING, OCCUPIED", 400);
    }

    filter.status = statuses.length === 1
      ? statuses[0]           // { status: "AVAILABLE" }
      : { $in: statuses };    // { status: { $in: ["AVAILABLE", "PENDING"] } }
  }

  return BoxService.getAllBoxes(filter);
};

// ─────────────────────────────────────────
// PROMOTIONS
// ─────────────────────────────────────────

const getAllPromotions = async (query) => {
  const filter = {};
  if (query.status) {
    filter.status = query.status.toUpperCase();
  }

  const promotions = await Promotion.find(filter)
    .populate('boutiqueId', 'name')
    .sort({ createdAt: -1 });

  return promotions.map(p => ({
    _id: p._id,
    titre: p.titre,
    taux: p.pourcentageReduction,
    prixInitial: p.prixOrigine,
    prixReduit: p.prixPromotion,
    description: p.description,
    imageUrl: p.image || null,
    dateDebut: p.dateDebut,
    dateFin: p.dateFin,
    status: p.status,
    vues: p.stats?.vues || 0,
    createdAt: p.createdAt,
  }));
};

const patchPromotion = async (id, body) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('ID promotion invalide', 400);
  }

  const allowedFields = ['status', 'prioriteAffichage'];
  const updateData = {};
  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw new AppError('Aucun champ valide fourni', 400);
  }

  const promotion = await Promotion.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!promotion) throw new AppError('Promotion introuvable', 404);

  return {
    _id: promotion._id,
    titre: promotion.titre,
    description: promotion.description,
    status: promotion.status,
    updatedAt: promotion.updatedAt,
  };
};

// ─────────────────────────────────────────
// ANNONCES
// ─────────────────────────────────────────

const createAnnonce = async (title, content, userId) => {
  if (!title || !content) {
    throw new AppError('title et content sont requis', 400);
  }
  return AnnonceService.createAnnonce({ title, content, createdBy: userId });
};

const getAllAnnonces = async () => {
  return AnnonceService.getAllAnnonces();
};

module.exports = {
  getCentre,
  updateCentre,
  getAllBoutiques,
  validateBoutique,
  activateBoutique,
  disableBoutique,
  createCategorie,
  getAllCategories,
  createZone,
  getAllZones,
  getAllPromotions,
  patchPromotion,
  createAnnonce,
  getAllAnnonces,
};
