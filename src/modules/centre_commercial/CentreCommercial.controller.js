const CmService = require("./CentreCommercial.service");
const { deleteFromCloudinary } = require("../../middlewares/upload.middleware");

exports.createCentreController = async (req, res, next) => {
  try {
    const uploadedImage = req.uploadedFiles?.[0] || null;

    const payload = {
      ...req.body,
      // Si une image a été uploadée, on sauvegarde son URL et son publicId
      ...(uploadedImage && {
        image: uploadedImage.url,
        imagePublicId: uploadedImage.publicId,
      }),
    };

    const centre = await CmService.createCentreCommercial(payload);

    res.status(201).json({
      success: true,
      data: centre
    });
  } catch (error) {
    next(error);
  }
};

exports.getCentreController = async (req, res, next) => {
  try {
    const centre = await CmService.getCentreCommercialById(req.params.id);

    res.status(200).json({
      success: true,
      data: centre
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCentre = async (req, res, next) => {
  try {
    const uploadedImage = req.uploadedFiles?.[0] || null;
    const payload = { ...req.body };

    if (uploadedImage) {
      // Récupérer l'ancien imagePublicId pour supprimer l'ancienne image de Cloudinary
      const existing = await CmService.getCentreCommercialById(req.params.id);
      if (existing?.imagePublicId) {
        await deleteFromCloudinary(existing.imagePublicId, "image");
      }

      payload.image = uploadedImage.url;
      payload.imagePublicId = uploadedImage.publicId;
    }

    const updatedCentre = await CmService.updateCentreCommercial(req.params.id, payload);

    res.status(200).json({
      success: true,
      message: "Centre commercial mis à jour avec succès",
      data: updatedCentre
    });
  } catch (error) {
    next(error);
  }
};

// PATCH : Modifie uniquement les champs envoyés (ex: juste le status ou la config)
exports.patchCentre = async (req, res, next) => {
  try {
    const uploadedImage = req.uploadedFiles?.[0] || null;
    const payload = { ...req.body };

    if (req.body.status) {
      payload.status = req.body.status.toUpperCase();
    }

    if (uploadedImage) {
      const existing = await CmService.getCentreCommercialById(req.params.id);
      if (existing?.imagePublicId) {
        await deleteFromCloudinary(existing.imagePublicId, "image");
      }

      payload.image = uploadedImage.url;
      payload.imagePublicId = uploadedImage.publicId;
    }

    const patchedCentre = await CmService.updateCentreCommercial(req.params.id, payload);

    res.status(200).json({
      success: true,
      message: "Champs modifiés avec succès",
      data: patchedCentre
    });
  } catch (error) {
    next(error);
  }
};
