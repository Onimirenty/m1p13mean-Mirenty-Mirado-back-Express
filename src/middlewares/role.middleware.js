const AppError = require("../utils/AppError");

/**
 * Middleware d'autorisation par rôle
 * Usage : role("admin") ou role("admin","proprietaire")
 * 
 */

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden"));
    }
    next();
  };
};

module.exports = { checkRole };
