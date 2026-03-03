/**
 * ============================================================
 *  UPLOAD MIDDLEWARE — Centre Commercial API
 * ============================================================
 *  Gère :
 *   - Upload image  → Cloudinary (boutiques, produits, promotions, centre commercial, box)
 *   - Upload document → Cloudinary raw (PDF légaux des demandes)
 *   - Validation content-type stricte par contexte
 *   - Limite de taille par type de fichier
 *   - Nommage structuré des fichiers dans Cloudinary
 * ============================================================
 */

const multer = require("multer");
const { cloudinary } = require("../config/Cloudinary");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

// ─────────────────────────────────────────
// 1. CONSTANTES & CONFIGURATION
// ─────────────────────────────────────────

/**
 * Profils de contenu autorisés par contexte d'upload.
 * Chaque profil définit : mimetypes acceptés, taille max, dossier Cloudinary.
 */
const UPLOAD_PROFILES = {
  // Image principale d'une boutique (logo / bannière)
  boutique_image: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 5 * 1024 * 1024, // 5 Mo
    cloudinaryFolder: "centre_commercial/boutiques",
    resourceType: "image",
    label: "image boutique",
  },

  // Images produits (galerie)
  produit_image: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 3 * 1024 * 1024, // 3 Mo
    cloudinaryFolder: "centre_commercial/produits",
    resourceType: "image",
    label: "image produit",
  },

  // Image promotionnelle (affichette)
  promotion_image: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxSizeBytes: 4 * 1024 * 1024, // 4 Mo
    cloudinaryFolder: "centre_commercial/promotions",
    resourceType: "image",
    label: "image promotion",
  },

  // Documents légaux des demandes de boutique (RCS, NIF, STAT)
  document_legal: {
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 10 * 1024 * 1024, // 10 Mo
    cloudinaryFolder: "centre_commercial/documents_legaux",
    resourceType: "raw",
    label: "document légal (PDF)",
  },
  // Image du centre commercial (logo / photo principale)
  centre_commercial_image: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 8 * 1024 * 1024, // 8 Mo
    cloudinaryFolder: "centre_commercial/centres",
    resourceType: "image",
    label: "image centre commercial",
  },

  // Image d'une box (photo de l'emplacement vide ou occupé)
  box_image: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 5 * 1024 * 1024, // 5 Mo
    cloudinaryFolder: "centre_commercial/boxes",
    resourceType: "image",
    label: "image box",
  },
};

// ─────────────────────────────────────────
// 2. STOCKAGE MÉMOIRE MULTER
// ─────────────────────────────────────────
// On utilise memoryStorage : les fichiers restent en buffer
// et sont envoyés à Cloudinary via stream (pas de disque intermédiaire).

const memoryStorage = multer.memoryStorage();

// ─────────────────────────────────────────
// 3. FACTORY : créer un middleware multer pour un profil donné
// ─────────────────────────────────────────

/**
 * Crée un middleware multer filtré sur les mimetypes d'un profil.
 * @param {string} profileName  - Clé dans UPLOAD_PROFILES
 * @param {string} fieldName    - Nom du champ form-data (ex: "image")
 * @param {number} maxCount     - Nombre max de fichiers (défaut 1)
 */
