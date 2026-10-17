const db = require('../config/database');

/**
 * Format client row and attach stages into clean structure matching frontend
 */
function mapClientRow(row, stages = []) {
  return {
    id: `cli-${row.id}`,
    numericId: row.id,
    name: row.client_name,
    contact: row.contact_name || '',
    industry: row.industry || 'General',
    tier: row.tier || 'growth',
    serviceType: row.service_type,
    serviceId: row.service_id,
    deadline: row.deadline ? String(row.deadline).split('T')[0] : '',
    percentage: Number(row.percentage) || 0,
    notes: row.notes || '',
    status: row.status,
    createdAt: row.created_at ? String(row.created_at).split('T')[0] : '',
    stages: stages.map(s => ({
      id: `stg-${s.id}`,
      numericId: s.id,
      stageOrder: s.stage_order,
      vaName: s.assigned_va_name,
      vaId: s.assigned_va_id ? `usr-${s.assigned_va_id}` : null,
      role: s.role_name,
      status: s.status,
      deadline: s.deadline ? String(s.deadline).split('T')[0] : '',
      startedAt: s.started_at,
      completedAt: s.completed_at,
      submission: s.deliverable_id ? {
        id: `del-${s.deliverable_id}`,
        numericId: s.deliverable_id,
        report: s.report_text,
        link: s.external_link,
        fileName: s.file_name,
        fileUrl: s.file_path,
        fileType: s.file_type,
        submittedAt: s.submitted_at,
        feedback: s.review_feedback || null
      } : (s.review_feedback ? { feedback: s.review_feedback } : null)
    }))
  };
}

/**
 * Fetch all pipeline stages for a set of client IDs
 */
async function fetchStagesForClientIds(clientIds) {
  if (!clientIds || clientIds.length === 0) return {};

  const placeholders = clientIds.map(() => '?').join(',');
  const sql = `
    SELECT 
      ps.id, ps.client_id, ps.stage_order, ps.role_name, ps.assigned_va_id, ps.assigned_va_name, ps.status, ps.deadline,
      ps.started_at, ps.completed_at,
      d.id AS deliverable_id, d.report_text, d.external_link, d.file_name, d.file_path, d.file_type, d.submitted_at,
      r.feedback AS review_feedback
    FROM pipeline_stages ps
    LEFT JOIN (
      SELECT d1.*
      FROM deliverables d1
      INNER JOIN (
        SELECT pipeline_stage_id, MAX(id) AS max_id FROM deliverables GROUP BY pipeline_stage_id
      ) d2 ON d1.id = d2.max_id
    ) d ON ps.id = d.pipeline_stage_id
    LEFT JOIN (
      SELECT r1.*
      FROM reviews r1
      INNER JOIN (
        SELECT deliverable_id, MAX(id) AS max_id FROM reviews GROUP BY deliverable_id
      ) r2 ON r1.id = r2.max_id
    ) r ON d.id = r.deliverable_id
    WHERE ps.client_id IN (${placeholders})
    ORDER BY ps.client_id ASC, ps.stage_order ASC
  `;

  const rows = await db.query(sql, clientIds);
  const stagesByClient = {};
  rows.forEach(r => {
    if (!stagesByClient[r.client_id]) stagesByClient[r.client_id] = [];
    stagesByClient[r.client_id].push(r);
  });
  return stagesByClient;
}

/**
 * Find all clients with dynamic filters, sorting, and pagination
 */
