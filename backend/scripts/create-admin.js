require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const userRepo = require('../src/repositories/user.repository');
const { hashPassword } = require('../src/utils/password.utils');
const db = require('../src/config/database');

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || 'admin@vatrack.io').trim().toLowerCase();
  const password = args[1] || 'admin';
  const fullName = args[2] || 'System Administrator';

  try {
    console.log(`⚡ Creating or updating Admin account: ${email}...`);

    const passwordHash = await hashPassword(password);
    const avatarInitials = fullName
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const existing = await userRepo.findByEmail(email);

    if (existing) {
      await userRepo.update(existing.id, {
        fullName,
        passwordHash,
        role: 'admin',
        status: 'active',
        avatarInitials
      });
      console.log(`✅ Existing user "${email}" updated to Admin status with password: "${password}"`);
    } else {
      const created = await userRepo.create({
        fullName,
        email,
        passwordHash,
        role: 'admin',
        avatarInitials
      });
      console.log(`✅ New Admin user created successfully (ID: ${created.id})!`);
    }

    console.log('----------------------------------------------------');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👑 Role:     admin`);
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create admin account:', err.message);
    process.exit(1);
  } finally {
    try {
      await db.pool.end();
    } catch (e) {}
  }
}

main();
