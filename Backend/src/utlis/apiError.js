
class apiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    this.data = null;

    Error.captureStackTrace(this, this.constructor); // optional, keeps stack clean
  }
}

export { apiError };
