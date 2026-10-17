const { error } = require('../utils/response.utils');

/**
 * Role-based authorization middleware
 * @param {Array<string>} allowedRoles e.g. ['admin'] or ['admin', 'va']
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}].`,
        403
      );
    }

    next();
  };
}

module.exports = {
  requireRole
};
