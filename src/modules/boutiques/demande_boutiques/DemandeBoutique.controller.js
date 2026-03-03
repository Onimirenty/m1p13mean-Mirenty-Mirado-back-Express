const AppError = require("../../../utils/AppError");
const DemandeService = require("./DemandeBoutique.service");
const UserService = require("../../users/User.service");
const { normalizeBody, mapClientFormatToDemandeBoutique, mapDemandeBoutiqueToClientFormat } = require("./DemandeBoutique.service");

// ─────────────────────────────────────────
// CREATE — Créer une demande d'ouverture de boutique
// ─────────────────────────────────────────
// L'identité du demandeur est TOUJOURS tirée du token (req.user.id),
// jamais du body. Cela empêche l'usurpation d'identité.

exports.create = async (req, res, next) => {
  try {
    const owner = await UserService.getUserById(req.user.id);
    if (!owner) throw new AppError("Utilisateur introuvable", 404);
    
    console.log("[create] uploadedLogo :", req.uploadedLogo);
    console.log("[create] uploadedFiles :", req.uploadedFiles);
    // Normaliser les clés plates Bruno ("horaires.jours" → {horaires:{jours:...}})
    const rawBody = normalizeBody(req.body);

    const isClientFormat = !!(
      rawBody.nom ||
      rawBody.zoneId ||
      rawBody.contactBoutique !== undefined ||
      rawBody.contactProprio !== undefined
    );

    let normalizedBody;
    let userFields = {};

    if (isClientFormat) {
      const mapped = mapClientFormatToDemandeBoutique(rawBody);
      const { _userFields, ...demandePayload } = mapped;
      normalizedBody = demandePayload;
      userFields = _userFields;
    } else {
      normalizedBody = rawBody;
    }

    // Mettre à jour phone_number si fourni
    if (userFields.phone_number) {
      await UserService.updateUser(owner._id.toString(), {
        phone_number: userFields.phone_number,
      });
      owner.phone_number = userFields.phone_number;
    }

    const uploadedDocs = req.uploadedFiles || [];
    const [rcsFile, nifFile, statFile] = uploadedDocs;

    // Logo uploadé via uploadRegisterBoutique
    const uploadedLogo = req.uploadedLogo || null;

    const payload = {
      ...normalizedBody,
      ownerId: owner._id,
      // Attacher le logo à la demande si présent
      ...(uploadedLogo && {
        logoUrl: uploadedLogo.url,
        logoPublicId: uploadedLogo.publicId,
      }),
    };

    delete payload.email;
    delete payload.status;
    delete payload.commentaireAdmin;

    const hasDocuments =
      req.body.rcsNumber || req.body.nifNumber || req.body.statNumber ||
      rcsFile?.url || nifFile?.url || statFile?.url ||
      req.body.rcsFileUrl || req.body.nifFileUrl || req.body.statFileUrl;

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

    // Réponse au format exigé par le client
    res.status(201).json({
      message: "Boutique enregistrée avec succès",
      status: "EN_ATTENTE",
    });

  } catch (err) {
    next(err);
  }
};



// ─────────────────────────────────────────
//  Admin seulement
// ─────────────────────────────────────────

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
    const demande = await DemandeService.approveDemande(req.params.id);
    res.status(200).json({ demande });
  } catch (err) {
    next(err);
  }
};

exports.reject = async (req, res, next) => {
  try {
    if (!req.body.reason || typeof req.body.reason !== "string" || !req.body.reason.trim()) {
      throw new AppError("Le motif de refus est requis", 400);
    }

    const demande = await DemandeService.rejectDemande(
      req.params.id,
      req.body.reason.trim()
    );
    res.status(200).json({ demande });
  } catch (err) {
    next(err);
  }
};