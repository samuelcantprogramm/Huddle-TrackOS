const userRepo = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password.utils');
const { generateToken } = require('../utils/jwt.utils');
const { success, error } = require('../utils/response.utils');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const user = await userRepo.findByEmail(email);
    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    if (user.status !== 'active') {
      return error(res, `Account is ${user.status}. Please contact an administrator.`, 403);
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    });

    return success(res, {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        avatarInitials: user.avatar_initials || user.full_name.slice(0, 2).toUpperCase()
      }
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { fullName, email, password, role = 'va' } = req.body;
    if (!fullName || !email || !password) {
      return error(res, 'Full name, email, and password are required', 400);
    }

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return error(res, 'An account with this email already exists', 409);
    }

    const passwordHash = await hashPassword(password);
    const avatarInitials = fullName
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newUser = await userRepo.create({
      fullName,
      email,
      passwordHash,
      role,
      avatarInitials
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
      role: newUser.role
    });

    return success(res, {
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        avatarInitials: newUser.avatar_initials
      }
    }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    return success(res, {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarInitials: user.avatar_initials
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  return success(res, null, 'Logged out successfully');
}

module.exports = {
  login,
  register,
  me,
  logout
};
