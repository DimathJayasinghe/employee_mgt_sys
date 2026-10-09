const supabase = require('./db');
const bcrypt = require('bcryptjs');

let isDbConnected = false;

/**
 * Automatically inspects users table for unhashed/seeded passwords
 * and safely upgrades them to strong bcrypt hashes.
 */
async function migrateUnhashedPasswords() {
  try {
    const { data: users, error } = await supabase.from('users').select('id, email, password');
    if (error || !users) return;

    for (const u of users) {
      const isBcrypt = u.password && (
        u.password.startsWith('$2a$') || 
        u.password.startsWith('$2b$') || 
        u.password.startsWith('$2y$')
      );

      if (!isBcrypt && u.password && typeof u.password === 'string' && u.password.trim() !== '') {
        const hashedPassword = bcrypt.hashSync(u.password.trim(), 10);
        await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', u.id);
        console.log(`[Security] Migrated unhashed password for ${u.email} (ID ${u.id}) to bcrypt`);
      }
    }
  } catch (err) {
    console.warn('[Security] Automated password hashing check warning:', err.message);
  }
}

async function initDatabase() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    isDbConnected = true;
    console.log('Connected to Supabase Database successfully.');
    
    // Asynchronously run password migration check without blocking server startup
    migrateUnhashedPasswords().catch(() => {});
    return true;
  } catch (err) {
    isDbConnected = false;
    console.warn('Supabase Connection Warning:', err.message);
    return false;
  }
}

module.exports = {
  initDatabase,
  getIsDbConnected: () => isDbConnected
};
