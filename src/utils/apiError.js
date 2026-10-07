
class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errorCode = "INTERNAL_ERROR", details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode = "BAD_REQUEST", details = null) {
    return new ApiError(400, message, errorCode, details);
  }

  static unauthorized(message = "Unauthorized access", errorCode = "UNAUTHORIZED") {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message = "Forbidden access", errorCode = "FORBIDDEN") {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message = "Resource not found", errorCode = "NOT_FOUND") {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message, errorCode = "CONFLICT") {
    return new ApiError(409, message, errorCode);
  }

  static unprocessable(message, errorCode = "UNPROCESSABLE_ENTITY", details = null) {
    return new ApiError(422, message, errorCode, details);
  }

  static internal(message = "Internal server error", errorCode = "INTERNAL_ERROR") {
    return new ApiError(500, message, errorCode);
  }
}

module.exports = ApiError;
