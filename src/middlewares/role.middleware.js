const AppError = require("../utils/AppError");
const logger = require('../utils/logger')
/**
 * Middleware d'autorisation par rôle
 * Usage : role("ADMIN") ou role("ADMIN","owner")
 * 
 */

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Unauthorized",401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(`Forbidden : your role ${req.user.role} doesn't permit this operation`,403));
    }
    next();
  };
};

module.exports = { checkRole };
