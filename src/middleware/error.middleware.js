const ApiError = require("../utils/apiError");

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || "INTERNAL_ERROR";
  let message = err.message || "An unexpected error occurred";
  let details = err.details || null;

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = "Database validation failed";
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }

  // Handle Mongoose Bad ObjectId / Cast Error
  if (err.name === "CastError") {
    statusCode = 400;
    errorCode = "INVALID_ID";
    message = `Invalid format for identifier: ${err.value}`;
  }

  // Handle MongoDB Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = "DUPLICATE_KEY_ERROR";
    const duplicateFields = Object.keys(err.keyValue || {}).join(", ");
    message = `A resource with this ${duplicateFields || "field"} already exists`;
  }

  // Handle JWT Malformed / Signature Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    errorCode = "INVALID_TOKEN";
    message = "Invalid or tampered authentication token";
  }

  // Handle JWT Expired Error
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    errorCode = "TOKEN_EXPIRED";
    message = "Authentication token has expired. Please log in again.";
  }

  // Response payload following uniform architecture specification
  const responsePayload = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      details: details
    }
  };

  // Include stack trace in development only
  if (process.env.NODE_ENV === "development" && statusCode === 500) {
    responsePayload.error.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
}

module.exports = errorHandler;
