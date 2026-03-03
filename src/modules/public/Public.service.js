const mongoose = require('mongoose');

const Boutique = require('../boutiques/Boutique.model');
const Promotion = require('../promotions/Promotion.model');
const Categorie = require('../categories/Category.model');
const Box = require('../spatial/Box.model');
const CentreCommercial = require('../centre_commercial/CentreCommercial.model');
const AppError = require('../../utils/AppError');

// ─────────────────────────────────────────
// HELPER PRIVÉ
// ─────────────────────────────────────────

const buildPagination = async (mongooseQuery, countQuery, page, limit) => {
  const skip = (page - 1) * limit;
  const [data, totalItems] = await Promise.all([
    mongooseQuery.skip(skip).limit(limit),
    countQuery,
  ]);
  return {
    data,
    pagination: { page, limit, totalItems, hasMore: skip + data.length < totalItems },
  };
};

const resolveCategoryFilter = async (categoryName) => {
  if (!categoryName) return null;
  const cat = await Categorie.findOne({ nom: { $regex: categoryName, $options: 'i' } });
  return cat?._id || null;
};

const formatBoutique = (b) => ({
  _id: b._id,
  nom: b.name,
  logoUrl: b.images?.[0]?.url || null,
  categorie: b.categorieId,
  horaires: b.opening || null,
  contact: b.contact?.phone || null,
});

const formatPromotion = (p) => ({
  _id: p._id,
  boutiqueId: p.boutiqueId?._id || p.boutiqueId,
  nomBoutique: p.boutiqueId?.name || null,
  titre: p.titre,
  taux: p.pourcentageReduction,
  prixInitial: p.prixOrigine,
  prixReduit: p.prixPromotion,
  description: p.description,
  imageUrl: p.image || null,
  dateDebut: p.dateDebut,
  dateFin: p.dateFin,
  vues: p.stats?.vues || 0,
  createdAt: p.createdAt,
});

// ─────────────────────────────────────────
// BOUTIQUES
// ─────────────────────────────────────────

const getBoutiques = async ({ page = 1, limit = 10, query, category } = {}) => {
  page = Math.max(1, parseInt(page));
  limit = Math.max(1, parseInt(limit));

  const filter = { status: 'ACTIVE' };
  if (query) filter.name = { $regex: query, $options: 'i' };

  const catId = await resolveCategoryFilter(category);
  if (catId) filter.categorieId = catId;

  const result = await buildPagination(
    Boutique.find(filter).populate('categorieId', 'nom iconClass').sort({ createdAt: -1 }),
    Boutique.countDocuments(filter),
    page,
    limit
  );

  result.data = result.data.map(formatBoutique);
  return result;
};

const getBoutiqueById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('ID boutique invalide', 400);


  const boutique = await Boutique.findById(id).populate('categorieId', 'nom iconClass');
  if (!boutique || boutique.status !== 'ACTIVE') {
    throw new AppError('Boutique introuvable', 404);
  }

  const box = await Box.findOne({ boutiqueId: boutique._id });

  return {
    _id: boutique._id,
    nom: boutique.name,
    description: boutique.description,
    logoUrl: boutique.images?.[0]?.url || null,
    categorie: boutique.categorieId,
    zone: box
      ? { etage: box.etage, bloc: box.bloc, description: box.description || null }
      : null,
    horaires: boutique.opening || null,
    contacts: boutique.contact || null,
    vues: boutique.statsSnapshot?.totalViews || 0,
    createdAt: boutique.createdAt,
  };
};

// ─────────────────────────────────────────
// PROMOTIONS
// ─────────────────────────────────────────

const getPromotions = async ({ page = 1, limit = 10, query, category } = {}) => {
  page = Math.max(1, parseInt(page));
  limit = Math.max(1, parseInt(limit));

  const now = new Date();
  const filter = { status: 'VALIDER', dateFin: { $gte: now } };
  if (query) filter.titre = { $regex: query, $options: 'i' };

  const catId = await resolveCategoryFilter(category);
  if (catId) {
    const boutiques = await Boutique.find({ categorieId: catId }).select('_id');
    filter.boutiqueId = { $in: boutiques.map(b => b._id) };
  }

  const result = await buildPagination(
    Promotion.find(filter).populate('boutiqueId', 'name').sort({ dateFin: 1, createdAt: -1 }),
    Promotion.countDocuments(filter),
    page,
    limit
  );

  result.data = result.data.map(formatPromotion);
  return result;
};

const getPromotionById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('ID promotion invalide', 400);

  const p = await Promotion.findById(id).populate('boutiqueId', 'name');
  if (!p) throw new AppError('Promotion introuvable', 404);

  return formatPromotion(p);
};

// ─────────────────────────────────────────
// RECHERCHE GLOBALE
// ─────────────────────────────────────────

const searchGlobal = async ({ page = 1, limit = 10, query, category } = {}) => {
  page = Math.max(1, parseInt(page));
  limit = Math.max(1, parseInt(limit));

  const now = new Date();
  const textFilter = query ? { $regex: query, $options: 'i' } : null;

  const catId = await resolveCategoryFilter(category);
  let categoryBoutiqueIds = null;
  if (catId) {
    const boutiques = await Boutique.find({ categorieId: catId }).select('_id');
    categoryBoutiqueIds = boutiques.map(b => b._id);
  }

  const boutiqueFilter = { status: 'ACTIVE' };
  if (textFilter) boutiqueFilter.name = textFilter;
  if (categoryBoutiqueIds) boutiqueFilter._id = { $in: categoryBoutiqueIds };

  const promotionFilter = { status: 'VALIDER', dateFin: { $gte: now } };
  if (textFilter) promotionFilter.titre = textFilter;
  if (categoryBoutiqueIds) promotionFilter.boutiqueId = { $in: categoryBoutiqueIds };

  const [boutiques, promotions, totalBoutiques, totalPromotions] = await Promise.all([
    Boutique.find(boutiqueFilter).populate('categorieId', 'nom').limit(limit),
    Promotion.find(promotionFilter).populate('boutiqueId', 'name').limit(limit),
    Boutique.countDocuments(boutiqueFilter),
    Promotion.countDocuments(promotionFilter),
  ]);

  const boutiquesFormatted = boutiques.map(b => ({ ...formatBoutique(b), type: 'BOUTIQUE' }));
  const promotionsFormatted = promotions.map(p => ({ ...formatPromotion(p), type: 'PROMOTION' }));

  const skip = (page - 1) * limit;
  const data = [...boutiquesFormatted, ...promotionsFormatted].slice(skip, skip + limit);
  const totalItems = totalBoutiques + totalPromotions;

  return {
    data,
    pagination: { page, limit, totalItems, hasMore: skip + data.length < totalItems },
  };
};

// ─────────────────────────────────────────
// PLAN DU CENTRE
// ─────────────────────────────────────────

// const getPlanCentre = async () => {
//   const centre = await CentreCommercial.findById(process.env.CM_ID).select('planImageUrl');
//   return { planImageUrl: centre?.planImageUrl || null };
// };

module.exports = {
  getBoutiques,
  getBoutiqueById,
  getPromotions,
  getPromotionById,
  searchGlobal,
  // getPlanCentre,
};
