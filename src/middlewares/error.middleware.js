const AppError = require('../utils/AppError');
const logger = require('../utils/logger')

const errorMiddleware = (err, req, res, next) => {

  let error = err;

  /*
  =========================================================
   Transformation des erreurs techniques connues
  =========================================================
  */

  // Mongoose : ID invalide
  if (error.name === 'CastError') {
    error = new AppError(`Invalid ${error.path}: ${error.value}`, 400);
  }

  // MongoDB duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    error = new AppError(`${field} already exists`, 400);
  }

  // Mongoose validation
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors)
      .map(el => el.message)
      .join(', ');
    error = new AppError(messages, 400);
  }

  // JWT invalid
  if (error.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  // JWT expired
  if (error.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  /*
  =========================================================
  Erreur inattendue (bug)
  =========================================================
  */

  if (!(error instanceof AppError)) {
    console.error('UNEXPECTED ERROR:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
    });
    logger.error('UNEXPECTED ERROR:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
    });

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }



  /*
  =========================================================
  Erreur opérationnelle
  =========================================================
  */
//fail :erreur cote client
//error :erreur cote serveur

  const response = {
    status: 'fail',
    message: `error middleware : ${error.message} `,
  };
  logger.error(`Operational error: ${error.message}`)
  logger.error(`error stackTrace: ${error.stack}`)
  // En dev on expose plus d'infos
  // if (process.env.NODE_ENV === 'development') {
  //   response.stack = error.stack;
  // }

  return res.status(error.status || 500).json(response);
};

module.exports = errorMiddleware;
