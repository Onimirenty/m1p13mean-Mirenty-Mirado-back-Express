class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.status = statusCode;
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
