const mongoose = require('mongoose');

const Boutique = require('../boutiques/Boutique.model');
const Box = require('../spatial/Box.model');
const Promotion = require('../promotions/Promotion.model');
const ProduitService = require('../produits/Produit.service');
const BoutiqueService = require('../boutiques/Boutique.service');
const AppError = require('../../utils/AppError');
const { deleteFromCloudinary } = require('../../middlewares/upload.middleware');

// ─────────────────────────────────────────
// HELPER PRIVÉ
// ─────────────────────────────────────────

const getBoutiqueOfOwner = async (ownerId) => {
  const boutique = await Boutique.findOne({ ownerId, status: 'ACTIVE' })
    .populate('categorieId', 'nom iconClass');
  if (!boutique) throw new AppError("soit la Boutique est introuvable pour cet utilisateur,soit le la boutique de l'utilisateur a ete suspendue ", 404);
  return boutique;
};


// ─────────────────────────────────────────
// PROFIL BOUTIQUE
// ─────────────────────────────────────────

const getMonProfil = async (ownerId) => {
  const boutique = await getBoutiqueOfOwner(ownerId);
  const box = await Box.findOne({ boutiqueId: boutique._id });

  return {
    _id: boutique._id,
    nom: boutique.name,
    description: boutique.description,
    logoUrl: boutique.images?.[0]?.url || null,
    categorie: boutique.categorieId,
    zone: box
      ? { etage: box.etage, bloc: box.bloc, box: box.numero, description: box.description || null }
      : null,
    horaires: boutique.opening || null,
    contacts: boutique.contact || null,
    vues: boutique.statsSnapshot?.totalViews || 0,
    createdAt: boutique.createdAt,
  };
};

const updateMonProfil = async (ownerId, data) => {
  const boutique = await getBoutiqueOfOwner(ownerId);

  const updateData = {};
  if (data.nom) updateData.name = data.nom;
  if (data.description) updateData.description = data.description;
  if (data.horaires) updateData.opening = data.horaires;
  if (data.telephoneBoutique || data.email) {
    updateData.contact = {
      phone: data.telephoneBoutique || boutique.contact?.phone,
      email: data.email || boutique.contact?.email,
    };
  }

  if (data.logoUrl) {
    const ancienPublicId = boutique.imagePublicIds?.[0] || null;
    if (ancienPublicId) {
      await deleteFromCloudinary(ancienPublicId, 'image');
    }
    updateData.images = [{ type: 'logo', url: data.logoUrl }];
    if (data.logoPublicId) {
      updateData.imagePublicIds = [data.logoPublicId];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('Aucun champ valide fourni pour la mise à jour', 400);
  }

  const updated = await BoutiqueService.updateBoutique(boutique._id.toString(), updateData);
  const box = await Box.findOne({ boutiqueId: boutique._id });

  return {
    _id: updated._id,
    nom: updated.name,
    description: updated.description,
    logoUrl: updated.images?.[0]?.url || null,
    categorie: updated.categorieId,
    zone: box
      ? { etage: box.etage, bloc: box.bloc, description: box.description || null }
      : null,
    horaires: updated.opening || null,
    contacts: updated.contact || null,
    vues: updated.statsSnapshot?.totalViews || 0,
    createdAt: updated.createdAt,
  };
};

// ─────────────────────────────────────────
// PRODUITS
// ─────────────────────────────────────────


const getMesBoutiqueId = async (ownerId) => {
  const boutique = await getBoutiqueOfOwner(ownerId); // appel manquant
  return boutique._id;
};
const getMesProduits = async (ownerId) => {
  const boutiqueId = await getMesBoutiqueId(ownerId);
  const produits = await ProduitService.getAllProduits({ boutiqueId });

  return produits.map(p => ({
    _id: p._id,
    nom: p.nom,
    prix: p.prix,
    imageUrl: p.images?.[0] || null,
    description: p.description,
  }));
};

// ─────────────────────────────────────────
// PROMOTIONS
// ─────────────────────────────────────────

const getMesPromotions = async (ownerId) => {
  const boutiqueId = await getMesBoutiqueId(ownerId);
  const promotions = await Promotion.find({ boutiqueId }).sort({ createdAt: -1 });

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

// ─────────────────────────────────────────
// STATISTIQUES
// ─────────────────────────────────────────

const getMesStats = async (ownerId) => {
  const boutique = await getBoutiqueOfOwner(ownerId);

  const stats = await Promotion.aggregate([
    { $match: { boutiqueId: new mongoose.Types.ObjectId(boutique._id.toString()) } },
    { $group: { _id: null, promoClics: { $sum: '$stats.cliques' } } },
  ]);

  return {
    vues: boutique.statsSnapshot?.totalViews || 0,
    promoClics: stats[0]?.promoClics || 0,
  };
};

module.exports = {
  getBoutiqueOfOwner,
  getMonProfil,
  updateMonProfil,
  getMesBoutiqueId,
  getMesProduits,
  getMesPromotions,
  getMesStats,

};
