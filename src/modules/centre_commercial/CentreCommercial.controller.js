const CmService = require("./CentreCommercial.service");

exports.createCentreController = async (req, res, next) => {
  try {
    const centre = await CmService.createCentreCommercial(req.body);

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
    const updatedCentre = await CmService.updateCentreCommercial(req.params.id, req.body);
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
    // Si le status est présent, on force la majuscule avant l'envoi au service
    if (req.body.status) {
      req.body.status = req.body.status.toUpperCase();
    }

    const patchedCentre = await CmService.updateCentreCommercial(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Champs modifiés avec succès",
      data: patchedCentre
    });
  } catch (error) {
    next(error);
  }
};

