const PromotionService = require("./Promotion.service");
const Promotion = require("./Promotion.model");
const { deleteFromCloudinary } = require("../../middlewares/upload.middleware");

// CRÉATION : Validation automatique par le propriétaire
exports.createPromotion = async (req, res, next) => {
  try {
    const uploadedImage = req.uploadedFiles?.[0] || null;
    const payload = {
      ...req.body,
      ...(uploadedImage && {
        image: uploadedImage.url,
        imagePublicId: uploadedImage.publicId,
      }),
    };

    // Note : boutiqueId doit être envoyé dans le body par le frontend
    const promotion = await PromotionService.createPromotion(payload.boutiqueId, payload);

    res.status(201).json({
      success: true,
      message: "Promotion créée et validée automatiquement",
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// AFFICHAGE VITRINE : Trié par urgence et nouveauté
exports.getVitrine = async (req, res, next) => {
  try {
    const promotions = await PromotionService.getPromotionsDisplay();
    res.status(200).json({ success: true, count: promotions.length, data: promotions });
  } catch (error) {
    next(error);
  }
};

// RÉCUPÉRATION PAR ID
exports.getPromotionById = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id).populate("boutiqueId");
    if (!promotion) return res.status(404).json({ message: "Promotion introuvable" });

    res.status(200).json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

// UPDATE (PUT) : Mise à jour complète par le propriétaire
exports.updatePromotion = async (req, res, next) => {
  try {
    const uploadedImage = req.uploadedFiles?.[0] || null;
    const payload = { ...req.body };
    if (uploadedImage) {
      const existing = await Promotion.findById(req.params.id);
      if (existing?.imagePublicId) {
        await deleteFromCloudinary(existing.imagePublicId, "image");
      }
      payload.image = uploadedImage.url;
      payload.imagePublicId = uploadedImage.publicId;
    }
    const promotion = await PromotionService.updatePromotion(req.params.id, req.body);
    res.status(200).json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

// PATCH : Pour le retrait administratif ou mise à jour partielle
exports.patchPromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

// SUPPRESSION
exports.deletePromotion = async (req, res, next) => {
  try {
    const existing = await Promotion.findById(req.params.id);
    if (existing?.imagePublicId) {
      await deleteFromCloudinary(existing.imagePublicId, "image");
    }
    await Promotion.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Promotion supprimée" });
  } catch (error) {
    next(error);
  }
};
