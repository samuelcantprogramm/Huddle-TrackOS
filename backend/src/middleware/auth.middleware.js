const { verifyToken } = require('../utils/jwt.utils');
const { error } = require('../utils/response.utils');
const db = require('../config/database');

/**
 * JWT Authentication Middleware
 */
async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return error(res, 'Authentication required. No token provided.', 401);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return error(res, 'Invalid or expired session token.', 401);
    }

    // Verify user still exists in database and is active
    const users = await db.query(
      'SELECT id, full_name, email, role, status, avatar_initials FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return error(res, 'Account not found.', 401);
    }

    const user = users[0];
    if (user.status !== 'active') {
      return error(res, `Account is ${user.status}. Please contact an administrator.`, 403);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Authentication failed.', 500);
  }
}

module.exports = {
  authenticate
};