async function findAll(options = {}) {
  const {
    search = '',
    service = 'all',
    va = 'all',
    status = 'all',
    sortBy = 'date-desc',
    page = 1,
    pageSize = 5
  } = options;

  let whereClauses = [];
  let params = [];

  const cleanSearch = (search || '').replace(/\+/g, ' ').trim();
  if (cleanSearch) {
    const q = `%${cleanSearch.toLowerCase()}%`;
    whereClauses.push(`(
      LOWER(c.client_name) LIKE ? OR 
      LOWER(c.service_type) LIKE ? OR 
      LOWER(COALESCE(c.contact_name, '')) LIKE ? OR
      EXISTS (
        SELECT 1 FROM pipeline_stages ps 
        WHERE ps.client_id = c.id AND (LOWER(ps.assigned_va_name) LIKE ? OR LOWER(ps.role_name) LIKE ?)
      )
    )`);
    params.push(q, q, q, q, q);
  }

  if (service !== 'all') {
    whereClauses.push('c.service_type = ?');
    params.push(service);
  }

  if (va !== 'all') {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM pipeline_stages ps 
      WHERE ps.client_id = c.id AND ps.assigned_va_name = ? AND (ps.status = 'active' OR ps.status = 'in_review')
    )`);
    params.push(va);
  }

  if (status === 'in_review') {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM pipeline_stages ps WHERE ps.client_id = c.id AND ps.status = 'in_review'
    )`);
  } else if (status === 'revision') {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM pipeline_stages ps WHERE ps.client_id = c.id AND ps.status = 'revision'
    )`);
  } else if (status === 'active') {
    whereClauses.push('c.percentage < 100');
  } else if (status === 'completed') {
    whereClauses.push('c.percentage >= 100');
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching
  const countRows = await db.query(
    `SELECT COUNT(*) AS total FROM clients c ${whereSql}`,
    params
  );
  const total = countRows[0] ? countRows[0].total : 0;

  // Sorting
  let orderBy = 'c.created_at DESC';
  if (sortBy === 'deadline-asc') {
    orderBy = 'c.deadline ASC';
  } else if (sortBy === 'name-asc') {
    orderBy = 'c.client_name ASC';
  } else if (sortBy === 'progress-desc') {
    orderBy = 'c.percentage DESC';
  } else if (sortBy === 'progress-asc') {
    orderBy = 'c.percentage ASC';
  }

  const offset = (Math.max(1, page) - 1) * pageSize;
  const clientRows = await db.query(
    `SELECT c.* FROM clients c ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const clientIds = clientRows.map(r => r.id);
  const stagesByClient = await fetchStagesForClientIds(clientIds);

  const items = clientRows.map(row => mapClientRow(row, stagesByClient[row.id] || []));
  return {
    items,
    total,
    page: Math.max(1, page),
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1
  };
}

/**
 * Find single client by ID (accepts numeric ID or "cli-123" format)
 */
async function findById(id) {
  const numericId = typeof id === 'string' && id.startsWith('cli-') 
    ? parseInt(id.replace('cli-', ''), 10) 
    : parseInt(id, 10);

  if (isNaN(numericId)) return null;

  const rows = await db.query('SELECT * FROM clients WHERE id = ?', [numericId]);
  if (rows.length === 0) return null;

  const stagesByClient = await fetchStagesForClientIds([numericId]);
  return mapClientRow(rows[0], stagesByClient[numericId] || []);
}

/**
 * Create a new Client, Pipeline, and Stages atomically
 */
