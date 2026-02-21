const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const checkToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Token not provided", 401);
    }

    const token = authHeader.substring(7);

    //throw une erreur si la fonction jwt.verify() detecte un token invalide ou expiré
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Normalisation des données attachées à la requête
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        role: decoded.role,
        email: decoded.email,
      };

    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkToken };
