const db = require('../config/database');

/**
 * Format ping database row
 */
function mapPingRow(row) {
  return {
    id: `png-${row.id}`,
    numericId: row.id,
    clientId: row.client_id ? `cli-${row.client_id}` : null,
    clientName: row.client_name || 'General Pipeline',
    stageId: row.stage_id ? `stg-${row.stage_id}` : null,
    stageName: row.stage_role_name || null,
    senderId: row.sender_id,
    senderName: row.sender_name || 'Administrator',
    targetVaId: row.target_va_id,
    targetVaName: row.target_va_name,
    message: row.message,
    isUrgent: Boolean(row.is_urgent),
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    formattedDate: row.created_at ? new Date(row.created_at).toLocaleString() : ''
  };
}

/**
 * Create a new ping alert
 */
async function create({
  clientId = null,
  stageId = null,
  senderId,
  targetVaName,
  targetVaId = null,
  message,
  isUrgent = false
}) {
  let numericClientId = null;
  if (clientId) {
    numericClientId = typeof clientId === 'string' && clientId.startsWith('cli-')
      ? parseInt(clientId.replace('cli-', ''), 10)
      : parseInt(clientId, 10);
  }

  let numericStageId = null;
  if (stageId) {
    numericStageId = typeof stageId === 'string' && stageId.startsWith('stg-')
      ? parseInt(stageId.replace('stg-', ''), 10)
      : parseInt(stageId, 10);
  }

  // If targetVaId is not provided, look up by name
  let vaId = targetVaId;
  if (!vaId && targetVaName) {
    const userRows = await db.query(
      'SELECT id FROM users WHERE LOWER(full_name) = LOWER(?)',
      [targetVaName.trim()]
    );
    if (userRows.length > 0) vaId = userRows[0].id;
  }

  const result = await db.query(
    `INSERT INTO pings (client_id, stage_id, sender_id, target_va_id, target_va_name, message, is_urgent, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'unread')`,
    [numericClientId, numericStageId, senderId, vaId, targetVaName.trim(), message.trim(), isUrgent ? 1 : 0]
  );

  return findById(result.insertId);
}

/**
 * Find ping by ID
 */
async function findById(id) {
  const numericId = typeof id === 'string' && id.startsWith('png-')
    ? parseInt(id.replace('png-', ''), 10)
    : parseInt(id, 10);

  const rows = await db.query(`
    SELECT p.*, c.client_name, ps.role_name AS stage_role_name, u.full_name AS sender_name
    FROM pings p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN pipeline_stages ps ON p.stage_id = ps.id
    LEFT JOIN users u ON p.sender_id = u.id
    WHERE p.id = ?
  `, [numericId]);

  return rows.length > 0 ? mapPingRow(rows[0]) : null;
}

/**
 * Find pings for a specific target VA or all pings (if admin)
 */
async function findForUser(vaName = null, userId = null) {
  let sql = `
    SELECT p.*, c.client_name, ps.role_name AS stage_role_name, u.full_name AS sender_name
    FROM pings p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN pipeline_stages ps ON p.stage_id = ps.id
    LEFT JOIN users u ON p.sender_id = u.id
  `;
  const params = [];

  if (vaName || userId) {
    sql += ' WHERE (';
    const sub = [];
    if (vaName) {
      sub.push('LOWER(TRIM(p.target_va_name)) = LOWER(TRIM(?))');
      params.push(vaName);
    }
    if (userId) {
      sub.push('p.target_va_id = ?');
      params.push(userId);
    }
    sql += sub.join(' OR ') + ')';
  }

  sql += ' ORDER BY p.created_at DESC LIMIT 50';

  const rows = await db.query(sql, params);
  return rows.map(mapPingRow);
}

/**
 * Mark a ping as read
 */
async function markAsRead(id) {
  const numericId = typeof id === 'string' && id.startsWith('png-')
    ? parseInt(id.replace('png-', ''), 10)
    : parseInt(id, 10);

  const result = await db.query("UPDATE pings SET status = 'read' WHERE id = ?", [numericId]);
  return result.affectedRows > 0;
}

/**
 * Get count of unread pings
 */
async function getUnreadCount(vaName = null, userId = null) {
  let sql = "SELECT COUNT(*) AS unread_count FROM pings WHERE status = 'unread'";
  const params = [];

  if (vaName || userId) {
    sql += ' AND (';
    const sub = [];
    if (vaName) {
      sub.push('LOWER(TRIM(target_va_name)) = LOWER(TRIM(?))');
      params.push(vaName);
    }
    if (userId) {
      sub.push('target_va_id = ?');
      params.push(userId);
    }
    sql += sub.join(' OR ') + ')';
  }

  const rows = await db.query(sql, params);
  return rows.length > 0 ? Number(rows[0].unread_count) : 0;
}

module.exports = {
  create,
  findById,
  findForUser,
  markAsRead,
  getUnreadCount
};
