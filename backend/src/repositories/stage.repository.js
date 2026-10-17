const db = require('../config/database');

/**
 * Find stage by ID
 */
async function findById(id) {
  const numericId = typeof id === 'string' && id.startsWith('stg-')
    ? parseInt(id.replace('stg-', ''), 10)
    : parseInt(id, 10);

  const rows = await db.query(`
    SELECT ps.*, c.client_name, c.service_type
    FROM pipeline_stages ps
    JOIN clients c ON ps.client_id = c.id
    WHERE ps.id = ?
  `, [numericId]);

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Update stage fields
 */
async function update(id, updates = {}) {
  const numericId = typeof id === 'string' && id.startsWith('stg-')
    ? parseInt(id.replace('stg-', ''), 10)
    : parseInt(id, 10);

  const fields = [];
  const params = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    params.push(updates.status);
  }
  if (updates.assignedVaName !== undefined) {
    fields.push('assigned_va_name = ?');
    params.push(updates.assignedVaName);
  }
  if (updates.assignedVaId !== undefined) {
    fields.push('assigned_va_id = ?');
    params.push(updates.assignedVaId);
  }
  if (updates.roleName !== undefined) {
    fields.push('role_name = ?');
    params.push(updates.roleName);
  }
  if (updates.startedAt !== undefined) {
    fields.push('started_at = ?');
    params.push(updates.startedAt);
  }
  if (updates.completedAt !== undefined) {
    fields.push('completed_at = ?');
    params.push(updates.completedAt);
  }

  if (fields.length === 0) return findById(numericId);

  params.push(numericId);
  await db.query(`UPDATE pipeline_stages SET ${fields.join(', ')} WHERE id = ?`, params);
  return findById(numericId);
}

/**
 * Assign or reassign VA to a stage
 */
async function assignVA(stageId, vaName, vaId = null) {
  const numericStageId = typeof stageId === 'string' && stageId.startsWith('stg-')
    ? parseInt(stageId.replace('stg-', ''), 10)
    : parseInt(stageId, 10);

  let targetVaId = vaId;
  if (!targetVaId && vaName) {
    const [userRows] = await db.query('SELECT id FROM users WHERE LOWER(full_name) = LOWER(?)', [vaName.trim()]);
    if (userRows.length > 0) targetVaId = userRows[0].id;
  }

  await db.query(
    'UPDATE pipeline_stages SET assigned_va_name = ?, assigned_va_id = ? WHERE id = ?',
    [vaName.trim(), targetVaId, numericStageId]
  );

  return findById(numericStageId);
}

module.exports = {
  findById,
  update,
  assignVA
};
