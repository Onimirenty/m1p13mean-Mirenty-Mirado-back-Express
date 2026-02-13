
const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }
  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};


module.exports = errorHandler;

