const cron = require('node-cron');
const { adminService, sendSystemEmail } = require('./backendService');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Colombo';
const DEFAULT_TO_EMAIL = process.env.BACKUP_EMAIL_TO || 'hashan@pwholdings.lk';
const DEFAULT_CC_EMAIL = process.env.BACKUP_EMAIL_CC || 'pasindu.buddhima@pwholdings.lk';

// Track last sent date to avoid double sending on server restart/fallback
let lastSentDateStr = null;

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

  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    timeStr: `${map.hour}:${map.minute}:${map.second}`,
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10),
    formattedReadable: `${map.day}/${map.month}/${map.year} at ${map.hour}:${map.minute}:${map.second} (Asia/Colombo)`
  };
}

/**
 * Generate database backup and send JSON attachment via email
 */
async function sendDailyBackupEmail({ to = DEFAULT_TO_EMAIL, cc = DEFAULT_CC_EMAIL, isManual = false } = {}) {
  const { dateStr, formattedReadable } = getColomboDateTime();
  console.log(`\n📦 [Backup Engine] ${isManual ? 'Manual' : 'Scheduled'} database backup process started...`);

  try {
    // 1. Generate complete database backup object
    const backupData = await adminService.generateFullBackup();
    const jsonContent = JSON.stringify(backupData, null, 2);
    const filename = `supabase_database_backup_${dateStr}.json`;

    // 2. Compute table stats summary for HTML email
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

    // 3. Build HTML email template
    const subject = `📦 Daily Automated Database Backup - P W Holdings (${dateStr})`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 16px; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #022851; padding: 20px 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">💾 Database Backup Notification</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">P W Holdings Employee Management System</p>
        </div>

        <p style="font-size: 14px; color: #1e293b; line-height: 1.6;">
          Hello <strong>Hashan & Team</strong>,
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Attached to this email is the <strong>daily automatic backup</strong> of your Supabase Database for <strong>${dateStr}</strong>.
        </p>

        <!-- Backup Overview Box -->
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

        <!-- Table Breakdown -->
        <h3 style="font-size: 14px; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">📊 Database Tables Export Summary</h3>
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

        <!-- Security Note -->
        <div style="margin-top: 24px; padding: 12px 16px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; font-size: 12px; color: #713f12; line-height: 1.5;">
          🔒 <strong>Security & Compliance Notice:</strong> This file contains sensitive system records (passwords are stripped for security). Please store backup files securely.
        </div>

        <!-- Footer -->
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px;">
          This is an automated system message generated daily after 6:00 PM.<br/>
          © P W Holdings (Pvt) Ltd. All rights reserved.
        </p>
      </div>
    `;

    // 4. Dispatch Email with JSON Attachment
    const dispatchResult = await sendSystemEmail({
      to,
      cc,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename,
          content: jsonContent,
          contentType: 'application/json'
        }
      ]
    });

    if (dispatchResult.success) {
      lastSentDateStr = dateStr;
      console.log(`✅ [Backup Engine] Daily backup email successfully sent to ${to} (CC: ${cc}) with attachment ${filename}`);
      return { success: true, filename, fileSizeKb, totalRecords, dateStr };
    } else {
      console.warn(`⚠️ [Backup Engine] Email dispatch failed or returned false.`);
      return { success: false, reason: 'Email dispatch failed' };
    }

  } catch (err) {
    console.error('❌ [Backup Engine Error] Exception during daily backup generation/email dispatch:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Initialize Automatic Daily Cron Job at 6:00 PM (18:00 Asia/Colombo timezone)
 */
function initBackupCron() {
  console.log('⏰ Initializing Automatic Daily Backup Cron Job (Every day at 18:00 / 6:00 PM Asia/Colombo)...');

  // Cron schedule for 6:00 PM Sri Lanka time: "0 18 * * *"
  try {
    cron.schedule('0 18 * * *', async () => {
      console.log('🔔 [Cron Trigger] Running scheduled 6:00 PM database backup email task...');
      await sendDailyBackupEmail();
    }, {
      timezone: TIMEZONE
    });
    console.log(`✅ Daily Backup Cron active for timezone: ${TIMEZONE} at 18:00 (6:00 PM)`);
  } catch (err) {
    console.warn('⚠️ node-cron schedule setup failed, falling back to interval checker:', err.message);
  }

  // Backup timer fallback check every 30 minutes
  setInterval(async () => {
    const { dateStr, hour } = getColomboDateTime();
    if (hour >= 18 && lastSentDateStr !== dateStr) {
      console.log(`[Backup Fallback Check] Time is after 6:00 PM (${hour}:00) and backup not sent today (${dateStr}). Executing now...`);
      await sendDailyBackupEmail();
    }
  }, 30 * 60 * 1000);
}

module.exports = {
  initBackupCron,
  sendDailyBackupEmail
};
