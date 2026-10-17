require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/database');
const { hashPassword } = require('../src/utils/password.utils');

async function seed() {
  try {
    console.log('⚡ Seeding default testing accounts into MySQL (va_trackos)...');

    // 1. Admins
    const adminHash = await hashPassword('admin');
    const userPassHash = await hashPassword('Password123!');
    const vaPassHash = await hashPassword('password123');

    const accounts = [
      {
        fullName: 'System Administrator',
        email: 'admin@vatrack.io',
        passwordHash: adminHash,
        plainPassword: 'admin',
        role: 'admin',
        initials: 'AD'
      },
      {
        fullName: 'Canci Admin',
        email: 'canci@vatrack.io',
        passwordHash: userPassHash,
        plainPassword: 'Password123!',
        role: 'admin',
        initials: 'CA'
      },
      {
        fullName: 'Elena Rostova',
        email: 'elena@vatrack.io',
        passwordHash: vaPassHash,
        plainPassword: 'password123',
        role: 'va',
        initials: 'ER'
      },
      {
        fullName: 'Marcus Chen',
        email: 'marcus@vatrack.io',
        passwordHash: vaPassHash,
        plainPassword: 'password123',
        role: 'va',
        initials: 'MC'
      },
      {
        fullName: 'Sarah Jenkins',
        email: 'sarah@vatrack.io',
        passwordHash: vaPassHash,
        plainPassword: 'password123',
        role: 'va',
        initials: 'SJ'
      },
      {
        fullName: 'David Kim',
        email: 'david@vatrack.io',
        passwordHash: vaPassHash,
        plainPassword: 'password123',
        role: 'va',
        initials: 'DK'
      },
      {
        fullName: 'Aisha Patel',
        email: 'aisha@vatrack.io',
        passwordHash: vaPassHash,
        plainPassword: 'password123',
        role: 'va',
        initials: 'AP'
      }
    ];

    for (const acc of accounts) {
      const existing = await db.query('SELECT id FROM users WHERE email = ?', [acc.email]);
      if (existing.length === 0) {
        await db.query(
          `INSERT INTO users (full_name, email, password_hash, role, status, avatar_initials)
           VALUES (?, ?, ?, ?, 'active', ?)`,
          [acc.fullName, acc.email, acc.passwordHash, acc.role, acc.initials]
        );
        console.log(`✅ Inserted: ${acc.email} (${acc.role.toUpperCase()})`);
      } else {
        await db.query(
          `UPDATE users SET full_name = ?, password_hash = ?, role = ?, status = 'active', avatar_initials = ?
           WHERE id = ?`,
          [acc.fullName, acc.passwordHash, acc.role, acc.initials, existing[0].id]
        );
        console.log(`🔄 Updated: ${acc.email} (${acc.role.toUpperCase()})`);
      }
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  } finally {
    try {
      await db.pool.end();
    } catch (e) {}
  }
}

seed();
