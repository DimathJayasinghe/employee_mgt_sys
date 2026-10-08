const supabase = require('./db');

let isDbConnected = false;

async function initDatabase() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    isDbConnected = true;
    console.log('Connected to Supabase Database successfully.');
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
