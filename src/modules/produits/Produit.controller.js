const ProduitService = require("./Produit.service");

exports.createProduit = async (req, res, next) => {
  try {
    const uploadedImages = req.uploadedFiles || [];

    const payload = {
      ...req.body,
      ...(uploadedImages.length > 0 && {
        images: uploadedImages.map((f) => f.url),
        imagePublicIds: uploadedImages.map((f) => f.publicId),
      }),
    };
    const produit = await ProduitService.createProduit(payload);
    res.status(201).json({ success: true, message: "Produit créé", data: produit });
  } catch (error) {
    next(error);
  }
};

exports.getAllProduits = async (req, res, next) => {
  try {
    // Permet de passer des requêtes comme ?boutiqueId=123 ou ?isAvailable=true
    const produits = await ProduitService.getAllProduits(req.query);
    res.status(200).json({ success: true, data: produits });
  } catch (error) {
    next(error);
  }
};

exports.getProduitById = async (req, res, next) => {
  try {
    const produit = await ProduitService.getProduitById(req.params.id);
    res.status(200).json({ success: true, data: produit });
  } catch (error) {
    next(error);
  }
};

exports.updateProduit = async (req, res, next) => {
  try {
    const uploadedImages = req.uploadedFiles || [];
    const payload = { ...req.body };
    if (uploadedImages.length > 0) {
      // Supprimer les anciennes images Cloudinary
      const existing = await ProduitService.getProduitById(req.params.id);
      if (existing?.imagePublicIds?.length > 0) {
        await Promise.all(
          existing.imagePublicIds.map((pid) => deleteFromCloudinary(pid, "image"))
        );
      }

      payload.images = uploadedImages.map((f) => f.url);
      payload.imagePublicIds = uploadedImages.map((f) => f.publicId);
    }
    const produit = await ProduitService.updateProduit(req.params.id, payload);
    res.status(200).json({ success: true, message: "Produit mis à jour", data: produit });
  } catch (error) {
    next(error);
  }
};


exports.deleteProduit = async (req, res, next) => {
  try {
    const existing = await ProduitService.getProduitById(req.params.id);
    if (existing?.imagePublicIds?.length > 0) {
      await Promise.all(
        existing.imagePublicIds.map((pid) => deleteFromCloudinary(pid, "image"))
      );
    }

    await ProduitService.deleteProduit(req.params.id);
    res.status(200).json({ success: true, message: "Produit supprimé avec succès" });
  } catch (error) {
    next(error);
  }
};
