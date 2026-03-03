const BoutiqueService = require("./Boutique.service");
const { deleteFromCloudinary } = require("../../middlewares/upload.middleware");

// ─────────────────────────────────────────
// HELPER PRIVÉ
// ─────────────────────────────────────────

const deleteImages = async (imagePublicIds) => {
  if (imagePublicIds?.length > 0) {
    await Promise.all(
      imagePublicIds.map(pid => deleteFromCloudinary(pid, "image"))
    );
  }
};

// ─────────────────────────────────────────
// ROUTES PUBLIQUES
// ─────────────────────────────────────────

exports.getPublicBoutiques = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, query, category, estFavoris } = req.query;
    const userId = req.user?.id || null;
    const result = await BoutiqueService.getPublicBoutiques({
      page: +page,
      limit: +limit,
      query,
      category,
      // estFavoris,
      // userId,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getPublicBoutiqueById = async (req, res, next) => {
  try {
    const boutique = await BoutiqueService.getPublicBoutiqueById(req.params.id);
    res.status(200).json(boutique);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// ROUTES OWNER (/me)
// ─────────────────────────────────────────

// exports.getMyBoutique = async (req, res, next) => {
//   try {
//     const boutique = await BoutiqueService.getBoutiqueDetailForOwner(req.boutique._id);
//     res.status(200).json(boutique);
//   } catch (error) {
//     next(error);
//   }
// };

// exports.updateMyBoutique = async (req, res, next) => {
//   try {
//     const uploadedImage = req.uploadedFiles?.[0] || null;
//     const payload = { ...req.body };

//     if (uploadedImage) {
//       await deleteImages(req.boutique.imagePublicIds);
//       payload.images = [{ type: "logo", url: uploadedImage.url }];
//       payload.imagePublicIds = [uploadedImage.publicId];
//     }

//     const boutique = await BoutiqueService.updateBoutique(req.boutique._id, payload);
//     res.status(200).json(boutique);
//   } catch (error) {
//     next(error);
//   }
// };

// ─────────────────────────────────────────
// ROUTES ADMIN
// ─────────────────────────────────────────

exports.getAdminBoutiques = async (req, res, next) => {
  try {
    const boutiques = await BoutiqueService.getBoutiquesByStatus(req.query.status);
    res.status(200).json(boutiques);
  } catch (error) {
    next(error);
  }
};

// validateBoutique approuve la demande (crée boutique + met à jour box + rôle user)
exports.validateBoutique = async (req, res, next) => {
  try {
    const DemandeService = require("./demande_boutiques/DemandeBoutique.service");
    const boutique = await DemandeService.approveDemande(req.params.id);
    res.status(200).json(boutique);
  } catch (error) {
    next(error);
  }
};

// activateBoutique réactive une boutique déjà existante (INACTIVE → ACTIVE)
exports.activateBoutique = async (req, res, next) => {
  try {
    const boutique = await BoutiqueService.setBoutiqueStatus(req.params.id, "ACTIVE");
    res.status(200).json(boutique);
  } catch (error) {
    next(error);
  }
};

exports.createBoutique = async (req, res, next) => {
  try {
    const uploadedImage = req.uploadedFiles?.[0] || null;

    const payload = {
      ...req.body,
      ...(uploadedImage && {
        images: [{ type: "logo", url: uploadedImage.url }],
        imagePublicIds: [uploadedImage.publicId],
      }),
    };

    const boutique = await BoutiqueService.createBoutique(payload);
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
    const uploadedImage = req.uploadedFiles?.[0] || null;
    const payload = { ...req.body };

    if (uploadedImage) {
      const existing = await BoutiqueService.getBoutiqueById(req.params.id);
      await deleteImages(existing?.imagePublicIds);
      payload.images = [{ type: "logo", url: uploadedImage.url }];
      payload.imagePublicIds = [uploadedImage.publicId];
    }

    const boutique = await BoutiqueService.updateBoutique(req.params.id, payload);
    res.status(200).json({ message: "Boutique updated", boutique });
  } catch (error) {
    next(error);
  }
};

exports.deactivateBoutique = async (req, res, next) => {
  try {
    const existing = await BoutiqueService.getBoutiqueById(req.params.id);
    await deleteImages(existing?.imagePublicIds);
    await BoutiqueService.deactivateBoutique(req.params.id);
    res.status(200).json({ message: "Boutique deleted successfully" });
  } catch (error) {
    next(error);
  }
};