const buildMulterMiddleware = (profileName, fieldName, maxCount = 1) => {
  const profile = UPLOAD_PROFILES[profileName];

  if (!profile) {
    throw new Error(`Profil d'upload inconnu : ${profileName}`);
  }

  const fileFilter = (req, file, cb) => {
    if (profile.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Type de fichier non autorisé pour ${profile.label}. ` +
          `Types acceptés : ${profile.allowedMimeTypes.join(", ")}`,
          415
        ),
        false
      );
    }
  };

  return multer({
    storage: memoryStorage,
    limits: { fileSize: profile.maxSizeBytes },
    fileFilter,
  }).array(fieldName, maxCount);
};

// ─────────────────────────────────────────
// 4. UPLOAD VERS CLOUDINARY (stream)
// ─────────────────────────────────────────

/**
 * Envoie un buffer vers Cloudinary via un stream.
 * @param {Buffer} buffer
 * @param {Object} options  - Options Cloudinary (folder, resource_type, public_id…)
 * @returns {Promise<Object>} résultat Cloudinary (secure_url, public_id…)
 */
const streamToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Upload un seul fichier (req.files[i]) vers Cloudinary.
 * @param {Object} file         - Objet fichier Multer (buffer, originalname, mimetype)
 * @param {string} profileName  - Clé UPLOAD_PROFILES
 * @param {string} entityId     - ID de l'entité liée (boutiqueId, produitId…) pour le nommage
 * @returns {Promise<{url: string, publicId: string, format: string, bytes: number}>}
 */
const uploadFileToCloudinary = async (file, profileName, entityId = "unknown") => {
  const profile = UPLOAD_PROFILES[profileName];

  // Nom public structuré pour retrouver facilement dans Cloudinary
  const timestamp = Date.now();
  const cleanName = file.originalname
    .replace(/\.[^.]+$/, "")         // supprime l'extension
    .replace(/[^a-zA-Z0-9_-]/g, "_") // caractères sûrs
    .substring(0, 50);

  const publicId = `${profile.cloudinaryFolder}/${entityId}/${cleanName}_${timestamp}`;

  const options = {
    folder: profile.cloudinaryFolder,
    public_id: publicId,
    resource_type: profile.resourceType,
    // Transformations auto pour les images (optimisation)
    ...(profile.resourceType === "image" && {
      quality: "auto",
      fetch_format: "auto",
    }),
  };

  const result = await streamToCloudinary(file.buffer, options);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
  };
};

// ─────────────────────────────────────────
// 5. MIDDLEWARES EXPORTÉS PAR CONTEXTE
// ─────────────────────────────────────────

/**
 * Middleware générique : parse + valide + upload vers Cloudinary.
 * Attache les résultats dans req.uploadedFiles (tableau).
 *
 * @param {string} profileName - Clé UPLOAD_PROFILES
 * @param {string} fieldName   - Nom du champ form-data
 * @param {number} maxCount    - Nb max de fichiers
 * @param {boolean} required   - Si true, 400 si aucun fichier
 */
const createUploadMiddleware = (profileName, fieldName, maxCount = 1, required = false) => {
  const multerMw = buildMulterMiddleware(profileName, fieldName, maxCount);

  return async (req, res, next) => {
    // Étape 1 : parse multipart via multer
    multerMw(req, res, async (err) => {
      if (err) {
        // Erreur multer (taille, type…)
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            const profile = UPLOAD_PROFILES[profileName];
            const maxMo = (profile.maxSizeBytes / 1024 / 1024).toFixed(0);
            return next(new AppError(`Fichier trop volumineux. Maximum : ${maxMo} Mo`, 413));
          }
          return next(new AppError(`Erreur upload : ${err.message}`, 400));
        }
        return next(err); // AppError du fileFilter
      }

      // Étape 2 : vérifier présence si requis
      if (required && (!req.files || req.files.length === 0)) {
        return next(new AppError(`Fichier ${UPLOAD_PROFILES[profileName].label} requis`, 400));
      }

      // Pas de fichier mais non requis → on passe
      if (!req.files || req.files.length === 0) {
        req.uploadedFiles = [];
        return next();
      }

      // Étape 3 : upload vers Cloudinary
      try {
        // Récupère un identifiant depuis le body ou params pour le nommage
        const entityId =
          req.params.id || req.body.boutiqueId || req.body.produitId || "tmp";

        const uploads = await Promise.all(
          req.files.map((file) => uploadFileToCloudinary(file, profileName, entityId))
        );

        req.uploadedFiles = uploads;
        logger.info(
          `[Upload] ${uploads.length} fichier(s) uploadé(s) — profil: ${profileName}`
        );
        next();
      } catch (uploadError) {
        logger.error("[Upload] Cloudinary error:", uploadError.message);
        next(new AppError("Échec de l'upload vers le stockage cloud", 502));
      }
    });
  };
};

// ─────────────────────────────────────────
// 6. MIDDLEWARE CONTENT-TYPE GUARD
// ─────────────────────────────────────────

/**
 * Vérifie que la requête est bien multipart/form-data avant de continuer.
 * À placer avant tout middleware d'upload sur une route.
 */
const requireMultipart = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return next(
      new AppError(
        "Content-Type invalide. Utilisez multipart/form-data pour l'upload de fichiers.",
        415
      )
    );
  }
  next();
};

/**
 * Vérifie que la requête est bien application/json.
 * Utile pour protéger les routes JSON contre les envois multipart accidentels.
 */
const requireJson = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    return next(
      new AppError(
        "Content-Type invalide. Cette route attend application/json.",
        415
      )
    );
  }
  next();
};

// ─────────────────────────────────────────
// 7. HELPER : suppression Cloudinary
// ─────────────────────────────────────────

/**
 * Supprime un fichier de Cloudinary par son public_id.
 * À appeler lors de la mise à jour ou suppression d'une entité.
 *
 * @param {string} publicId
 * @param {string} resourceType - "image" | "raw"
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info(`[Upload] Fichier supprimé de Cloudinary : ${publicId}`);
  } catch (error) {
    logger.error(`[Upload] Échec suppression Cloudinary (${publicId}):`, error.message);
  }
};

// ─────────────────────────────────────────
// 8. MIDDLEWARES PRÊTS À L'EMPLOI
// ─────────────────────────────────────────

module.exports = {
  // ── Guards content-type ──────────────────
  requireMultipart,
  requireJson,

  // ── Uploads contextualisés ───────────────

  /** Upload 1 image pour une boutique (non obligatoire) */
  uploadBoutiqueImage: createUploadMiddleware("boutique_image", "image", 1, false),

  /** Upload jusqu'à 5 images pour un produit (non obligatoire) */
  uploadProduitImages: createUploadMiddleware("produit_image", "images", 5, false),

  /** Upload 1 image pour une promotion (non obligatoire) */
  uploadPromotionImage: createUploadMiddleware("promotion_image", "image", 1, false),

  /** Upload jusqu'à 3 documents PDF légaux pour une demande (non obligatoire) */


  // uploadDocumentsLegaux: createUploadMiddleware("document_legal", "documents", 3, false),

  uploadDocumentsLegaux: (() => {
    const profile = UPLOAD_PROFILES["document_legal"];

    const multerMw = multer({
      storage: memoryStorage,
      limits: { fileSize: profile.maxSizeBytes },
    }).any();

    return async (req, res, next) => {
      multerMw(req, res, async (err) => {
        if (err) {
          // ← Intercepter spécifiquement "Field name missing" et continuer
          if (err instanceof multer.MulterError && err.message === "Field name missing") {
            req.uploadedFiles = [];
            return next();
          }

          if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
              const maxMo = (profile.maxSizeBytes / 1024 / 1024).toFixed(0);
              return next(new AppError(`Fichier trop volumineux. Maximum : ${maxMo} Mo`, 413));
            }
            return next(new AppError(`Erreur upload : ${err.message}`, 400));
          }
          return next(err);
        }

        const allFiles = (req.files || []).filter(file =>
          profile.allowedMimeTypes.includes(file.mimetype)
        );

        if (allFiles.length === 0) {
          req.uploadedFiles = [];
          return next();
        }

        try {
          const entityId = req.params.id || req.body.boutiqueId || "tmp";
          const uploads = await Promise.all(
            allFiles.map((file) => uploadFileToCloudinary(file, "document_legal", entityId))
          );
          req.uploadedFiles = uploads;
          logger.info(`[Upload] ${uploads.length} document(s) uploadé(s) — profil: document_legal`);
          next();
        } catch (uploadError) {
          logger.error("[Upload] Cloudinary error:", uploadError.message);
          next(new AppError("Echec de l'upload vers le stockage cloud", 502));
        }
      });
    };
  })(),



  uploadRegisterBoutique: (() => {
    const profileDoc = UPLOAD_PROFILES["document_legal"];
    const profileImg = UPLOAD_PROFILES["boutique_image"];

    const multerMw = multer({
      storage: memoryStorage,
      limits: { fileSize: Math.max(profileDoc.maxSizeBytes, profileImg.maxSizeBytes) },
    }).any();

    return async (req, res, next) => {
      multerMw(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError && err.message === "Field name missing") {
            req.uploadedFiles = [];
            return next();
          }
          if (err instanceof multer.MulterError) {
            return next(new AppError(`Erreur upload : ${err.message}`, 400));
          }
          return next(err);
        }

        // Parser le champ "data" JSON
        if (req.body.data) {
          try {
            const parsed = JSON.parse(req.body.data);
            req.body = { ...req.body, ...parsed };
            delete req.body.data;
          } catch (e) {
            return next(new AppError("Le champ 'data' doit être un JSON valide", 400));
          }
        }
        const files = req.files || [];

        // ── LOG TEMPORAIRE ──────────────────────
       
        logger.info("[uploadRegisterBoutique] files reçus : " +
          JSON.stringify(files.map(f => ({
            fieldname: f.fieldname,
            mimetype: f.mimetype,
            size: f.size,
            originalname: f.originalname
          })))
        );
        logger.info("[uploadRegisterBoutique] body keys : " + JSON.stringify(Object.keys(req.body)));
        // ────────────────────────────────────────

        // Chercher le logo — fieldname "logo" OU "image"
        const logoFile = files.find(f =>
          ["logo", "image"].includes(f.fieldname) &&
          profileImg.allowedMimeTypes.includes(f.mimetype)
        );

        const docFiles = files.filter(f =>
          ["documents", "rcsFile", "nifFile", "statFile"].includes(f.fieldname) &&
          profileDoc.allowedMimeTypes.includes(f.mimetype)
        );

        try {
          const entityId = req.params.id || "tmp";

          if (logoFile) {
            logger.info(`[uploadRegisterBoutique] Logo trouvé : ${logoFile.fieldname} — ${logoFile.originalname}`);
            const uploaded = await uploadFileToCloudinary(logoFile, "boutique_image", entityId);
            req.uploadedLogo = uploaded;
            logger.info(`[uploadRegisterBoutique] Logo uploadé : ${uploaded.url}`);
          } else {
            logger.warn("[uploadRegisterBoutique] Aucun logo trouvé dans les fichiers");
            req.uploadedLogo = null;
          }

          if (docFiles.length > 0) {
            req.uploadedFiles = await Promise.all(
              docFiles.map(f => uploadFileToCloudinary(f, "document_legal", entityId))
            );
          } else {
            req.uploadedFiles = [];
          }

          next();
        } catch (uploadError) {
          logger.error("[Upload] Cloudinary error:", uploadError.message);
          next(new AppError("Echec de l'upload vers le stockage cloud", 502));
        }
      });
    };
  })(),


  /** Upload 1 image pour un centre commercial (non obligatoire) */
  uploadCentreCommercialImage: createUploadMiddleware("centre_commercial_image", "image", 1, false),

  /** Upload 1 image pour une box (non obligatoire) */
  uploadBoxImage: createUploadMiddleware("box_image", "image", 1, false),

  // ── Utilitaires ──────────────────────────
  deleteFromCloudinary,
  uploadFileToCloudinary,
  UPLOAD_PROFILES,
};
