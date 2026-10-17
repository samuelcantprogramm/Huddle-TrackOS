const userRepo = require('../repositories/user.repository');
const { hashPassword } = require('../utils/password.utils');
const { success, error } = require('../utils/response.utils');

async function listUsers(req, res, next) {
  try {
    const { role } = req.query;
    const users = await userRepo.findAll(role || null);
    return success(res, users);
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userRepo.findById(req.params.id);
    if (!user) {
      return error(res, 'User not found', 404);
    }
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { fullName, email, password, role = 'va' } = req.body;
    if (!fullName || !email || !password) {
      return error(res, 'Full name, email, and password are required', 400);
    }

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return error(res, 'User with this email already exists', 409);
    }

    const passwordHash = await hashPassword(password);
    const avatarInitials = fullName
      .split(' ')
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const created = await userRepo.create({
      fullName,
      email,
      passwordHash,
      role,
      avatarInitials
    });

    return success(res, created, 'User created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.passwordHash = await hashPassword(updates.password);
      delete updates.password;
    }

    const updated = await userRepo.update(req.params.id, updates);
    if (!updated) {
      return error(res, 'User not found', 404);
    }
    return success(res, updated, 'User updated successfully');
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const removed = await userRepo.remove(req.params.id);
    if (!removed) {
      return error(res, 'User not found', 404);
    }
    return success(res, null, 'User deleted successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
