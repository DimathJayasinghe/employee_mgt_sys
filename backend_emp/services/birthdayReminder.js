let cron = null;
try {
  cron = require('node-cron');
} catch (e) {
  console.warn('node-cron module not found, using fallback timer for birthday reminders.');
}
const supabase = require('../db');
const { sendSystemEmail } = require('./backendService');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Colombo';

// Helper: Get date components in Asia/Colombo timezone
function getColomboNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());

  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10)
  };
}

// Helper: Get tomorrow's month and day in Asia/Colombo timezone
function getTomorrowColombo() {
  const now = new Date();
  // Add 24 hours
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(tomorrowDate);

  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);

  // Handle Feb 29 in non-leap years
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  if (month === 2 && day === 28 && !isLeapYear) {
    // Also include Feb 29 birthdays on Feb 28 in non-leap years
    return { year, month, day, checkFeb29: true };
  }

  return { year, month, day, checkFeb29: false };
}

// Helper: Normalize phone number to E.164 (e.g. 0775227748 -> 94775227748)
function normalizeE164(phoneStr) {
  if (!phoneStr) return null;
  const digits = String(phoneStr).replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('0')) {
    return '94' + digits.slice(1);
  } else if (digits.startsWith('94')) {
    return digits;
  }
  return digits;
}