async function createClientWithStages(clientData, creatorUserId = null) {
  return db.transaction(async (conn) => {
    // 1. Resolve service_id if available
    let serviceId = null;
    const [serviceRows] = await conn.query('SELECT id FROM services WHERE service_name = ?', [clientData.serviceType]);
    if (serviceRows.length > 0) {
      serviceId = serviceRows[0].id;
    }

    // 2. Default to 1 month deadline from now for all services if not explicitly provided
    let finalDeadline = clientData.deadline;
    if (!finalDeadline) {
      const oneMonth = new Date();
      oneMonth.setMonth(oneMonth.getMonth() + 1);
      finalDeadline = `${oneMonth.getFullYear()}-${String(oneMonth.getMonth() + 1).padStart(2, '0')}-${String(oneMonth.getDate()).padStart(2, '0')}`;
    }

    // Calculate percentage
    const stages = clientData.stages || [];
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const percentage = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0;

    // 3. Insert Client with 1-month automatic deadline
    const [clientResult] = await conn.query(
      `INSERT INTO clients (client_name, contact_name, industry, tier, service_id, service_type, deadline, percentage, notes, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientData.name,
        clientData.contact || null,
        clientData.industry || 'General',
        clientData.tier || 'growth',
        serviceId,
        clientData.serviceType,
        finalDeadline,
        percentage,
        clientData.notes || null,
        percentage >= 100 ? 'completed' : 'active',
        creatorUserId
      ]
    );

    const clientId = clientResult.insertId;

    // Insert Pipeline container
    const [pipeResult] = await conn.query(
      `INSERT INTO pipelines (client_id, pipeline_name, status, deadline)
       VALUES (?, ?, 'active', ?)`,
      [clientId, `${clientData.name} Pipeline`, finalDeadline]
    );
    const pipelineId = pipeResult.insertId;

    // 5. Insert Stages with individual task deadlines
    for (let i = 0; i < stages.length; i++) {
      const stg = stages[i];
      let assignedVaId = null;

      // Try matching VA by name in users table
      if (stg.vaName) {
        const [vaRows] = await conn.query('SELECT id FROM users WHERE LOWER(full_name) = LOWER(?)', [stg.vaName.trim()]);
        if (vaRows.length > 0) assignedVaId = vaRows[0].id;
      }

      const startedAt = (stg.status === 'active' || stg.status === 'in_review' || stg.status === 'completed') ? new Date() : null;
      const completedAt = stg.status === 'completed' ? new Date() : null;

      await conn.query(
        `INSERT INTO pipeline_stages (pipeline_id, client_id, stage_order, role_name, assigned_va_id, assigned_va_name, status, deadline, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pipelineId,
          clientId,
          i + 1,
          stg.role || 'Workflow Task',
          assignedVaId,
          stg.vaName || 'Unassigned',
          stg.status || 'queued',
          stg.deadline || null,
          startedAt,
          completedAt
        ]
      );

      // Insert Calendar event for specific VA task deadline
      if (stg.deadline) {
        await conn.query(
          `INSERT INTO calendar_events (title, description, start_date, event_type, client_id, service_type, created_by)
           VALUES (?, ?, ?, 'deadline', ?, ?, ?)`,
          [
            `${clientData.name} — ${stg.role || 'Task'} (${stg.vaName})`,
            `Task deadline assigned to Virtual Assistant: ${stg.vaName}.`,
            stg.deadline,
            clientId,
            clientData.serviceType,
            creatorUserId
          ]
        );
      }
    }

    // 6. Insert Overall Client Calendar Deadline Event
    await conn.query(
      `INSERT INTO calendar_events (title, description, start_date, event_type, client_id, service_type, created_by)
       VALUES (?, ?, ?, 'deadline', ?, ?, ?)`,
      [
        `${clientData.name} — Target Deadline`,
        `Deliverable deadline for ${clientData.serviceType}.`,
        finalDeadline,
        clientId,
        clientData.serviceType,
        creatorUserId
      ]
    );

    return clientId;
  });
}

/**
 * Update an existing Client and its Stages atomically
 */
