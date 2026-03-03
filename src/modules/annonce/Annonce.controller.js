const AnnonceService = require("./Annonce.service");

// POST /annonces  (Admin)
exports.createAnnonce = async (req, res, next) => {
  try {
    const annonce = await AnnonceService.createAnnonce({
      ...req.body,
      createdBy: req.user.id,
    });
    res.status(201).json(annonce);
  } catch (error) {
    next(error);
  }
};

// GET /annonces  (public)
exports.getAllAnnonces = async (req, res, next) => {
  try {
    const annonces = await AnnonceService.getAllAnnonces();
    res.status(200).json(annonces);
  } catch (error) {
    next(error);
  }
};

// GET /annonces/:id  (public)
exports.getAnnonceById = async (req, res, next) => {
  try {
    const annonce = await AnnonceService.getAnnonceById(req.params.id);
    res.status(200).json(annonce);
  } catch (error) {
    next(error);
  }
};

// PUT /annonces/:id  (Admin)
exports.updateAnnonce = async (req, res, next) => {
  try {
    const annonce = await AnnonceService.updateAnnonce(req.params.id, req.body);
    res.status(200).json(annonce);
  } catch (error) {
    next(error);
  }
};

// DELETE /annonces/:id  (Admin)
exports.deleteAnnonce = async (req, res, next) => {
  try {
    await AnnonceService.deleteAnnonce(req.params.id);
    res.status(200).json({ message: "Annonce supprimée" });
  } catch (error) {
    next(error);
  }
};
