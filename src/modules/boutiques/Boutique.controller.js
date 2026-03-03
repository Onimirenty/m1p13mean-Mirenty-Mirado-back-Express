const BoutiqueService = require("./Boutique.service");
const { deleteFromCloudinary } = require("../../middlewares/upload.middleware");

exports.createBoutique = async (req, res, next) => {
  try {
    // req.uploadedFiles est injecté par uploadBoutiqueImage
    const uploadedImage = req.uploadedFiles?.[0] || null;

    const payload = {
      ...req.body,
      ...(uploadedImage && {
        images: [{ type: "logo", url: uploadedImage.url }],
        imagePublicId: uploadedImage.publicId, // pour pouvoir la supprimer plus tard
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
      // Récupérer l'ancienne image pour la supprimer de Cloudinary
      const existing = await BoutiqueService.getBoutiqueById(req.params.id);
      if (existing?.imagePublicId) {
        await deleteFromCloudinary(existing.imagePublicId, "image");
      }

      payload.images = [{ type: "logo", url: uploadedImage.url }];
      payload.imagePublicId = uploadedImage.publicId;
    }

    const boutique = await BoutiqueService.updateBoutique(req.params.id, payload);
    res.status(200).json({ message: "Boutique updated", boutique });
  } catch (error) {
    next(error);
  }
};


exports.deactivateBoutique = async (req, res, next) => {
  try {
    // Supprimer l'image Cloudinary associée avant la suppression
    const existing = await BoutiqueService.getBoutiqueById(req.params.id);
    if (existing?.imagePublicId) {
      await deleteFromCloudinary(existing.imagePublicId, "image");
    }

    await BoutiqueService.deactivateBoutique(req.params.id);
    res.status(200).json({ message: "Boutique deleted successfully" });
  } catch (error) {
    next(error);
  }
};