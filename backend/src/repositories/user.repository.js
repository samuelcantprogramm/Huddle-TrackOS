const db = require('../config/database');

async function findByEmail(email) {
  const rows = await db.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
    [email.trim()]
  );
  return rows[0] || null;
}

async function findById(id) {
  const rows = await db.query(
    'SELECT id, full_name, email, role, status, avatar_initials, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function findAll(role = null) {
  if (role) {
    return db.query(
      'SELECT id, full_name, email, role, status, avatar_initials, created_at FROM users WHERE role = ? ORDER BY full_name ASC',
      [role]
    );
  }
  return db.query(
    'SELECT id, full_name, email, role, status, avatar_initials, created_at FROM users ORDER BY full_name ASC'
  );
}

async function create({ fullName, email, passwordHash, role, avatarInitials }) {
  const result = await db.query(
    'INSERT INTO users (full_name, email, password_hash, role, status, avatar_initials) VALUES (?, ?, ?, ?, ?, ?)',
    [fullName, email.toLowerCase(), passwordHash, role, 'active', avatarInitials]
  );
  return findById(result.insertId);
}

async function update(id, updates = {}) {
  const fields = [];
  const params = [];

  if (updates.fullName !== undefined) {
    fields.push('full_name = ?');
    params.push(updates.fullName);
  }
  if (updates.role !== undefined) {
    fields.push('role = ?');
    params.push(updates.role);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    params.push(updates.status);
  }
  if (updates.avatarInitials !== undefined) {
    fields.push('avatar_initials = ?');
    params.push(updates.avatarInitials);
  }
  if (updates.passwordHash !== undefined) {
    fields.push('password_hash = ?');
    params.push(updates.passwordHash);
  }

  if (fields.length === 0) return findById(id);

  params.push(id);
  await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function remove(id) {
  const result = await db.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  findByEmail,
  findById,
  findAll,
  create,
  update,
  remove
};
