const mongoose = require('mongoose');

const BoutiqueService = require('../boutiques/Boutique.service');
const DemandeService = require('../boutiques/demande_boutiques/DemandeBoutique.service');
const CmService = require('../centre_commercial/CentreCommercial.service');
const CategorieService = require('../categories/Category.service');
const BoxService = require('../spatial/Box.service');
const Promotion = require('../promotions/Promotion.model');
const Annonce = require('../annonce/Annonce.model');
const AppError = require('../../utils/AppError');

// ─────────────────────────────────────────
// CENTRE COMMERCIAL
// ─────────────────────────────────────────

exports.getCentre = async (req, res, next) => {
  try {
    const centre = await CmService.getCentreCommercialById(process.env.CM_ID);
    res.status(200).json({
      nom: centre.name,
      description: centre.description,
      horaires: centre.horaires || null,
      contact: centre.contact?.phone || null,
      email: centre.contact?.email || null,
      planImageUrl: centre.planImageUrl || null,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCentre = async (req, res, next) => {
  try {
    const uploadedImage = req.uploadedFiles?.[0] || null;

    const updateData = { ...req.body };
    if (uploadedImage) {
      updateData.planImageUrl = uploadedImage.url;
      updateData.planImagePublicId = uploadedImage.publicId;
    }

    const centre = await CmService.updateCentreCommercial(process.env.CM_ID, updateData);

    res.status(200).json({
      nom: centre.name,
      description: centre.description,
      horaires: centre.horaires || null,
      contact: centre.contact?.phone || null,
      email: centre.contact?.email || null,
      planImageUrl: centre.planImageUrl || null,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// BOUTIQUES
// ─────────────────────────────────────────

exports.getAllBoutiquesAdmin = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    const Boutique = require('../boutiques/Boutique.model');
    const boutiques = await Boutique.find(filter)
      .populate('categorieId', 'nom iconClass')
      .populate('ownerId', 'email')
      .sort({ createdAt: -1 });

    res.status(200).json(boutiques.map(b => ({
      _id: b._id,
      email: b.ownerId?.email || null,
      nom: b.name,
      logoUrl: b.images?.[0]?.url || null,
      categorie: b.categorieId,
      horaires: b.opening || null,
      contact: b.contact?.phone || null,
      status: b.status,
    })));
  } catch (error) {
    next(error);
  }
};

exports.validateBoutique = async (req, res, next) => {
  try {
    // Valide la demande de boutique (approve crée la boutique + change les box + role user)
    const boutique = await DemandeService.approveDemande(req.params.id);
    res.status(200).json({
      _id: boutique._id,
      nom: boutique.name,
      status: boutique.status,
    });
  } catch (error) {
    next(error);
  }
};

exports.activateBoutique = async (req, res, next) => {
  try {
    const boutique = await BoutiqueService.updateBoutique(req.params.id, { status: 'ACTIVE' });
    res.status(200).json({
      _id: boutique._id,
      nom: boutique.name,
      status: boutique.status,
    });
  } catch (error) {
    next(error);
  }
};

exports.disableBoutique = async (req, res, next) => {
  try {
    const boutique = await BoutiqueService.updateBoutique(req.params.id, { status: 'INACTIVE' });
    res.status(200).json({
      _id: boutique._id,
      nom: boutique.name,
      status: boutique.status,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// CATÉGORIES
// ─────────────────────────────────────────

exports.createCategorie = async (req, res, next) => {
  try {
    const { nom, iconClass } = req.body;
    const categorie = await CategorieService.createCategorie(nom, iconClass);
    res.status(201).json(categorie);
  } catch (error) {
    next(error);
  }
};

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await CategorieService.getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// ZONES / BOXES
// ─────────────────────────────────────────

exports.createZone = async (req, res, next) => {
  try {
    const box = await BoxService.createBox({
      ...req.body,
      centreCommercialId: req.body.centreCommercialId || process.env.CM_ID,
    });
    res.status(201).json(box);
  } catch (error) {
    next(error);
  }
};

exports.getAllZones = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }
    const boxes = await BoxService.getAllBoxes(filter);
    res.status(200).json(boxes);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// PROMOTIONS
// ─────────────────────────────────────────

exports.getAllPromotionsAdmin = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    const promotions = await Promotion.find(filter)
      .populate('boutiqueId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(promotions.map(p => ({
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
    })));
  } catch (error) {
    next(error);
  }
};

exports.patchPromotion = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new AppError('ID promotion invalide', 400);
    }

    const allowedFields = ['status', 'prioriteAffichage'];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new AppError('Aucun champ valide fourni', 400);
    }

    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!promotion) throw new AppError('Promotion introuvable', 404);

    res.status(200).json({
      _id: promotion._id,
      titre: promotion.titre,
      description: promotion.description,
      status: promotion.status,
      updatedAt: promotion.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// ANNONCES
// ─────────────────────────────────────────

exports.createAnnonce = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      throw new AppError('title et content sont requis', 400);
    }
    const annonce = await Annonce.create({
      title,
      content,
      createdBy: req.user.id,
    });
    res.status(201).json({
      _id: annonce._id,
      title: annonce.title,
      content: annonce.content,
      createdAt: annonce.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllAnnonces = async (req, res, next) => {
  try {
    const annonces = await Annonce.find()
      .populate('createdBy', 'email name')
      .sort({ createdAt: -1 });

    res.status(200).json(annonces.map(a => ({
      _id: a._id,
      title: a.title,
      content: a.content,
      createdAt: a.createdAt,
    })));
  } catch (error) {
    next(error);
  }
};
