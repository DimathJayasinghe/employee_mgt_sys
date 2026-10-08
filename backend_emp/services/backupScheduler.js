let cron = null;
try {
  cron = require('node-cron');
} catch (e) {
  console.warn('node-cron module not found, using fallback interval timer for backup scheduler.');
}
const { adminService, sendSystemEmail } = require('./backendService');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Colombo';
const DAILY_BACKUP_TO_EMAIL = process.env.BACKUP_EMAIL_TO || 'pasindu.buddhima@pwholdings.lk';
const MONTHLY_BACKUP_TO_EMAIL = process.env.MONTHLY_BACKUP_EMAIL_TO || 'hashan@pwholdings.lk';

// Track last sent dates to avoid double sending on server restart/fallback
let lastDailySentDateStr = null;
let lastMonthlySentDateStr = null;

// Helper: Get Asia/Colombo timezone date string YYYY-MM-DD and time
function getColomboDateTime() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now);

  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);

  // The 0th day of next month gives the last day of current month
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const isLastDayOfMonth = (day === lastDayOfMonth);

  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    timeStr: `${map.hour}:${map.minute}:${map.second}`,
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10),
    day,
    month,
    year,
    isLastDayOfMonth,
    formattedReadable: `${map.day}/${map.month}/${map.year} at ${map.hour}:${map.minute}:${map.second} (Asia/Colombo)`
  };
}

/**
 * Generate database backup and send JSON attachment via email (DAILY to Pasindu)
 */
