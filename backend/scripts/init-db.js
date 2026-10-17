require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/database');
const { hashPassword } = require('../src/utils/password.utils');

async function initDb() {
  console.log('⚡ Initializing Huddle TrackOS database tables & seed data...');

  const tables = [
    `CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`full_name\` VARCHAR(100) NOT NULL,
      \`email\` VARCHAR(150) NOT NULL,
      \`password_hash\` VARCHAR(255) NOT NULL,
      \`role\` ENUM('admin', 'va') NOT NULL DEFAULT 'va',
      \`status\` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
      \`avatar_initials\` VARCHAR(4) DEFAULT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY \`uk_users_email\` (\`email\`),
      KEY \`idx_users_role\` (\`role\`),
      KEY \`idx_users_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`services\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`service_name\` VARCHAR(100) NOT NULL,
      \`slug\` VARCHAR(100) NOT NULL,
      \`description\` TEXT DEFAULT NULL,
      \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY \`uk_services_name\` (\`service_name\`),
      UNIQUE KEY \`uk_services_slug\` (\`slug\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`clients\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`client_name\` VARCHAR(150) NOT NULL,
      \`contact_name\` VARCHAR(100) DEFAULT NULL,
      \`industry\` VARCHAR(100) NOT NULL DEFAULT 'General',
      \`tier\` ENUM('starter', 'growth', 'enterprise') NOT NULL DEFAULT 'growth',
      \`service_id\` INT UNSIGNED DEFAULT NULL,
      \`service_type\` VARCHAR(100) NOT NULL,
      \`deadline\` DATE NOT NULL,
      \`percentage\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
      \`notes\` TEXT DEFAULT NULL,
      \`status\` ENUM('active', 'completed', 'in_review', 'revision', 'cancelled') NOT NULL DEFAULT 'active',
      \`created_by\` INT UNSIGNED DEFAULT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_clients_name\` (\`client_name\`),
      KEY \`idx_clients_service_id\` (\`service_id\`),
      KEY \`idx_clients_deadline\` (\`deadline\`),
      KEY \`idx_clients_status\` (\`status\`),
      KEY \`idx_clients_created_by\` (\`created_by\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`pipelines\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`client_id\` INT UNSIGNED NOT NULL,
      \`pipeline_name\` VARCHAR(150) NOT NULL,
      \`status\` ENUM('active', 'completed', 'paused') NOT NULL DEFAULT 'active',
      \`deadline\` DATE DEFAULT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY \`uk_pipelines_client_id\` (\`client_id\`),
      KEY \`idx_pipelines_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`pipeline_stages\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`pipeline_id\` INT UNSIGNED NOT NULL,
      \`client_id\` INT UNSIGNED NOT NULL,
      \`stage_order\` TINYINT UNSIGNED NOT NULL DEFAULT 1,
      \`role_name\` VARCHAR(150) NOT NULL,
      \`assigned_va_id\` INT UNSIGNED DEFAULT NULL,
      \`assigned_va_name\` VARCHAR(100) NOT NULL,
      \`status\` ENUM('queued', 'active', 'in_review', 'revision', 'completed') NOT NULL DEFAULT 'queued',
      \`deadline\` DATE NULL DEFAULT NULL,
      \`started_at\` TIMESTAMP NULL DEFAULT NULL,
      \`completed_at\` TIMESTAMP NULL DEFAULT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_stages_pipeline_id\` (\`pipeline_id\`),
      KEY \`idx_stages_client_id\` (\`client_id\`),
      KEY \`idx_stages_assigned_va_id\` (\`assigned_va_id\`),
      KEY \`idx_stages_status\` (\`status\`),
      KEY \`idx_stages_order\` (\`stage_order\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`tasks\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`client_id\` INT UNSIGNED NOT NULL,
      \`pipeline_stage_id\` INT UNSIGNED DEFAULT NULL,
      \`title\` VARCHAR(200) NOT NULL,
      \`description\` TEXT DEFAULT NULL,
      \`priority\` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
      \`status\` ENUM('queued', 'active', 'in_review', 'revision', 'completed') NOT NULL DEFAULT 'queued',
      \`deadline\` DATE DEFAULT NULL,
      \`assigned_va_id\` INT UNSIGNED DEFAULT NULL,
      \`created_by\` INT UNSIGNED DEFAULT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_tasks_client_id\` (\`client_id\`),
      KEY \`idx_tasks_stage_id\` (\`pipeline_stage_id\`),
      KEY \`idx_tasks_va_id\` (\`assigned_va_id\`),
      KEY \`idx_tasks_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`deliverables\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`task_id\` INT UNSIGNED DEFAULT NULL,
      \`pipeline_stage_id\` INT UNSIGNED NOT NULL,
      \`client_id\` INT UNSIGNED NOT NULL,
      \`submitted_by\` INT UNSIGNED NOT NULL,
      \`report_text\` TEXT NOT NULL,
      \`external_link\` VARCHAR(500) DEFAULT NULL,
      \`file_name\` VARCHAR(255) DEFAULT NULL,
      \`file_path\` VARCHAR(500) DEFAULT NULL,
      \`file_type\` VARCHAR(100) DEFAULT NULL,
      \`file_size\` INT UNSIGNED DEFAULT NULL,
      \`status\` ENUM('pending', 'approved', 'revision_requested') NOT NULL DEFAULT 'pending',
      \`submitted_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_deliverables_stage\` (\`pipeline_stage_id\`),
      KEY \`idx_deliverables_client\` (\`client_id\`),
      KEY \`idx_deliverables_submitter\` (\`submitted_by\`),
      KEY \`idx_deliverables_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`reviews\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`deliverable_id\` INT UNSIGNED NOT NULL,
      \`reviewer_id\` INT UNSIGNED NOT NULL,
      \`decision\` ENUM('approved', 'revision_requested') NOT NULL,
      \`feedback\` TEXT DEFAULT NULL,
      \`reviewed_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY \`idx_reviews_deliverable\` (\`deliverable_id\`),
      KEY \`idx_reviews_reviewer\` (\`reviewer_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`calendar_events\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`title\` VARCHAR(200) NOT NULL,
      \`description\` TEXT DEFAULT NULL,
      \`start_date\` DATE NOT NULL,
      \`end_date\` DATE DEFAULT NULL,
      \`event_type\` ENUM('deadline', 'milestone', 'meeting', 'review') NOT NULL DEFAULT 'deadline',
      \`client_id\` INT UNSIGNED DEFAULT NULL,
      \`service_type\` VARCHAR(100) DEFAULT NULL,
      \`created_by\` INT UNSIGNED DEFAULT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_cal_start_date\` (\`start_date\`),
      KEY \`idx_cal_client_id\` (\`client_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`pings\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`client_id\` INT UNSIGNED DEFAULT NULL,
      \`stage_id\` INT UNSIGNED DEFAULT NULL,
      \`sender_id\` INT UNSIGNED NOT NULL,
      \`target_va_id\` INT UNSIGNED DEFAULT NULL,
      \`target_va_name\` VARCHAR(100) NOT NULL,
      \`message\` TEXT NOT NULL,
      \`is_urgent\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`status\` ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY \`idx_pings_target_va\` (\`target_va_name\`),
      KEY \`idx_pings_status\` (\`status\`),
      KEY \`idx_pings_created_at\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`activity_logs\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`actor_id\` INT UNSIGNED DEFAULT NULL,
      \`actor_name\` VARCHAR(100) NOT NULL,
      \`actor_role\` VARCHAR(50) NOT NULL,
      \`action_type\` ENUM('submission', 'approval', 'revision', 'ping', 'lifecycle') NOT NULL,
      \`client_id\` INT UNSIGNED DEFAULT NULL,
      \`client_name\` VARCHAR(150) NOT NULL,
      \`stage_name\` VARCHAR(150) DEFAULT NULL,
      \`target_va\` VARCHAR(100) DEFAULT NULL,
      \`title\` VARCHAR(200) NOT NULL,
      \`summary\` TEXT DEFAULT NULL,
      \`details\` TEXT DEFAULT NULL,
      \`metadata_json\` JSON DEFAULT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY \`idx_act_type\` (\`action_type\`),
      KEY \`idx_act_client\` (\`client_name\`),
      KEY \`idx_act_va\` (\`target_va\`),
      KEY \`idx_act_created\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  for (const ddl of tables) {
    await db.query(ddl);
  }
  console.log('✅ All 11 MySQL tables verified / created.');

  // Seed default services if table is empty
  const [existingServices] = await db.query('SELECT COUNT(*) as count FROM services');
  if (existingServices && existingServices.count === 0) {
    console.log('🌱 Seeding initial agency service catalog...');
    await db.query(`
      INSERT INTO \`services\` (\`service_name\`, \`slug\`, \`description\`) VALUES
      ('Social Starter', 'social-starter', 'Essential social media management, baseline assets, and weekly curation.'),
      ('Social Growth', 'social-growth', 'High-velocity content production, engagement sprints, and multichannel outreach.'),
      ('Clinics Ops Lite', 'clinics-ops-lite', 'Core healthcare practice operations, patient intake workflows, and reminder automation.'),
      ('Clinics Ops Standard', 'clinics-ops-standard', 'Comprehensive clinic management, EMR synchronization, HIPAA-compliant intake, and billing audits.'),
      ('Foundation Bundle', 'foundation-bundle', 'Complete enterprise administrative onboarding, SOP documentation, and multi-VA pipeline allocation.');
    `);
    console.log('✅ Default services seeded.');
  }

  // Seed default users if users table has no admin
  const admins = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (!admins || admins.length === 0) {
    console.log('🌱 Seeding initial workspace accounts (Admin & VAs)...');
    const adminHash = await hashPassword('admin');
    const canciHash = await hashPassword('Password123!');
    const vaHash = await hashPassword('password123');

    const seedUsers = [
      ['System Administrator', 'admin@vatrack.io', adminHash, 'admin', 'active', 'AD'],
      ['Canci Admin', 'canci@vatrack.io', canciHash, 'admin', 'active', 'CA'],
      ['Elena Rostova', 'elena@vatrack.io', vaHash, 'va', 'active', 'ER'],
      ['Marcus Chen', 'marcus@vatrack.io', vaHash, 'va', 'active', 'MC'],
      ['Sarah Jenkins', 'sarah@vatrack.io', vaHash, 'va', 'active', 'SJ'],
      ['David Kim', 'david@vatrack.io', vaHash, 'va', 'active', 'DK'],
      ['Aisha Patel', 'aisha@vatrack.io', vaHash, 'va', 'active', 'AP']
    ];

    for (const u of seedUsers) {
      await db.query(
        'INSERT IGNORE INTO users (full_name, email, password_hash, role, status, avatar_initials) VALUES (?, ?, ?, ?, ?, ?)',
        u
      );
    }
    console.log('✅ Initial Admin and VA Specialist accounts seeded.');
  }

  console.log('🎉 Database initialization complete!');
}

if (require.main === module) {
  initDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Database initialization error:', err);
      process.exit(1);
    });
}

module.exports = { initDb };
