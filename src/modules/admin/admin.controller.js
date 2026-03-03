const AdminService = require('./admin.service');

// ─────────────────────────────────────────
// CENTRE COMMERCIAL
// ─────────────────────────────────────────

exports.getCentre = async (req, res, next) => {
  try {
    const centre = await AdminService.getCentre();
    res.status(200).json(centre);
  } catch (error) {
    next(error);
  }
};

exports.updateCentre = async (req, res, next) => {
  try {
    const uploadedImage = req.uploadedFiles?.[0] || null;
    const centre = await AdminService.updateCentre(req.body, uploadedImage);
    res.status(200).json(centre);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// BOUTIQUES
// ─────────────────────────────────────────

exports.getAllBoutiquesAdmin = async (req, res, next) => {
  try {
    const boutiques = await AdminService.getAllBoutiques(req.query);
    res.status(200).json(boutiques);
  } catch (error) {
    next(error);
  }
};

exports.validateBoutique = async (req, res, next) => {
  try {
    const boutique = await AdminService.validateBoutique(req.params.id);
    res.status(200).json(boutique);
  } catch (error) {
    next(error);
  }
};

exports.activateBoutique = async (req, res, next) => {
  try {
    const boutique = await AdminService.activateBoutique(req.params.id);
    res.status(200).json(boutique);
  } catch (error) {
    next(error);
  }
};

exports.disableBoutique = async (req, res, next) => {
  try {
    const boutique = await AdminService.disableBoutique(req.params.id);
    res.status(200).json(boutique);
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
    const categorie = await AdminService.createCategorie(nom, iconClass);
    res.status(201).json(categorie);
  } catch (error) {
    next(error);
  }
};

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await AdminService.getAllCategories();
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
    const box = await AdminService.createZone(req.body);
    res.status(201).json(box);
  } catch (error) {
    next(error);
  }
};

exports.getAllZones = async (req, res, next) => {
  try {
    const boxes = await AdminService.getAllZones(req.query);
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
    const promotions = await AdminService.getAllPromotions(req.query);
    res.status(200).json(promotions);
  } catch (error) {
    next(error);
  }
};

exports.patchPromotion = async (req, res, next) => {
  try {
    const promotion = await AdminService.patchPromotion(req.params.id, req.body);
    res.status(200).json(promotion);
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
    const annonce = await AdminService.createAnnonce(title, content, req.user.id);
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
    const annonces = await AdminService.getAllAnnonces();
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
