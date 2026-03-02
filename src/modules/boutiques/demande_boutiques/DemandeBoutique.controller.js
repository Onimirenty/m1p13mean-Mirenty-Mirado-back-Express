const AppError = require("../../../utils/AppError");
const DemandeService = require("./DemandeBoutique.service");
const UserService = require("../../users/User.service");

exports.create = async (req, res, next) => {
  try {
    const { email, ownerId } = req.body;
    const userId = ownerId;
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

    const uploadedDocs = req.uploadedFiles || [];
    const [rcsFile, nifFile, statFile] = uploadedDocs;
    const payload = {
      ...req.body,
      ownerId: owner._id
    };
    // Vérifie si au moins un champ document est fourni
    const hasDocuments =
      req.body.rcsNumber ||
      req.body.nifNumber ||
      req.body.statNumber ||
      rcsFile?.url ||
      nifFile?.url ||
      statFile?.url ||
      req.body.rcsFileUrl ||
      req.body.nifFileUrl ||
      req.body.statFileUrl;

    if (hasDocuments) {
      payload.documents = {
        rcsNumber: req.body.rcsNumber || undefined,
        nifNumber: req.body.nifNumber || undefined,
        statNumber: req.body.statNumber || undefined,

        rcsFileUrl: rcsFile?.url || req.body.rcsFileUrl || undefined,
        nifFileUrl: nifFile?.url || req.body.nifFileUrl || undefined,
        statFileUrl: statFile?.url || req.body.statFileUrl || undefined,
      };
    }
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