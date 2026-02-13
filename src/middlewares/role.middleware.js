const ApiError = require("../utils/ApiError");

/**
 * Middleware d'autorisation par rôle
 * Usage : role("admin") ou role("admin","proprietaire")
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden"));
    }

    next();
  };
};

module.exports = { checkRole };