// Meta WhatsApp Business Cloud API Provider (Isolated for easy swapping with Twilio)
async function sendWhatsAppMessage({ toPhone, employeeName, empCode, designation, birthdayDate }) {
  const e164Phone = normalizeE164(toPhone);
  if (!e164Phone) {
    console.warn(`[WhatsApp] Invalid phone number provided: ${toPhone}`);
    return { success: false, reason: 'Invalid phone number' };
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'employee_birthday_reminder';
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'en';

  if (!token || !phoneId) {
    console.log(`[WhatsApp Simulation] Would send template "${templateName}" to ${e164Phone} for employee ${employeeName} (API credentials missing)`);
    return { success: true, simulated: true };
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: e164Phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: employeeName || 'Employee' },
            { type: 'text', text: empCode || '-' },
            { type: 'text', text: designation || 'Team Member' },
            { type: 'text', text: birthdayDate || 'Tomorrow' }
          ]
        }
      ]
    }
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resData = await res.json();
    if (!res.ok) {
      console.warn(`[WhatsApp API Error] HTTP ${res.status}:`, resData?.error?.message || JSON.stringify(resData));
      return { success: false, error: resData?.error?.message };
    }

    console.log(`✅ [WhatsApp Sent] Message dispatched to ${e164Phone} for ${employeeName}`);
    return { success: true, messageId: resData?.messages?.[0]?.id };
  } catch (err) {
    console.warn(`[WhatsApp Network Error] ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Atomically check or log sent reminder to prevent duplicate sends
async function tryLogReminder(employeeId, recipient, channel, sentYear) {
  try {
    const { data, error } = await supabase
      .from('birthday_reminder_logs')
      .insert([{
        employee_id: employeeId,
        recipient: recipient,
        channel: channel,
        sent_year: sentYear
      }]);

    if (error) {
      if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
        return false; // Already sent
      }
      console.warn('[Log Insert Warning]', error.message);
      return true; // Fallback to proceed if table is soft-failing
    }
    return true; // Successfully logged
  } catch (err) {
    console.warn('[Log Exception]', err.message);
    return true;
  }
}

// Core Birthday Reminder Executor
async function processBirthdayReminders({ testEmployeeId = null, force = false } = {}) {
  const tomorrow = getTomorrowColombo();
  const currentYear = tomorrow.year;

  console.log(`[Birthday Check] Checking birthdays for tomorrow (${tomorrow.year}-${tomorrow.month}-${tomorrow.day})...`);

  // 1. Fetch Birthday Employees
  let query = supabase.from('users').select('id, name, emp_code, designation, dob, department, phone, email');
  
  if (testEmployeeId) {
    query = query.eq('id', testEmployeeId);
  }

  const { data: users, error } = await query;
  if (error || !users) {
    console.error('Failed to query users for birthday check:', error?.message);
    return { processed: 0, sent: 0 };
  }

  // Filter users whose dob matches tomorrow's month & day
  const birthdayEmps = users.filter(u => {
    if (!u.dob) return false;
    const parts = u.dob.split('T')[0].split('-');
    if (parts.length < 3) return false;
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);

    if (m === tomorrow.month && d === tomorrow.day) return true;
    if (tomorrow.checkFeb29 && m === 2 && d === 29) return true;
    return false;
  });

  if (birthdayEmps.length === 0) {
    console.log('No employee birthdays tomorrow.');
    return { processed: 0, sent: 0 };
  }

  console.log(`Found ${birthdayEmps.length} employee(s) celebrating birthdays tomorrow!`);

  // 2. Fetch Admin / Main Employee Recipients
  const { data: admins } = await supabase
    .from('users')
    .select('id, name, email, phone, role')
    .eq('role', 'Admin');

  const fallbackEmail = process.env.BIRTHDAY_NOTIFY_TO || process.env.ADMIN_EMAIL || '';
  const recipientList = (admins && admins.length > 0) 
    ? admins 
    : (fallbackEmail ? [{ email: fallbackEmail, phone: null, name: 'Admin' }] : []);

  let totalSent = 0;

  for (const emp of birthdayEmps) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const parts = emp.dob.split('T')[0].split('-');
    const dateFormatted = `${parseInt(parts[2], 10)} ${monthNames[parseInt(parts[1], 10) - 1]}`;

    for (const recipient of recipientList) {
      const recipientKey = recipient.email || recipient.phone || 'admin';

      // --- A. EMAIL REMINDER ---
      if (recipient.email) {
        const canSendEmail = force || await tryLogReminder(emp.id, recipient.email, 'email', currentYear);
        if (canSendEmail) {
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="background-color: #022851; padding: 20px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 22px;">🎉 Birthday Tomorrow Alert</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">P W Holdings Employee Portal</p>
              </div>
              <p style="font-size: 14px; color: #1e293b; line-height: 1.5;">Dear <strong>${recipient.name || 'Admin'}</strong>,</p>
              <p style="font-size: 14px; color: #334155; line-height: 1.5;">
                This is a reminder that <strong>${emp.name}</strong> (${emp.designation || 'Team Member'}) is celebrating their birthday tomorrow, <strong>${dateFormatted}</strong>!
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; font-weight: bold; width: 35%;">Employee Name:</td><td style="padding: 10px 14px; color: #022851; font-weight: bold;">${emp.name}</td></tr>
                <tr><td style="padding: 10px 14px; font-weight: bold;">Employee Code:</td><td style="padding: 10px 14px;">${emp.emp_code || '-'}</td></tr>
                <tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; font-weight: bold;">Department:</td><td style="padding: 10px 14px;">${emp.department || '-'}</td></tr>
                <tr><td style="padding: 10px 14px; font-weight: bold;">Birthday Date:</td><td style="padding: 10px 14px; color: #dc2626; font-weight: bold;">${dateFormatted}</td></tr>
              </table>
              <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
                Automated notification from P W Holdings Employee Management System.
              </p>
            </div>
          `;

          await sendSystemEmail({
            to: recipient.email,
            subject: `🎂 Birthday Tomorrow: ${emp.name} (${dateFormatted})`,
            html: htmlContent
          });
          totalSent++;
        }
      }

      // --- B. WHATSAPP REMINDER ---
      if (recipient.phone) {
        const canSendWA = force || await tryLogReminder(emp.id, recipient.phone, 'whatsapp', currentYear);
        if (canSendWA) {
          await sendWhatsAppMessage({
            toPhone: recipient.phone,
            employeeName: emp.name,
            empCode: emp.emp_code,
            designation: emp.designation,
            birthdayDate: dateFormatted
          });
          totalSent++;
        }
      }
    }
  }

  return { processed: birthdayEmps.length, sent: totalSent };
}

// Schedule daily cron job at 12:00 Asia/Colombo time
function initBirthdayCron() {
  console.log('Initializing Birthday Reminder Cron (Daily at 12:00 Asia/Colombo)...');
  if (cron && typeof cron.schedule === 'function') {
    cron.schedule('0 12 * * *', async () => {
      console.log('[Cron Triggered] Running daily 12:00 birthday check...');
      try {
        await processBirthdayReminders();
      } catch (err) {
        console.error('[Birthday Cron Error]', err);
      }
    }, {
      timezone: TIMEZONE
    });
  } else {
    // Fallback timer: check every hour
    setInterval(async () => {
      const now = getColomboNow();
      if (now.hour === 12 && now.minute < 5) {
        try {
          await processBirthdayReminders();
        } catch (err) {
          console.error('[Birthday Timer Fallback Error]', err);
        }
      }
    }, 60 * 60 * 1000);
  }
}

module.exports = {
  initBirthdayCron,
  processBirthdayReminders,
  sendWhatsAppMessage
};
