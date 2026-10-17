const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Huddle TrackOS — Full-Stack API Integration Test Suite', () => {
  let adminToken = '';
  let vaToken = '';
  let testClientId = '';
  let testStageId = '';
  let testDeliverableId = '';
  let testPingId = '';
  let testEventId = '';

  const uniqueSuffix = Date.now();
  const testVaEmail = `testva_${uniqueSuffix}@vatrack.io`;

  afterAll(async () => {
    // Clean up test data if needed and close database pool
    try {
      if (testClientId) {
        const numId = parseInt(testClientId.replace('cli-', ''), 10);
        await db.query('DELETE FROM clients WHERE id = ?', [numId]);
      }
      await db.query('DELETE FROM users WHERE email = ?', [testVaEmail]);
      await db.pool.end();
    } catch (err) {
      // ignore
    }
  });

  describe('1. Health Check & Database Connection', () => {
    it('GET /health returns 200 OK and database is connected', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');

      const isDbConnected = await db.testConnection();
      expect(isDbConnected).toBe(true);
    });
  });

  describe('2. Authentication & Authorization', () => {
    it('POST /api/v1/auth/login succeeds with seeded admin credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@vatrack.io',
          password: 'admin'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('admin');
      adminToken = res.body.data.token;
    });

    it('POST /api/v1/auth/login rejects invalid passwords with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@vatrack.io',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/register registers a new VA Specialist user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: `Elena Rostova ${uniqueSuffix}`,
          email: testVaEmail,
          password: 'Password123!',
          role: 'va'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('va');
      vaToken = res.body.data.token;
    });

    it('GET /api/v1/auth/me returns current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${vaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testVaEmail);
      expect(res.body.data.role).toBe('va');
    });

    it('Protected endpoints reject requests without a token with 401', async () => {
      const res = await request(app).get('/api/v1/clients');
      expect(res.status).toBe(401);
    });
  });

  describe('3. Role-Based Access Control (RBAC)', () => {
    it('POST /api/v1/clients fails with 403 Forbidden when called by a VA', async () => {
      const res = await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${vaToken}`)
        .send({
          name: 'Unauthorized Corp',
          serviceType: 'Social Growth',
          deadline: '2026-12-31'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Access denied|Forbidden/i);
    });

    it('POST /api/v1/users fails with 403 Forbidden when called by a VA', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${vaToken}`)
        .send({
          fullName: 'Test Hacker',
          email: 'hacker@test.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('4. Client CRUD & Pipeline Creation', () => {
    it('POST /api/v1/clients creates a client with multi-stage pipeline as Admin', async () => {
      const res = await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Apex Velocity Labs ${uniqueSuffix}`,
          contact: 'Dr. Sarah Connor',
          industry: 'Healthcare Technology',
          tier: 'enterprise',
          serviceType: 'Clinics Ops Standard',
          deadline: '2026-11-30',
          notes: 'High-priority clinical trial pipeline.',
          stages: [
            {
              role: 'HIPAA Intake Compliance',
              vaName: `Elena Rostova ${uniqueSuffix}`,
              status: 'active'
            },
            {
              role: 'EMR Synchronization',
              vaName: 'David Kim',
              status: 'queued'
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(`Apex Velocity Labs ${uniqueSuffix}`);
      expect(res.body.data.stages.length).toBe(2);
      expect(res.body.data.stages[0].status).toBe('active');

      testClientId = res.body.data.id;
      testStageId = res.body.data.stages[0].id;
    });

    it('GET /api/v1/clients returns paginated results and filters by search term', async () => {
      const res = await request(app)
        .get(`/api/v1/clients?search=${encodeURIComponent(`Apex Velocity Labs ${uniqueSuffix}`)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(testClientId);
    });

    it('GET /api/v1/clients/:id retrieves the detailed client record', async () => {
      const res = await request(app)
        .get(`/api/v1/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testClientId);
      expect(res.body.data.stages.length).toBe(2);
    });

    it('PATCH /api/v1/clients/:id updates client details', async () => {
      const res = await request(app)
        .patch(`/api/v1/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Updated priority notes for review board.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('Updated priority notes for review board.');
    });
  });

  describe('5. Dashboard Metrics Calculation', () => {
    it('GET /api/v1/dashboard/metrics computes accurate counts from MySQL', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('activeClients');
      expect(res.body.data).toHaveProperty('totalClients');
      expect(res.body.data).toHaveProperty('vasInCharge');
      expect(res.body.data).toHaveProperty('pendingReviews');
      expect(res.body.data).toHaveProperty('avgProgress');
      expect(typeof res.body.data.activeClients).toBe('number');
    });
  });

  describe('6. VA Deliverable Submission & Stage Transitions', () => {
    it('POST /api/v1/deliverables/submit submits proof report and moves stage to in_review', async () => {
      const res = await request(app)
        .post('/api/v1/deliverables/submit')
        .set('Authorization', `Bearer ${vaToken}`)
        .field('stageId', testStageId)
        .field('reportText', 'Completed HIPAA verification checklists and patient consent records.')
        .field('externalLink', 'https://drive.google.com/test-hipaa-audit');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.reportText).toContain('HIPAA verification');

      testDeliverableId = res.body.data.id;

      // Verify client stage is now in_review
      const clientRes = await request(app)
        .get(`/api/v1/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const stage = clientRes.body.data.stages.find(s => s.id === testStageId);
      expect(stage.status).toBe('in_review');
    });

    it('GET /api/v1/deliverables lists pending deliverables for QA queue', async () => {
      const res = await request(app)
        .get('/api/v1/deliverables?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const found = res.body.data.find(d => d.id === testDeliverableId);
      expect(found).toBeDefined();
    });
  });

  describe('7. Admin QA Review & Automated Pipeline Progression', () => {
    it('POST /api/v1/reviews approves deliverable, completes stage 1, and activates stage 2', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          deliverableId: testDeliverableId,
          decision: 'approved',
          feedback: 'Exemplary HIPAA documentation. Approved for stage 2 handoff.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify client progress and stage states
      const clientRes = await request(app)
        .get(`/api/v1/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const stages = clientRes.body.data.stages;
      expect(stages[0].status).toBe('completed');
      expect(stages[1].status).toBe('active'); // Automated handoff to next stage!
      expect(clientRes.body.data.percentage).toBe(50); // 1 of 2 stages completed = 50%
    });
  });

  describe('8. Calendar & VA Ping Notifications', () => {
    it('POST /api/v1/calendar creates a calendar event', async () => {
      const res = await request(app)
        .post('/api/v1/calendar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Executive QBR ${uniqueSuffix}`,
          description: 'Quarterly review with Apex leadership',
          startDate: '2026-11-15',
          eventType: 'meeting'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toContain('Executive QBR');
      testEventId = res.body.data.id;
    });

    it('GET /api/v1/calendar retrieves events and client deadlines', async () => {
      const res = await request(app)
        .get('/api/v1/calendar')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find(e => e.id === testEventId);
      expect(found).toBeDefined();
    });

    it('POST /api/v1/pings sends a priority check-in alert to a VA', async () => {
      const res = await request(app)
        .post('/api/v1/pings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          stageId: testStageId,
          targetVaName: `Elena Rostova ${uniqueSuffix}`,
          message: 'Please review incoming stage handoff requirements.',
          isUrgent: true
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isUrgent).toBe(true);
      testPingId = res.body.data.id;
    });

    it('GET /api/v1/pings/unread-count returns unread count for VA', async () => {
      const res = await request(app)
        .get('/api/v1/pings/unread-count')
        .set('Authorization', `Bearer ${vaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /api/v1/pings/:id/read marks ping alert as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/pings/${testPingId}/read`)
        .set('Authorization', `Bearer ${vaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Marked as read');
    });
  });

  describe('9. Activity Audit Trail', () => {
    it('GET /api/v1/activity lists audit records for client creation, submission, approval, and pings', async () => {
      const res = await request(app)
        .get('/api/v1/activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const types = res.body.data.map(a => a.type);
      expect(types).toContain('lifecycle');
      expect(types).toContain('submission');
      expect(types).toContain('approval');
    });

    it('GET /api/v1/activity/export/json exports audit logs as JSON file', async () => {
      const res = await request(app)
        .get('/api/v1/activity/export/json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('GET /api/v1/activity scopes results for VA Specialists to their assigned client team', async () => {
      const res = await request(app)
        .get('/api/v1/activity')
        .set('Authorization', `Bearer ${vaToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Elena is not assigned to testClient, so testClient activities must NOT leak into Elena's feed
      const clientIds = res.body.data.map(a => a.clientId).filter(Boolean);
      expect(clientIds).not.toContain(testClientId);
    });
  });

  describe('10. Client Deletion & Cascade Clean-up', () => {
    it('DELETE /api/v1/clients/:id removes client and cascades to pipelines and stages', async () => {
      const res = await request(app)
        .delete(`/api/v1/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify client no longer exists
      const checkRes = await request(app)
        .get(`/api/v1/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkRes.status).toBe(404);
      testClientId = null; // Marked deleted
    });
  });
});
