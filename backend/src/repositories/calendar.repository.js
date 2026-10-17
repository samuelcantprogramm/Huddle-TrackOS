const db = require('../config/database');

/**
 * Format database row into calendar event matching frontend structure
 */
function mapCalendarRow(row) {
  return {
    id: `ev-${row.id}`,
    numericId: row.id,
    title: row.title,
    description: row.description || '',
    date: row.start_date ? String(row.start_date).split('T')[0] : '',
    startDate: row.start_date ? String(row.start_date).split('T')[0] : '',
    endDate: row.end_date ? String(row.end_date).split('T')[0] : null,
    type: row.event_type || 'deadline',
    clientId: row.client_id ? `cli-${row.client_id}` : null,
    clientName: row.client_name || null,
    serviceType: row.service_type || null,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

/**
 * Find all calendar events (joining client records where appropriate)
 */
async function findAll() {
  const rows = await db.query(`
    SELECT ce.*, c.client_name, c.service_type AS client_service_type
    FROM calendar_events ce
    LEFT JOIN clients c ON ce.client_id = c.id
    ORDER BY ce.start_date ASC, ce.id ASC
  `);
  return rows.map(mapCalendarRow);
}

/**
 * Find calendar event by ID
 */
async function findById(id) {
  const numericId = typeof id === 'string' && id.startsWith('ev-')
    ? parseInt(id.replace('ev-', ''), 10)
    : parseInt(id, 10);

  const rows = await db.query(`
    SELECT ce.*, c.client_name, c.service_type AS client_service_type
    FROM calendar_events ce
    LEFT JOIN clients c ON ce.client_id = c.id
    WHERE ce.id = ?
  `, [numericId]);

  return rows.length > 0 ? mapCalendarRow(rows[0]) : null;
}

/**
 * Create a new calendar event
 */
async function create({
  title,
  description = '',
  startDate,
  endDate = null,
  eventType = 'deadline',
  clientId = null,
  serviceType = null,
  createdBy = null
}) {
  let numericClientId = null;
  if (clientId) {
    numericClientId = typeof clientId === 'string' && clientId.startsWith('cli-')
      ? parseInt(clientId.replace('cli-', ''), 10)
      : parseInt(clientId, 10);
  }

  const result = await db.query(
    `INSERT INTO calendar_events (title, description, start_date, end_date, event_type, client_id, service_type, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, startDate, endDate, eventType, numericClientId, serviceType, createdBy]
  );

  return findById(result.insertId);
}

/**
 * Update calendar event
 */
async function update(id, data = {}) {
  const numericId = typeof id === 'string' && id.startsWith('ev-')
    ? parseInt(id.replace('ev-', ''), 10)
    : parseInt(id, 10);

  const fields = [];
  const params = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    params.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    params.push(data.description);
  }
  if (data.startDate !== undefined) {
    fields.push('start_date = ?');
    params.push(data.startDate);
  }
  if (data.endDate !== undefined) {
    fields.push('end_date = ?');
    params.push(data.endDate);
  }
  if (data.eventType !== undefined) {
    fields.push('event_type = ?');
    params.push(data.eventType);
  }
  if (data.serviceType !== undefined) {
    fields.push('service_type = ?');
    params.push(data.serviceType);
  }

  if (fields.length === 0) return findById(numericId);

  params.push(numericId);
  await db.query(`UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ?`, params);
  return findById(numericId);
}

/**
 * Remove a calendar event
 */
async function remove(id) {
  const numericId = typeof id === 'string' && id.startsWith('ev-')
    ? parseInt(id.replace('ev-', ''), 10)
    : parseInt(id, 10);

  const result = await db.query('DELETE FROM calendar_events WHERE id = ?', [numericId]);
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