async function sendDailyBackupEmail({ to = DAILY_BACKUP_TO_EMAIL, cc = null, isManual = false } = {}) {
  const { dateStr, formattedReadable } = getColomboDateTime();
  console.log(`\n📦 [Daily Backup Engine] ${isManual ? 'Manual' : 'Scheduled 6 PM'} backup started for ${to}...`);

  try {
    const backupData = await adminService.generateFullBackup();
    const jsonContent = JSON.stringify(backupData, null, 2);
    const filename = `supabase_daily_backup_${dateStr}.json`;

    let tableRowsHtml = '';
    let totalRecords = 0;

    if (backupData && backupData.tables) {
      Object.keys(backupData.tables).forEach(tableName => {
        const tbl = backupData.tables[tableName];
        const count = tbl.record_count || 0;
        totalRecords += count;
        const statusBadge = tbl.status === 'success' 
          ? '<span style="color: #059669; font-weight: bold; background: #ecfdf5; padding: 2px 8px; border-radius: 4px;">Success</span>' 
          : '<span style="color: #dc2626; font-weight: bold; background: #fef2f2; padding: 2px 8px; border-radius: 4px;">Error</span>';

        tableRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-weight: 600; color: #1e293b;">${tableName}</td>
            <td style="padding: 10px 14px; text-align: center;">${count.toLocaleString()}</td>
            <td style="padding: 10px 14px; text-align: center;">${statusBadge}</td>
          </tr>
        `;
      });
    }

    const fileSizeKb = (Buffer.byteLength(jsonContent, 'utf8') / 1024).toFixed(2);

    const subject = `📦 Daily Automated Database Backup - P W Holdings (${dateStr})`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 16px; background-color: #ffffff;">
        <div style="background-color: #022851; padding: 20px 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">💾 Daily Database Backup Notification</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">P W Holdings Employee Management System</p>
        </div>

        <p style="font-size: 14px; color: #1e293b; line-height: 1.6;">
          Hello <strong>Pasindu</strong>,
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Attached to this email is the <strong>daily automatic backup</strong> of your Supabase Database for <strong>${dateStr}</strong>.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; color: #022851; text-transform: uppercase; letter-spacing: 0.5px;">
            📌 Backup Details
          </h3>
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 40%;">Timestamp:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${formattedReadable}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Attached File:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #2563eb;">${filename}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">File Size:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${fileSizeKb} KB</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Total Records Exported:</td>
              <td style="padding: 4px 0; font-weight: 700; color: #059669;">${totalRecords.toLocaleString()} records</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 14px; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">📊 Database Tables Summary</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; text-align: left;">
              <th style="padding: 10px 14px;">Table Name</th>
              <th style="padding: 10px 14px; text-align: center;">Records</th>
              <th style="padding: 10px 14px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 24px; padding: 12px 16px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; font-size: 12px; color: #713f12; line-height: 1.5;">
          🔒 <strong>Security & Compliance Notice:</strong> Passwords are stripped for security. Please store backup files securely.
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px;">
          Daily Automated Backup System Message (6:00 PM Asia/Colombo).<br/>
          © P W Holdings (Pvt) Ltd.
        </p>
      </div>
    `;

    const dispatchResult = await sendSystemEmail({
      to,
      cc,
      subject,
      html: htmlContent,
      attachments: [{ filename, content: jsonContent, contentType: 'application/json' }]
    });

    if (dispatchResult.success) {
      lastDailySentDateStr = dateStr;
      console.log(`✅ [Daily Backup Engine] Daily backup email sent to Pasindu (${to}) with attachment ${filename}`);
      return { success: true, filename, fileSizeKb, totalRecords, dateStr };
    }
    return { success: false, reason: 'Email dispatch failed' };
  } catch (err) {
    console.error('❌ [Daily Backup Error]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate database backup and send JSON attachment via email (MONTHLY to Hashan on last day of month)
 */
async function sendMonthlyBackupEmail({ to = MONTHLY_BACKUP_TO_EMAIL, isManual = false } = {}) {
  const { dateStr, formattedReadable } = getColomboDateTime();
  console.log(`\n🗓️ [Monthly Backup Engine] ${isManual ? 'Manual' : 'Scheduled Last-Day-Of-Month 6 PM'} backup started for Hashan (${to})...`);

  try {
    const backupData = await adminService.generateFullBackup();
    const jsonContent = JSON.stringify(backupData, null, 2);
    const filename = `supabase_monthly_backup_${dateStr}.json`;

    let tableRowsHtml = '';
    let totalRecords = 0;

    if (backupData && backupData.tables) {
      Object.keys(backupData.tables).forEach(tableName => {
        const tbl = backupData.tables[tableName];
        const count = tbl.record_count || 0;
        totalRecords += count;
        const statusBadge = tbl.status === 'success' 
          ? '<span style="color: #059669; font-weight: bold; background: #ecfdf5; padding: 2px 8px; border-radius: 4px;">Success</span>' 
          : '<span style="color: #dc2626; font-weight: bold; background: #fef2f2; padding: 2px 8px; border-radius: 4px;">Error</span>';

        tableRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-weight: 600; color: #1e293b;">${tableName}</td>
            <td style="padding: 10px 14px; text-align: center;">${count.toLocaleString()}</td>
            <td style="padding: 10px 14px; text-align: center;">${statusBadge}</td>
          </tr>
        `;
      });
    }

    const fileSizeKb = (Buffer.byteLength(jsonContent, 'utf8') / 1024).toFixed(2);

    const subject = `🗓️ Monthly Automated Database Backup - P W Holdings (${dateStr})`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 16px; background-color: #ffffff;">
        <div style="background-color: #022851; padding: 20px 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">🗓️ End-of-Month Database Backup</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">P W Holdings Employee Management System</p>
        </div>

        <p style="font-size: 14px; color: #1e293b; line-height: 1.6;">
          Hello <strong>Hashan</strong>,
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Attached to this email is your <strong>monthly automatic database backup</strong> for the end of month <strong>${dateStr}</strong>.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; color: #022851; text-transform: uppercase; letter-spacing: 0.5px;">
            📌 Monthly Backup Overview
          </h3>
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 40%;">Timestamp:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${formattedReadable}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Attached File:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #2563eb;">${filename}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">File Size:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${fileSizeKb} KB</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Total Records:</td>
              <td style="padding: 4px 0; font-weight: 700; color: #059669;">${totalRecords.toLocaleString()} records</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 14px; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">📊 Database Tables Summary</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; text-align: left;">
              <th style="padding: 10px 14px;">Table Name</th>
              <th style="padding: 10px 14px; text-align: center;">Records</th>
              <th style="padding: 10px 14px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 24px; padding: 12px 16px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; font-size: 12px; color: #713f12; line-height: 1.5;">
          🔒 <strong>Security Notice:</strong> Passwords are stripped for security. Please store backup files securely.
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px;">
          Monthly Automated Backup System Message (End of Month at 6:00 PM Asia/Colombo).<br/>
          © P W Holdings (Pvt) Ltd.
        </p>
      </div>
    `;

    const dispatchResult = await sendSystemEmail({
      to,
      subject,
      html: htmlContent,
      attachments: [{ filename, content: jsonContent, contentType: 'application/json' }]
    });

    if (dispatchResult.success) {
      lastMonthlySentDateStr = dateStr;
      console.log(`✅ [Monthly Backup Engine] Monthly backup email sent to Hashan (${to}) with attachment ${filename}`);
      return { success: true, filename, fileSizeKb, totalRecords, dateStr };
    }
    return { success: false, reason: 'Email dispatch failed' };
  } catch (err) {
    console.error('❌ [Monthly Backup Error]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Initialize Automatic Backup Cron Jobs
 * - Daily at 6:00 PM for Pasindu (pasindu.buddhima@pwholdings.lk)
 * - Monthly at 6:00 PM on the last day of month for Hashan (hashan@pwholdings.lk)
 */
function initBackupCron() {
  console.log('⏰ Initializing Automatic Backup Cron Jobs...');
  console.log('   • Daily Backup: 18:00 (6:00 PM) -> pasindu.buddhima@pwholdings.lk');
  console.log('   • Monthly Backup: 18:00 (6:00 PM) on Last Day of Month -> hashan@pwholdings.lk');

  try {
    cron.schedule('0 18 * * *', async () => {
      const colomboInfo = getColomboDateTime();
      console.log(`🔔 [Cron Trigger] Running 6:00 PM database backup tasks (${colomboInfo.dateStr})...`);

      // 1. Send Daily Backup to Pasindu
      await sendDailyBackupEmail();

      // 2. If today is the last day of the month, send Monthly Backup to Hashan
      if (colomboInfo.isLastDayOfMonth) {
        console.log(`🗓️ Today (${colomboInfo.dateStr}) is the last day of the month. Triggering Monthly Backup for Hashan...`);
        await sendMonthlyBackupEmail();
      }
    }, {
      timezone: TIMEZONE
    });
    console.log(`✅ Backup Crons active for timezone: ${TIMEZONE} at 18:00 (6:00 PM)`);
  } catch (err) {
    console.warn('⚠️ node-cron schedule setup failed, falling back to interval checker:', err.message);
  }

  // Backup timer fallback check every 30 minutes
  setInterval(async () => {
    const colomboInfo = getColomboDateTime();
    if (colomboInfo.hour >= 18) {
      if (lastDailySentDateStr !== colomboInfo.dateStr) {
        console.log(`[Backup Daily Fallback Check] Time is after 6:00 PM and daily backup not sent today (${colomboInfo.dateStr}). Executing...`);
        await sendDailyBackupEmail();
      }
      if (colomboInfo.isLastDayOfMonth && lastMonthlySentDateStr !== colomboInfo.dateStr) {
        console.log(`[Backup Monthly Fallback Check] Time is after 6:00 PM on last day of month and monthly backup not sent today (${colomboInfo.dateStr}). Executing...`);
        await sendMonthlyBackupEmail();
      }
    }
  }, 30 * 60 * 1000);
}

module.exports = {
  initBackupCron,
  sendDailyBackupEmail,
  sendMonthlyBackupEmail
};
