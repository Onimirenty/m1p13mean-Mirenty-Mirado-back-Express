const jwt = require('jsonwebtoken');

const View = require('./View.model');
const Boutique = require('../boutiques/Boutique.model');
const Promotion = require('../promotions/Promotion.model');
const AppError = require('../../utils/AppError');

// ─────────────────────────────────────────
// HELPER PRIVÉ
// ─────────────────────────────────────────

// Résout le visitorKey :
// - Si token JWT valide dans le header → utilise l'userId (user connecté)
// - Sinon → utilise le visitorKey UUID envoyé par le frontend (user non connecté)
const resolveVisitorKey = (authHeader, bodyVisitorKey) => {
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET);
      return decoded.userId;
    } catch (err) {
      // Token expiré → on accepte le fallback visitorKey
      if (err.name === 'TokenExpiredError') {
        // fall through
      } else {
        // Token falsifié ou malformé → on rejette
        throw new AppError('Token invalide', 401);
      }
    }
  }

  if (!bodyVisitorKey) {
    throw new AppError('visitorKey requis pour les utilisateurs non connectés', 400);
  }

  return bodyVisitorKey;
};

// Incrémente le compteur de vues sur l'entité cible
const incrementViewCount = async (targetType, targetId) => {
  if (targetType === 'BOUTIQUE') {
    await Boutique.findByIdAndUpdate(targetId, {
      $inc: { 'statsSnapshot.totalViews': 1 },
    });
  } else if (targetType === 'PROMOTION') {
    await Promotion.findByIdAndUpdate(targetId, {
      $inc: { 'stats.vues': 1 },
    });
  }
  // CENTRE → pas de compteur dans le modèle actuel
};

// ─────────────────────────────────────────
// ENREGISTRER UNE VUE
// ─────────────────────────────────────────

const enregistrerVue = async ({ targetType, targetId, visitorKey, authHeader }) => {
  if (!targetType || !targetId) {
    throw new AppError('targetType et targetId sont requis', 400);
  }

  const resolvedKey = resolveVisitorKey(authHeader, visitorKey);

  // upsert : si la vue existe déjà on ne recompte pas (index unique)
  const { upsertedCount } = await View.updateOne(
    { targetType, targetId, visitorKey: resolvedKey },
    { $setOnInsert: { targetType, targetId, visitorKey: resolvedKey } },
    { upsert: true }
  );

  // On incrémente le compteur uniquement si c'est une nouvelle vue
  if (upsertedCount > 0) {
    await incrementViewCount(targetType, targetId);
  }

  return { nouvelle: upsertedCount > 0 };
};

module.exports = { enregistrerVue };
