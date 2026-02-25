const DemandeService = require("./DemandeBoutique.service");

exports.create = async (req, res, next) => {
  try {
    const demande = await DemandeService.createDemandeBoutique(req.body);
    res.status(201).json({ demande });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const demandes = await DemandeService.getAllDemandes();
    res.status(200).json({ demandes });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const demande = await DemandeService.getDemandeById(req.params.id);
    res.status(200).json({ demande });
  } catch (err) {
    next(err);
  }
};

exports.approve = async (req, res, next) => {
  try {
    const demande = await DemandeService.approveDemande(
      req.params.id,
      req.body
    );
    res.status(200).json({ demande });
  } catch (err) {
    next(err);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const demande = await DemandeService.rejectDemande(
      req.params.id,
      req.body.reason
    );
    res.status(200).json({ demande });
  } catch (err) {
    next(err);
  }
};