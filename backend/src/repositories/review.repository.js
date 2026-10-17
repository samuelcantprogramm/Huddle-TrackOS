const db = require('../config/database');
const activityRepo = require('./activity.repository');

/**
 * Record an Admin QA review decision (Approval or Revision)
 */
async function recordReview({
  deliverableId,
  reviewerId,
  reviewerName = 'Administrator',
  decision, // 'approved' | 'revision_requested'
  feedback = ''
}) {
  const numericDelivId = typeof deliverableId === 'string' && deliverableId.startsWith('del-')
    ? parseInt(deliverableId.replace('del-', ''), 10)
    : parseInt(deliverableId, 10);

  return db.transaction(async (conn) => {
    // 1. Fetch deliverable and stage information
    const [delivRows] = await conn.query(`
      SELECT 
        d.*,
        ps.id AS stage_id, ps.stage_order, ps.role_name, ps.assigned_va_name,
        c.id AS client_id, c.client_name
      FROM deliverables d
      JOIN pipeline_stages ps ON d.pipeline_stage_id = ps.id
      JOIN clients c ON d.client_id = c.id
      WHERE d.id = ?
    `, [numericDelivId]);

    if (delivRows.length === 0) {
      const err = new Error('Deliverable not found');
      err.statusCode = 404;
      throw err;
    }

    const deliv = delivRows[0];

    // 2. Insert review record
    const [revResult] = await conn.query(
      `INSERT INTO reviews (deliverable_id, reviewer_id, decision, feedback, reviewed_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [numericDelivId, reviewerId, decision, feedback]
    );

    if (decision === 'approved') {
      // 3a. Update deliverable
      await conn.query("UPDATE deliverables SET status = 'approved' WHERE id = ?", [numericDelivId]);

      // 3b. Mark current stage completed
      await conn.query(
        "UPDATE pipeline_stages SET status = 'completed', completed_at = NOW() WHERE id = ?",
        [deliv.stage_id]
      );

      // 3c. Fetch all stages for this client to calculate new percentage and advance next stage
      const [allStages] = await conn.query(
        'SELECT id, stage_order, status FROM pipeline_stages WHERE client_id = ? ORDER BY stage_order ASC',
        [deliv.client_id]
      );

      const totalStages = allStages.length;
      // Current stage is now completed
      const completedStages = allStages.filter(s => s.id === deliv.stage_id || s.status === 'completed').length;
      const newPercentage = totalStages > 0 ? Math.min(100, Math.round((completedStages / totalStages) * 100)) : 100;

      if (newPercentage >= 100) {
        await conn.query("UPDATE clients SET percentage = 100, status = 'completed' WHERE id = ?", [deliv.client_id]);
        await conn.query("UPDATE pipelines SET status = 'completed' WHERE client_id = ?", [deliv.client_id]);
      } else {
        // Advance next stage
        const nextStage = allStages.find(s => s.stage_order === deliv.stage_order + 1);
        if (nextStage) {
          await conn.query(
            "UPDATE pipeline_stages SET status = 'active', started_at = NOW() WHERE id = ?",
            [nextStage.id]
          );
        }
        await conn.query("UPDATE clients SET percentage = ?, status = 'active' WHERE id = ?", [newPercentage, deliv.client_id]);
      }

      // 3d. Record activity audit log
      await activityRepo.record({
        actorId: reviewerId,
        actorName: reviewerName,
        actorRole: 'admin',
        actionType: 'approval',
        clientId: deliv.client_id,
        clientName: deliv.client_name,
        stageName: deliv.role_name,
        targetVa: deliv.assigned_va_name,
        title: `Deliverable Approved for ${deliv.client_name}`,
        summary: `Admin approved stage "${deliv.role_name}" for ${deliv.client_name}.`,
        details: feedback ? `Feedback: ${feedback}` : 'No additional comments.'
      });

    } else {
      // 4a. Update deliverable to revision_requested
      await conn.query("UPDATE deliverables SET status = 'revision_requested' WHERE id = ?", [numericDelivId]);

      // 4b. Update stage to revision
      await conn.query("UPDATE pipeline_stages SET status = 'revision' WHERE id = ?", [deliv.stage_id]);

      // 4c. Update client status to revision
      await conn.query("UPDATE clients SET status = 'revision' WHERE id = ?", [deliv.client_id]);

      // 4d. Record activity audit log
      await activityRepo.record({
        actorId: reviewerId,
        actorName: reviewerName,
        actorRole: 'admin',
        actionType: 'revision',
        clientId: deliv.client_id,
        clientName: deliv.client_name,
        stageName: deliv.role_name,
        targetVa: deliv.assigned_va_name,
        title: `Revision Requested for ${deliv.client_name}`,
        summary: `Admin requested revisions for stage "${deliv.role_name}" (${deliv.assigned_va_name}).`,
        details: feedback ? `Notes: ${feedback}` : 'Revisions requested.'
      });
    }

    return revResult.insertId;
  });
}

module.exports = {
  recordReview
};
