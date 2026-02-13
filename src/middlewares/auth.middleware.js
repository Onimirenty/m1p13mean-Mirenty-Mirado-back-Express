const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const checkToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Token not provided");
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"], // Sécurité explicite
    });

    // Normalisation des données attachées à la requête
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };
    
    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired"));
    }

    return next(new ApiError(401, "Invalid token"));
  }
};

module.exports = { checkToken };
