const db = require('../config/database');

/**
 * Record a new activity entry in the audit trail
 */
async function record({
  actorId = null,
  actorName = 'System',
  actorRole = 'system',
  actionType = 'lifecycle',
  clientId = null,
  clientName = '',
  stageName = null,
  targetVa = null,
  title = '',
  summary = '',
  details = '',
  metadata = null
}) {
  const metadataJson = metadata ? JSON.stringify(metadata) : null;
  const result = await db.query(
    `INSERT INTO activity_logs 
     (actor_id, actor_name, actor_role, action_type, client_id, client_name, stage_name, target_va, title, summary, details, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      actorId,
      actorName,
      actorRole,
      actionType,
      clientId,
      clientName,
      stageName,
      targetVa,
      title,
      summary,
      details,
      metadataJson
    ]
  );
  return result.insertId;
}

/**
 * Retrieve filtered activity entries for UI display
 */
async function findAll(options = {}) {
  const {
    actionType = 'all',
    va = 'all',
    client = 'all',
    search = '',
    assignedVaId = null,
    assignedVaName = null,
    limit = 50,
    offset = 0
  } = options;

  const whereClauses = [];
  const params = [];

  if (assignedVaId || assignedVaName) {
    whereClauses.push(`(
      client_id IN (
        SELECT DISTINCT client_id 
        FROM pipeline_stages 
        WHERE (assigned_va_id IS NOT NULL AND assigned_va_id = ?) 
           OR LOWER(assigned_va_name) = LOWER(?)
      )
      OR LOWER(target_va) = LOWER(?)
      OR (actor_id IS NOT NULL AND actor_id = ?)
    )`);
    params.push(
      Number(assignedVaId) || 0,
      (assignedVaName || '').trim(),
      (assignedVaName || '').trim(),
      Number(assignedVaId) || 0
    );
  }

  if (actionType && actionType !== 'all') {
    whereClauses.push('action_type = ?');
    params.push(actionType);
  }

  if (va && va !== 'all') {
    whereClauses.push('(LOWER(target_va) = LOWER(?) OR LOWER(actor_name) = LOWER(?))');
    params.push(va.trim(), va.trim());
  }

  if (client && client !== 'all') {
    whereClauses.push('LOWER(client_name) = LOWER(?)');
    params.push(client.trim());
  }

  if (search && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    whereClauses.push('(LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(details) LIKE ? OR LOWER(client_name) LIKE ?)');
    params.push(q, q, q, q);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  
  const [countRow] = await db.query(
    `SELECT COUNT(*) AS total FROM activity_logs ${whereSql}`,
    params
  );
  const total = countRow ? countRow.total : 0;

  const rows = await db.query(
    `SELECT * FROM activity_logs ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return {
    data: rows.map(r => ({
      id: `act-${r.id}`,
      numericId: r.id,
      timestamp: r.created_at ? new Date(r.created_at).toISOString() : '',
      formattedDate: r.created_at ? new Date(r.created_at).toLocaleString() : '',
      type: r.action_type,
      actor: {
        id: r.actor_id,
        name: r.actor_name,
        role: r.actor_role
      },
      clientName: r.client_name,
      clientId: r.client_id,
      stageName: r.stage_name,
      targetVA: r.target_va,
      title: r.title,
      summary: r.summary,
      details: r.details,
      metadata: r.metadata_json ? (typeof r.metadata_json === 'string' ? JSON.parse(r.metadata_json) : r.metadata_json) : null
    })),
    total
  };
}

/**
 * Export activity records as raw JSON array
 */
async function getAllForExport(options = {}) {
  const { assignedVaId = null, assignedVaName = null } = options;
  let sql = 'SELECT * FROM activity_logs';
  const params = [];

  if (assignedVaId || assignedVaName) {
    sql += ` WHERE (
      client_id IN (
        SELECT DISTINCT client_id 
        FROM pipeline_stages 
        WHERE (assigned_va_id IS NOT NULL AND assigned_va_id = ?) 
           OR LOWER(assigned_va_name) = LOWER(?)
      )
      OR LOWER(target_va) = LOWER(?)
      OR (actor_id IS NOT NULL AND actor_id = ?)
    )`;
    params.push(
      Number(assignedVaId) || 0,
      (assignedVaName || '').trim(),
      (assignedVaName || '').trim(),
      Number(assignedVaId) || 0
    );
  }

  sql += ' ORDER BY created_at DESC';
  const rows = await db.query(sql, params);
  return rows.map(r => ({
    id: `act-${r.id}`,
    timestamp: r.created_at ? new Date(r.created_at).toISOString() : '',
    type: r.action_type,
    actor: r.actor_name,
    actorRole: r.actor_role,
    client: r.client_name,
    stage: r.stage_name,
    targetVA: r.target_va,
    title: r.title,
    summary: r.summary,
    details: r.details
  }));
}

module.exports = {
  record,
  findAll,
  getAllForExport
};
