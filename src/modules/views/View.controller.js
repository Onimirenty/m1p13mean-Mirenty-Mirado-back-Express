const ViewService = require('./View.service');

exports.enregistrerVue = async (req, res, next) => {
  try {
    const { targetType, targetId, visitorKey } = req.body;

    const result = await ViewService.enregistrerVue({
      targetType,
      targetId,
      visitorKey,
      authHeader: req.headers.authorization,
    });

    const message = result.nouvelle ? 'Vue enregistrée' : 'Vue déjà enregistrée';
    res.status(200).json({ message });
  } catch (error) {
    // Cas de race condition sur l'index unique (deux requêtes simultanées)
    if (error.code === 11000) {
      return res.status(200).json({ message: 'Vue déjà enregistrée' });
    }
    next(error);
  }
};
