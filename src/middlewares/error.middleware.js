

const errorMiddleware = (err, req, res, next) => {

  if (err.name === 'CastError') {
    err = new AppError('Invalid ID format', 400);
  }

  if (err.code === 11000) {
    err = new AppError('Duplicate field value', 400);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(el => el.message)
      .join(', ');
    err = new AppError(message, 400);
  }

  if (!err.isOperational) {
    console.error('UNEXPECTED ERROR:', err);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }

  res.status(err.status || 500).json({
    message: err.message
  });
};

module.exports = errorMiddleware;
