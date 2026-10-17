const multer = require('multer');
const { error } = require('../utils/response.utils');

/**
 * 404 Route Not Found Middleware
 */
function notFoundHandler(req, res, next) {
  return error(res, `Resource not found: ${req.method} ${req.originalUrl}`, 404);
}

/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Handle Multer upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'Uploaded file exceeds the maximum allowed size (10MB).', 400);
    }
    return error(res, `File upload error: ${err.message}`, 400);
  }

  // Handle Multer fileFilter custom errors
  if (err.message && err.message.includes('Unsupported file type')) {
    return error(res, err.message, 400);
  }

  // Handle MySQL Duplicate Entry Errors (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY') {
    return error(res, 'A record with this unique value already exists.', 409);
  }

  // Handle MySQL Foreign Key Constraint Failures (ER_NO_REFERENCED_ROW_2)
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return error(res, 'Referenced parent record does not exist.', 400);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected internal server error occurred.'
    : (err.message || 'Internal Server Error');

  return error(res, message, statusCode);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
