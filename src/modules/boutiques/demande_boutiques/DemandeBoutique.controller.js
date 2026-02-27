const AppError = require("../../../utils/AppError");
const DemandeService = require("./DemandeBoutique.service");
const UserService = require("../../users/User.service");

exports.create = async (req, res, next) => {
  try {
    const { email, userId } = req.body;
    if (!email && !userId) {
      throw new AppError("Email or userId must be provided", 400);
    }
    let owner;
    if (email) {
      owner = await UserService.getUserByEmail(email);
    } else {
      owner = await UserService.getUserById(userId);
    }

    if (!owner) {
      throw new AppError("creating demande but Owner not found", 404);
    }
    const payload = {
      ...req.body,
      ownerId: owner._id
    };
    const demande = await DemandeService.createDemandeBoutique(payload);
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
      req.params.id
    );
    res.status(200).json({ demande });
  } catch (err) {
    next(err);
  }
};

exports.reject = async (req, res, next) => {
  try {
    if (!req.body.reason) {
      throw new AppError("rejection reason missing", 400)
    }
    const demande = await DemandeService.rejectDemande(
      req.params.id,
      req.body.reason
    );
    res.status(200).json({ demande });
  } catch (err) {
    next(err);
  }
};