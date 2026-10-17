const db = require('../config/database');

async function findAll() {
  return db.query('SELECT * FROM services WHERE is_active = TRUE ORDER BY service_name ASC');
}

async function findByName(serviceName) {
  const rows = await db.query('SELECT * FROM services WHERE service_name = ?', [serviceName]);
  return rows[0] || null;
}

async function create({ serviceName, slug, description, isActive = true }) {
  const result = await db.query(
    'INSERT INTO services (service_name, slug, description, is_active) VALUES (?, ?, ?, ?)',
    [serviceName, slug, description, isActive]
  );
  const rows = await db.query('SELECT * FROM services WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function update(id, updates = {}) {
  const fields = [];
  const params = [];

  if (updates.serviceName !== undefined) {
    fields.push('service_name = ?');
    params.push(updates.serviceName);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    params.push(updates.description);
  }
  if (updates.isActive !== undefined) {
    fields.push('is_active = ?');
    params.push(updates.isActive);
  }

  if (fields.length === 0) return null;
  params.push(id);
  await db.query(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, params);
  const rows = await db.query('SELECT * FROM services WHERE id = ?', [id]);
  return rows[0];
}

module.exports = {
  findAll,
  findByName,
  create,
  update
};
