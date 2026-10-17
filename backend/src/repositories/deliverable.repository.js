const db = require('../config/database');
const activityRepo = require('./activity.repository');

/**
 * Format deliverable database row
 */
function mapDeliverableRow(row) {
  return {
    id: `del-${row.id}`,
    numericId: row.id,
    stageId: `stg-${row.pipeline_stage_id}`,
    stageNumericId: row.pipeline_stage_id,
    clientId: `cli-${row.client_id}`,
    clientNumericId: row.client_id,
    clientName: row.client_name,
    serviceType: row.service_type,
    stageName: row.stage_role_name,
    submittedBy: row.submitted_by,
    submitterName: row.submitter_name,
    reportText: row.report_text,
    externalLink: row.external_link,
    fileName: row.file_name,
    filePath: row.file_path,
    fileType: row.file_type,
    fileSize: row.file_size,
    status: row.status,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : '',
    formattedDate: row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '',
    reviewFeedback: row.review_feedback || null,
    reviewerName: row.reviewer_name || null,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null
  };
}

/**
 * Find deliverable by ID
 */
async function findById(id) {
  const numericId = typeof id === 'string' && id.startsWith('del-')
    ? parseInt(id.replace('del-', ''), 10)
    : parseInt(id, 10);

  const rows = await db.query(`
    SELECT 
      d.*,
      c.client_name, c.service_type,
      ps.role_name AS stage_role_name,
      u.full_name AS submitter_name,
      r.feedback AS review_feedback,
      r.reviewed_at,
      ru.full_name AS reviewer_name
    FROM deliverables d
    JOIN clients c ON d.client_id = c.id
    JOIN pipeline_stages ps ON d.pipeline_stage_id = ps.id
    JOIN users u ON d.submitted_by = u.id
    LEFT JOIN (
      SELECT r1.*
      FROM reviews r1
      INNER JOIN (
        SELECT deliverable_id, MAX(id) AS max_id FROM reviews GROUP BY deliverable_id
      ) r2 ON r1.id = r2.max_id
    ) r ON d.id = r.deliverable_id
    LEFT JOIN users ru ON r.reviewer_id = ru.id
    WHERE d.id = ?
  `, [numericId]);

  return rows.length > 0 ? mapDeliverableRow(rows[0]) : null;
}

/**
 * Find all deliverables with optional status filter
 */
async function findAll(status = 'all') {
  let sql = `
    SELECT 
      d.*,
      c.client_name, c.service_type,
      ps.role_name AS stage_role_name,
      u.full_name AS submitter_name,
      r.feedback AS review_feedback,
      r.reviewed_at,
      ru.full_name AS reviewer_name
    FROM deliverables d
    JOIN clients c ON d.client_id = c.id
    JOIN pipeline_stages ps ON d.pipeline_stage_id = ps.id
    JOIN users u ON d.submitted_by = u.id
    LEFT JOIN (
      SELECT r1.*
      FROM reviews r1
      INNER JOIN (
        SELECT deliverable_id, MAX(id) AS max_id FROM reviews GROUP BY deliverable_id
      ) r2 ON r1.id = r2.max_id
    ) r ON d.id = r.deliverable_id
    LEFT JOIN users ru ON r.reviewer_id = ru.id
  `;
  const params = [];

  if (status && status !== 'all') {
    sql += ' WHERE d.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY d.submitted_at DESC';

  const rows = await db.query(sql, params);
  return rows.map(mapDeliverableRow);
}

/**
 * Submit a deliverable for a stage
 */
async function submitDeliverable({
  stageId,
  submittedBy,
  submitterName = 'VA Specialist',
  reportText,
  externalLink = null,
  file = null
}) {
  const numericStageId = typeof stageId === 'string' && stageId.startsWith('stg-')
    ? parseInt(stageId.replace('stg-', ''), 10)
    : parseInt(stageId, 10);

  return db.transaction(async (conn) => {
    // 1. Fetch stage and client info
    const [stageRows] = await conn.query(`
      SELECT ps.*, c.client_name, c.service_type
      FROM pipeline_stages ps
      JOIN clients c ON ps.client_id = c.id
      WHERE ps.id = ?
    `, [numericStageId]);

    if (stageRows.length === 0) {
      const err = new Error('Pipeline stage not found');
      err.statusCode = 404;
      throw err;
    }

    const stage = stageRows[0];

    // 2. Prepare file fields
    const fileName = file ? file.originalname : null;
    const filePath = file ? `/uploads/${file.filename}` : null;
    const fileType = file ? file.mimetype : null;
    const fileSize = file ? file.size : null;

    // 3. Insert deliverable
    const [delivRes] = await conn.query(
      `INSERT INTO deliverables 
       (pipeline_stage_id, client_id, submitted_by, report_text, external_link, file_name, file_path, file_type, file_size, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [numericStageId, stage.client_id, submittedBy, reportText, externalLink, fileName, filePath, fileType, fileSize]
    );

    // 4. Update stage status to 'in_review'
    await conn.query(
      "UPDATE pipeline_stages SET status = 'in_review' WHERE id = ?",
      [numericStageId]
    );

    // 5. Update client status to 'in_review' if it's currently active or revision
    await conn.query(
      "UPDATE clients SET status = 'in_review' WHERE id = ? AND status IN ('active', 'revision')",
      [stage.client_id]
    );

    // 6. Record activity audit log
    await activityRepo.record({
      actorId: submittedBy,
      actorName: submitterName,
      actorRole: 'va',
      actionType: 'submission',
      clientId: stage.client_id,
      clientName: stage.client_name,
      stageName: stage.role_name,
      targetVa: stage.assigned_va_name,
      title: `Deliverable Submitted for ${stage.client_name}`,
      summary: `${submitterName} submitted deliverables for stage "${stage.role_name}".`,
      details: reportText + (externalLink ? ` (Link: ${externalLink})` : '')
    });

    return delivRes.insertId;
  });
}

module.exports = {
  findById,
  findAll,
  submitDeliverable
};
