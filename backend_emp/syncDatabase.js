const supabase = require('./db');
const bcrypt = require('bcryptjs');

const initialUsers = [
  {
    id: 5,
    name: 'Pasindu Buddhima',
    email: 'pasindu.buddhima@pwholdings.lk',
    department: 'IT',
    password: '123',
    initials: 'PB',
    status: 'Working',
    role: 'Admin',
    designation: 'Lead Software Engineer',
    emp_code: 'EMP001'
  },
  {
    id: 6,
    name: 'Hashan Chathuranga',
    email: 'hashan@pwholdings.lk',
    department: 'IT',
    password: '123',
    initials: 'HC',
    status: 'Working',
    role: 'Admin',
    designation: 'Senior System Administrator',
    emp_code: 'EMP002'
  },
  {
    id: 8,
    name: 'Dimath Jayasinghe',
    email: 'dimath@pwholdings.lk',
    department: 'IT',
    password: '123',
    initials: 'DJ',
    status: 'Working',
    role: 'Employee',
    designation: 'Software Engineer',
    emp_code: 'EMP003'
  },
  {
    id: 13,
    name: 'Channa Wanigasinghe',
    email: 'channa@pwholdings.lk',
    department: 'Operations',
    password: '123',
    initials: 'CW',
    status: 'Working',
    role: 'Admin',
    designation: 'Operations Director',
    emp_code: 'EMP004'
  },
  {
    id: 25,
    name: 'Nishani Amarasiri',
    email: 'nishani@pwholdings.lk',
    department: 'Finance',
    password: '123',
    initials: 'NA',
    status: 'Working',
    role: 'Admin',
    designation: 'HR & Finance Manager',
    emp_code: 'EMP005'
  }
];

async function syncDatabase() {
  console.log('🔄 Checking database connection and data sync...');
  try {
    for (const u of initialUsers) {
      const { data: existing, error: findErr } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', u.email);

      if (findErr) {
        console.warn(`Query warning for ${u.email}:`, findErr.message);
        continue;
      }

      if (existing && existing.length > 0) {
        console.log(`ℹ️ User ${u.email} already exists (ID: ${existing[0].id})`);
        continue;
      }

      const { data: inserted, error: insErr } = await supabase
        .from('users')
        .insert([{
          name: u.name,
          email: u.email,
          department: u.department,
          password: bcrypt.hashSync(u.password, 10),
          initials: u.initials,
          status: u.status,
          role: u.role
        }])
        .select();

      if (insErr) {
        console.error(`❌ Error inserting user ${u.email}:`, insErr.message);
      } else if (inserted && inserted.length > 0) {
        const newU = inserted[0];
        console.log(`✅ Created user ${newU.email} (ID: ${newU.id})`);

        await supabase.from('leave_balances').upsert({
          user_id: newU.id,
          total_days: 21.00,
          used_days: 0.00
        }, { onConflict: 'user_id' });
        console.log(`✅ Initialized leave balance for user ID ${newU.id}`);
      }
    }
    console.log('🎉 Database sync verification complete!');
  } catch (err) {
    console.error('Database sync failed:', err.message);
  }
}

if (require.main === module) {
  syncDatabase();
}

module.exports = { syncDatabase };
