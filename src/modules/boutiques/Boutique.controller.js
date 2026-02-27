const BoutiqueService = require("./Boutique.service");

exports.createBoutique = async (req, res, next) => {
  try {
    const boutique = await BoutiqueService.createBoutique(req.body);
    res.status(201).json({ message: "Boutique created", boutique });
  } catch (error) {
    next(error);
  }
};

exports.getAllBoutiques = async (req, res, next) => {
  try {
    const boutiques = await BoutiqueService.getAllBoutiques(req.query);
    res.status(200).json({ message: "Boutiques fetched", boutiques });
  } catch (error) {
    next(error);
  }
};

exports.getBoutiqueById = async (req, res, next) => {
  try {
    const boutique = await BoutiqueService.getBoutiqueById(req.params.id);
    res.status(200).json({ boutique });
  } catch (error) {
    next(error);
  }
};

exports.getBoutiqueAndBoxesById = async (req, res, next) => {
  try {
    const boutique = await BoutiqueService.getBoutiqueWithBoxesById(req.params.id);
    res.status(200).json({ boutique });
  } catch (error) {
    next(error);
  }
};

exports.updateBoutique = async (req, res, next) => {
  try {
    const boutique = await BoutiqueService.updateBoutique(req.params.id, req.body);
    res.status(200).json({ message: "Boutique updated", boutique });
  } catch (error) {
    next(error);
  }
};

exports.deleteBoutique = async (req, res, next) => {
  try {
    await BoutiqueService.deleteBoutique(req.params.id);
    res.status(200).json({ message: "Boutique deleted successfully" });
  } catch (error) {
    next(error);
  }
};