async function updateClientWithStages(id, clientData) {
  const numericId = typeof id === 'string' && id.startsWith('cli-') 
    ? parseInt(id.replace('cli-', ''), 10) 
    : parseInt(id, 10);

  return db.transaction(async (conn) => {
    // 1. Resolve service_id if serviceType changed
    let serviceId = null;
    if (clientData.serviceType) {
      const [serviceRows] = await conn.query('SELECT id FROM services WHERE service_name = ?', [clientData.serviceType]);
      if (serviceRows.length > 0) serviceId = serviceRows[0].id;
    }

    // 2. Calculate percentage
    let percentage = null;
    if (clientData.stages) {
      const stages = clientData.stages;
      const completed = stages.filter(s => s.status === 'completed').length;
      percentage = stages.length > 0 ? Math.round((completed / stages.length) * 100) : 0;
    }

    // 3. Update Client row
    const clientFields = [];
    const clientParams = [];

    if (clientData.name !== undefined) { clientFields.push('client_name = ?'); clientParams.push(clientData.name); }
    if (clientData.contact !== undefined) { clientFields.push('contact_name = ?'); clientParams.push(clientData.contact); }
    if (clientData.serviceType !== undefined) { 
      clientFields.push('service_type = ?'); 
      clientParams.push(clientData.serviceType);
      if (serviceId) { clientFields.push('service_id = ?'); clientParams.push(serviceId); }
    }
    if (clientData.deadline !== undefined) { clientFields.push('deadline = ?'); clientParams.push(clientData.deadline); }
    if (clientData.notes !== undefined) { clientFields.push('notes = ?'); clientParams.push(clientData.notes); }
    if (percentage !== null) { 
      clientFields.push('percentage = ?'); 
      clientParams.push(percentage);
      clientFields.push('status = ?');
      clientParams.push(percentage >= 100 ? 'completed' : 'active');
    }

    if (clientFields.length > 0) {
      clientParams.push(numericId);
      await conn.query(`UPDATE clients SET ${clientFields.join(', ')} WHERE id = ?`, clientParams);
    }

    // 4. Update Pipeline deadline
    if (clientData.deadline) {
      await conn.query('UPDATE pipelines SET deadline = ? WHERE client_id = ?', [clientData.deadline, numericId]);
      await conn.query('UPDATE calendar_events SET start_date = ? WHERE client_id = ? AND event_type = ?', [clientData.deadline, numericId, 'deadline']);
    }

    // 5. If stages provided, replace pipeline stages cleanly
    if (clientData.stages && clientData.stages.length > 0) {
      const [pipeRows] = await conn.query('SELECT id FROM pipelines WHERE client_id = ?', [numericId]);
      const pipelineId = pipeRows.length > 0 ? pipeRows[0].id : null;

      // Delete old stages
      await conn.query('DELETE FROM pipeline_stages WHERE client_id = ?', [numericId]);

      for (let i = 0; i < clientData.stages.length; i++) {
        const stg = clientData.stages[i];
        let assignedVaId = null;
        if (stg.vaName) {
          const [vaRows] = await conn.query('SELECT id FROM users WHERE LOWER(full_name) = LOWER(?)', [stg.vaName.trim()]);
          if (vaRows.length > 0) assignedVaId = vaRows[0].id;
        }

        const startedAt = (stg.status === 'active' || stg.status === 'in_review' || stg.status === 'completed') ? new Date() : null;
        const completedAt = stg.status === 'completed' ? new Date() : null;

        await conn.query(
          `INSERT INTO pipeline_stages (pipeline_id, client_id, stage_order, role_name, assigned_va_id, assigned_va_name, status, deadline, started_at, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pipelineId,
            numericId,
            i + 1,
            stg.role || 'Workflow Task',
            assignedVaId,
            stg.vaName || 'Unassigned',
            stg.status || 'queued',
            stg.deadline || null,
            startedAt,
            completedAt
          ]
        );
      }
    }

    return numericId;
  });
}

/**
 * Delete a client by ID (cascades to pipelines, stages, deliverables, and calendar events)
 */
async function remove(id) {
  const numericId = typeof id === 'string' && id.startsWith('cli-') 
    ? parseInt(id.replace('cli-', ''), 10) 
    : parseInt(id, 10);

  const result = await db.query('DELETE FROM clients WHERE id = ?', [numericId]);
  return result.affectedRows > 0;
}

/**
 * Calculate accurate dashboard KPI metrics from real MySQL records
 */
async function getDashboardMetrics(currentVaUser = null) {
  // 1. Total and Active Clients
  const clientRows = await db.query('SELECT percentage FROM clients');
  const totalClients = clientRows.length;
  const activeClients = clientRows.filter(c => Number(c.percentage) < 100).length;
  const totalProgress = clientRows.reduce((sum, c) => sum + (Number(c.percentage) || 0), 0);
  const avgProgress = totalClients > 0 ? Math.round(totalProgress / totalClients) : 0;

  // 2. VAs in charge (distinct VAs assigned to active stages)
  const [inChargeRow] = await db.query(`
    SELECT COUNT(DISTINCT TRIM(assigned_va_name)) AS vas_in_charge
    FROM pipeline_stages
    WHERE status = 'active' AND assigned_va_name != '' AND assigned_va_name != 'Unassigned'
  `);
  const vasInCharge = inChargeRow ? inChargeRow.vas_in_charge : 0;

  // 3. Pending reviews and revisions count
  const [reviewCountRow] = await db.query(`
    SELECT 
      SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) AS pending_reviews,
      SUM(CASE WHEN status = 'revision' THEN 1 ELSE 0 END) AS needs_revision
    FROM pipeline_stages
  `);
  const pendingReviews = reviewCountRow && reviewCountRow.pending_reviews ? Number(reviewCountRow.pending_reviews) : 0;
  const needsRevision = reviewCountRow && reviewCountRow.needs_revision ? Number(reviewCountRow.needs_revision) : 0;

  // 4. Active tasks assigned to current VA
  let myActiveTasks = 0;
  if (currentVaUser) {
    const [myTasksRow] = await db.query(`
      SELECT COUNT(*) AS active_tasks
      FROM pipeline_stages
      WHERE LOWER(TRIM(assigned_va_name)) = LOWER(TRIM(?))
      AND status IN ('active', 'in_review', 'revision')
    `, [currentVaUser]);
    myActiveTasks = myTasksRow ? myTasksRow.active_tasks : 0;
  }

  return {
    activeClients,
    totalClients,
    vasInCharge,
    pendingReviews,
    needsRevision,
    avgProgress,
    myActiveTasks
  };
}

module.exports = {
  findAll,
  findById,
  createClientWithStages,
  updateClientWithStages,
  remove,
  getDashboardMetrics
};
