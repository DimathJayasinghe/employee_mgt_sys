const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function convertToCsv(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(item => {
    return headers.map(header => {
      let val = item[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

function escapeSqlVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return val;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function convertToSqlInserts(tableName, data) {
  if (!data || data.length === 0) return `-- No records for ${tableName}\n`;
  const headers = Object.keys(data[0]);
  const lines = data.map(row => {
    const vals = headers.map(h => escapeSqlVal(row[h])).join(', ');
    return `INSERT INTO "${tableName}" (${headers.map(h => `"${h}"`).join(', ')}) VALUES (${vals});`;
  });
  return `-- Table: ${tableName} (${data.length} records)\n` + lines.join('\n') + '\n\n';
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFolder = path.join(__dirname, 'backups', `backup_${timestamp}`);
  fs.mkdirSync(backupFolder, { recursive: true });

  const tables = ['users', 'leave_requests', 'daily_work_entries', 'leave_balances'];
  const summary = {
    backup_date: new Date().toISOString(),
    supabase_url: supabaseUrl,
    tables: {}
  };

  let fullSqlDump = `-- Full Database Backup\n-- Date: ${new Date().toISOString()}\n-- Source: ${supabaseUrl}\n\n`;

  console.log(`\n📦 Starting complete database backup to:\n📁 ${backupFolder}\n`);

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.error(`❌ Failed to fetch table ${table}: ${error.message}`);
        summary.tables[table] = { status: 'error', error: error.message };
        continue;
      }

      const count = data ? data.length : 0;
      summary.tables[table] = { status: 'success', count: count };

      // 1. Save JSON
      fs.writeFileSync(path.join(backupFolder, `${table}.json`), JSON.stringify(data, null, 2));

      // 2. Save CSV (Excel friendly)
      fs.writeFileSync(path.join(backupFolder, `${table}.csv`), convertToCsv(data));

      // 3. Append to SQL dump
      fullSqlDump += convertToSqlInserts(table, data);

      console.log(`✅ Table "${table}": ${count} records exported (JSON + CSV)`);
    } catch (err) {
      console.error(`❌ Unexpected error on table ${table}:`, err.message);
    }
  }

  // Write full SQL dump & metadata summary
  fs.writeFileSync(path.join(backupFolder, 'database_dump.sql'), fullSqlDump);
  fs.writeFileSync(path.join(backupFolder, 'backup_summary.json'), JSON.stringify(summary, null, 2));

  // Also write/update a latest symlink or copy to "backups/latest"
  const latestFolder = path.join(__dirname, 'backups', 'latest');
  fs.mkdirSync(latestFolder, { recursive: true });
  for (const table of tables) {
    if (fs.existsSync(path.join(backupFolder, `${table}.json`))) {
      fs.copyFileSync(path.join(backupFolder, `${table}.json`), path.join(latestFolder, `${table}.json`));
      fs.copyFileSync(path.join(backupFolder, `${table}.csv`), path.join(latestFolder, `${table}.csv`));
    }
  }
  fs.copyFileSync(path.join(backupFolder, 'database_dump.sql'), path.join(latestFolder, 'database_dump.sql'));
  fs.copyFileSync(path.join(backupFolder, 'backup_summary.json'), path.join(latestFolder, 'backup_summary.json'));

  console.log(`\n🎉 Backup complete!\n📄 Files created:`);
  console.log(`   - JSON files (users.json, leave_requests.json, daily_work_entries.json, leave_balances.json)`);
  console.log(`   - CSV spreadsheets for Excel/Sheets (*.csv)`);
  console.log(`   - SQL restore dump (database_dump.sql)`);
  console.log(`   - Summary manifest (backup_summary.json)`);
  console.log(`\n📍 Backup path: ${backupFolder}`);
  console.log(`📍 Latest copy: ${latestFolder}\n`);
}

runBackup();
