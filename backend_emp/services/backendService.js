const supabase = require('../db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pwholdings_secure_jwt_secret_key_2026';
const ADMIN_EMAILS = [
  'hashan@pwholdings.lk',
  'nishani@pwholdings.lk',
  'channa@pwholdings.lk',
  'pasindu.buddhima@pwholdings.lk'
];

// In-memory OTP storage: { [email]: { otp, expiresAt, type } }
const otpStore = {};

// Helper: Format YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Generate initials
function getInitials(name) {
  if (!name) return 'EP';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Helper: Format special recurring days
function formatSpecialDays(dayOfWeekStr) {
  if (!dayOfWeekStr) return 'Special Leave';
  const parts = dayOfWeekStr.split(',').map(p => p.trim());
  const formatted = parts.map(part => {
    if (part.includes(':')) {
      const [day, session] = part.split(':');
      return `${day.slice(0, 3)} (${session})`;
    }
    return part;
  });
  return formatted.join(', ');
}

// Helper: Format HH:MM:SS to 12-hour AM/PM
function formatTime12(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Helper: Determine active half-day session (Morning 8:30 AM - 12:30 PM, Evening 12:30 PM - 5:30 PM)
function getHalfDayDetails(activeLeave) {
  if (!activeLeave || activeLeave.leave_type !== 'Half Day') {
    return null;
  }

  let session = 'Morning';
  const text = `${activeLeave.special_session || ''} ${activeLeave.reason || ''} ${activeLeave.start_time || ''}`.toLowerCase();
  if (text.includes('evening') || text.includes('pm') || text.includes('12:30') || text.includes('afternoon')) {
    session = 'Evening';
  } else if (text.includes('morning') || text.includes('am') || text.includes('8:30')) {
    session = 'Morning';
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const cutoffMinutes = 12 * 60 + 30; // 12:30 PM
  const isMorningNow = currentMinutes < cutoffMinutes;

  const isLeaveNow = session === 'Morning' ? isMorningNow : !isMorningNow;

  return {
    is_half_day: true,
    half_day_session: session,
    half_day_leave_now: isLeaveNow,
    leave_time: session === 'Morning' ? '08:30 AM - 12:30 PM' : '12:30 PM - 05:30 PM',
    working_time: session === 'Morning' ? '12:30 PM - 05:30 PM' : '08:30 AM - 12:30 PM'
  };
}

// Helper: Determine active Short Leave time window (strictly <= 3 hours)
function getShortLeaveDetails(activeLeave) {
  if (!activeLeave || activeLeave.leave_type !== 'Short Leave') {
    return null;
  }

  let startTime = activeLeave.start_time || '09:00:00';
  let endTime = activeLeave.end_time || '11:30:00';

  if (!activeLeave.start_time && activeLeave.reason) {
    const match = activeLeave.reason.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (match) {
      startTime = match[1] + ':00';
      endTime = match[2] + ':00';
    }
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const startMinutes = (sH || 0) * 60 + (sM || 0);
  const endMinutes = (eH || 0) * 60 + (eM || 0);

  const isLeaveNow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  const durationHours = Math.max(0, (endMinutes - startMinutes) / 60).toFixed(1);

  const formattedStart = formatTime12(startTime);
  const formattedEnd = formatTime12(endTime);
  const timeRange = `${formattedStart} - ${formattedEnd}`;

  return {
    is_short_leave: true,
    short_leave_now: isLeaveNow,
    start_time: startTime,
    end_time: endTime,
    time_range: timeRange,
    leave_time: timeRange,
    duration_hours: durationHours
  };
}

// Helper: Determine leave cancellation eligibility based on strict business cutoffs
function getLeaveCancellationStatus(leave) {
  if (!leave) return { canCancel: false, isExpired: false, reason: 'Invalid leave request' };

  if (leave.status !== 'Pending' && leave.status !== 'Approved') {
    return { canCancel: false, isExpired: false, reason: `Leave is already ${leave.status}` };
  }

  const isSpecial = leave.leave_type === 'Special Leave';
  const isPowerCut = leave.leave_type === 'Power Cut';
  if (isSpecial || isPowerCut) {
    return { canCancel: true, isExpired: false, deadlineText: 'Anytime' };
  }

  const startDateStr = leave.start_date ? (typeof leave.start_date === 'string' ? leave.start_date.split('T')[0] : '') : '';
  if (!startDateStr) {
    return { canCancel: true, isExpired: false, deadlineText: 'Standard' };
  }

  let cutoffTimeStr = '08:30:00';
  let deadlineDesc = '8:30 AM on start date';

  if (leave.leave_type === 'Short Leave') {
    let sTime = leave.start_time || '09:00:00';
    if (!leave.start_time && leave.reason) {
      const match = leave.reason.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (match) sTime = match[1] + ':00';
    }
    cutoffTimeStr = sTime.length === 5 ? sTime + ':00' : sTime;
    deadlineDesc = `${sTime.slice(0, 5)} (start of Short Leave)`;
  } else if (leave.leave_type === 'Half Day') {
    const text = `${leave.special_session || ''} ${leave.reason || ''} ${leave.start_time || ''}`.toLowerCase();
    const isEvening = text.includes('evening') || text.includes('pm') || text.includes('12:30') || text.includes('afternoon');
    if (isEvening) {
      cutoffTimeStr = '12:30:00';
      deadlineDesc = '12:30 PM (start of Evening Session)';
    } else {
      cutoffTimeStr = '08:30:00';
      deadlineDesc = '8:30 AM (start of Morning Session)';
    }
  }

  const [year, month, day] = startDateStr.split('-').map(Number);
  const [hour, minute, second] = cutoffTimeStr.split(':').map(Number);
  const cutoffDate = new Date(year, month - 1, day, hour, minute || 0, second || 0);

  const now = new Date();
  if (now.getTime() > cutoffDate.getTime()) {
    return {
      canCancel: false,
      isExpired: true,
      reason: `Cancellation closed (must be cancelled before ${deadlineDesc} on ${startDateStr})`
    };
  }

  return {
    canCancel: true,
    isExpired: false,
    deadlineText: `Before ${deadlineDesc} on ${startDateStr}`
  };
}

// Unified Email Dispatcher supporting Resend API & SMTP
async function sendSystemEmail({ to, cc, subject, html }) {
  const resendApiKey = process.env.RESEND_API_KEY || (process.env.EMAIL_PASS?.startsWith('re_') ? process.env.EMAIL_PASS : null);
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'onboarding@resend.dev';

  // 1. Resend Direct HTTPS API (Fastest & recommended for serverless)
  if (resendApiKey) {
    try {
      const payload = {
        from: fromEmail.includes('<') ? fromEmail : `P W Holdings <${fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html
      };
      if (cc && (Array.isArray(cc) ? cc.length > 0 : Boolean(cc))) {
        payload.cc = Array.isArray(cc) ? cc : [cc];
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData?.message || JSON.stringify(resData));
      }
      console.log(`✅ [Resend API] Email sent successfully to ${to}. ID: ${resData?.id}`);
      return { success: true, id: resData?.id };
    } catch (err) {
      console.warn(`⚠️ Resend API send failed (${err.message}). Trying SMTP fallback...`);
    }
  }

  // 2. Fallback to Nodemailer SMTP (Gmail / Custom SMTP)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const isGmail = (process.env.EMAIL_USER || '').includes('@gmail.com') || (process.env.EMAIL_HOST || '').includes('gmail');
      const transporter = nodemailer.createTransport({
        service: isGmail ? 'gmail' : undefined,
        host: isGmail ? undefined : (process.env.EMAIL_HOST || 'smtp.gmail.com'),
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const info = await transporter.sendMail({
        from: `"P W Holdings System" <${process.env.EMAIL_USER}>`,
        to,
        cc,
        subject,
        html
      });
      console.log(`✅ [SMTP] Email sent to ${to}. MessageID: ${info.messageId}`);
      return { success: true, id: info.messageId };
    } catch (smtpErr) {
      console.warn(`⚠️ SMTP dispatch error:`, smtpErr.message);
    }
  }

  console.log(`[EMAIL DISPATCH NOTICE] No active mail credentials set. To: ${to}`);
  return { success: false };
}

// =============================================================
// AUTH SERVICE
// =============================================================
const authService = {
  async login(email, password) {
    if (!email || !password) throw new Error('Email and password are required');
    const cleanEmail = email.trim().toLowerCase();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, department, email, password, initials, status, role')
      .ilike('email', cleanEmail);

    if (error || !users || users.length === 0) {
      throw new Error('Invalid email address or password');
    }

    const user = users[0];
    if (user.password !== password) {
      throw new Error('Invalid email address or password');
    }

    if (ADMIN_EMAILS.includes(cleanEmail) && user.role !== 'Admin') {
      user.role = 'Admin';
      await supabase.from('users').update({ role: 'Admin' }).eq('id', user.id);
    }

    delete user.password;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return { user, token };
  },

  async sendOtp(email, type = 'register') {
    if (!email) throw new Error('Email address is required');
    const cleanEmail = email.trim().toLowerCase();

    if (type === 'register') {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .ilike('email', cleanEmail);

      if (existing && existing.length > 0) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
    } else if (type === 'reset-password') {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .ilike('email', cleanEmail);

      if (!existing || existing.length === 0) {
        throw new Error('No account found with this email address.');
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[cleanEmail] = {
      otp: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
      type: type
    };

    const isRegister = type === 'register';
    const subject = isRegister 
      ? 'Verify Your Email - P W Holdings Employee Portal'
      : 'Password Reset OTP Code - P W Holdings';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #022851; margin-top: 0; font-size: 22px;">P W Holdings</h2>
        <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
          Your 6-digit verification code for ${isRegister ? 'account registration' : 'password reset'} is:
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #022851; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
          This code is valid for 10 minutes. If you did not request this code, please ignore this email.
        </p>
      </div>
    `;

    await sendSystemEmail({
      to: cleanEmail,
      subject: subject,
      html: htmlContent
    });

    return { message: 'Verification code sent to your email' };
  },

  async verifyOtpRegister({ name, department, email, password, otp }) {
    if (!name || !email || !password || !otp) {
      throw new Error('Name, email, password, and OTP are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const stored = otpStore[cleanEmail];

    if (!stored || stored.otp !== cleanOtp || stored.type !== 'register' || Date.now() > stored.expiresAt) {
      throw new Error('Invalid or expired verification code');
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('email', cleanEmail);

    if (existing && existing.length > 0) {
      throw new Error('An account with this email already exists.');
    }

    const initials = getInitials(name);
    const role = ADMIN_EMAILS.includes(cleanEmail) ? 'Admin' : 'Employee';

    const { data: insertedUsers, error: insertErr } = await supabase
      .from('users')
      .insert([{
        name: name.trim(),
        department: department || 'IT',
        email: cleanEmail,
        password: password,
        initials: initials,
        status: 'Working',
        role: role
      }])
      .select();

    if (insertErr || !insertedUsers || insertedUsers.length === 0) {
      throw new Error(insertErr?.message || 'Failed to create user account');
    }

    const newUser = insertedUsers[0];

    // Initialize 24-day leave balance
    await supabase
      .from('leave_balances')
      .insert([{
        user_id: newUser.id,
        total_days: 24.00,
        used_days: 0.00
      }]);

    delete otpStore[cleanEmail];
    delete newUser.password;

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return { message: 'Account created successfully', user: newUser, token };
  },

  async verifyOtpResetPassword({ email, newPassword, otp }) {
    if (!email || !otp || !newPassword) {
      throw new Error('Email, new password, and OTP are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const stored = otpStore[cleanEmail];

    if (!stored || stored.otp !== cleanOtp || stored.type !== 'reset-password' || Date.now() > stored.expiresAt) {
      throw new Error('Invalid or expired verification code');
    }

    const { error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .ilike('email', cleanEmail);

    if (error) throw new Error(error.message || 'Failed to update password');

    delete otpStore[cleanEmail];
    return { message: 'Password reset successfully' };
  }
};

// =============================================================
// DASHBOARD SERVICE
// =============================================================
const dashboardService = {
  async getDashboardSummary(userId) {
    if (!userId) throw new Error('user_id is required');
    const todayStr = getTodayStr();

    // 1. Fetch User Profile
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id, name, department, email, initials, status, role')
      .eq('id', userId);

    if (uErr || !users || users.length === 0) {
      throw new Error(uErr?.message || 'User not found');
    }
    const user = users[0];

    // 2. Fetch Today's Work Entry
    const { data: entries } = await supabase
      .from('daily_work_entries')
      .select('work_description')
      .eq('user_id', userId)
      .eq('entry_date', todayStr);

    const todayEntry = entries && entries.length > 0 ? entries[0].work_description : '';

    // 3. Fetch Leave Balances
    const { data: balances } = await supabase
      .from('leave_balances')
      .select('total_days, used_days')
      .eq('user_id', userId);

    const balance = (balances && balances.length > 0) 
      ? balances[0] 
      : { total_days: 24, used_days: 0 };

    const totalDays = parseFloat(balance.total_days || 24);
    const usedDays = parseFloat(balance.used_days || 0);
    const availableDays = Math.max(0, totalDays - usedDays);

    // 4. Fetch Active Approved Leave Today
    const { data: activeLeavesToday } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'Approved')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr);

    let calculatedStatus = 'Working';
    let hdDetails = null;
    let slDetails = null;

    if (activeLeavesToday && activeLeavesToday.length > 0) {
      const al = activeLeavesToday[0];
      if (al.leave_type === 'Study Leave') {
        calculatedStatus = todayEntry.trim() !== '' ? 'Study Leave / Work Today' : 'Study Leave';
      } else if (al.leave_type === 'Half Day') {
        hdDetails = getHalfDayDetails(al);
        calculatedStatus = hdDetails.half_day_leave_now ? `Half Day (${hdDetails.half_day_session})` : 'Working';
      } else if (al.leave_type === 'Short Leave') {
        slDetails = getShortLeaveDetails(al);
        calculatedStatus = slDetails.short_leave_now ? 'Short Leave' : 'Working';
      } else if (al.leave_type === 'Power Cut') {
        calculatedStatus = 'Power Cut';
      } else {
        calculatedStatus = 'On Leave';
      }
    } else if (user.status && user.status !== 'On Leave') {
      calculatedStatus = user.status;
    }

    // 5. Fetch Recent Leave Requests (Last 5)
    const { data: recentLeaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const formattedRecentLeaves = (recentLeaves || []).map(l => {
      const isSpecial = l.leave_type === 'Special Leave';
      const isShortLeave = l.leave_type === 'Short Leave';
      const isPowerCut = l.leave_type === 'Power Cut';
      const sDate = l.start_date ? l.start_date.split('T')[0] : '';
      const eDate = l.end_date ? l.end_date.split('T')[0] : '';

      return {
        id: l.id,
        leave_type: isSpecial 
          ? '🔄 Special Leave' 
          : isShortLeave 
          ? '⏱️ Short Leave' 
          : isPowerCut 
          ? '⚡ Power Cut' 
          : l.leave_type,
        start_date: sDate,
        end_date: eDate,
        days_count: l.days_count,
        special_session: l.special_session,
        day_of_week: l.day_of_week,
        start_time: l.start_time,
        end_time: l.end_time,
        reason: l.reason,
        status: l.status,
        duration: isSpecial && l.day_of_week
          ? formatSpecialDays(l.day_of_week)
          : isShortLeave && l.start_time && l.end_time
          ? `${formatTime12(l.start_time)} - ${formatTime12(l.end_time)}`
          : (sDate === eDate ? sDate : `${sDate} to ${eDate}`)
      };
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        department: user.department,
        email: user.email,
        initials: user.initials,
        status: calculatedStatus,
        role: user.role,
        is_half_day: hdDetails ? hdDetails.is_half_day : false,
        half_day_session: hdDetails ? hdDetails.half_day_session : null,
        half_day_leave_now: hdDetails ? hdDetails.half_day_leave_now : false,
        half_day_time: hdDetails ? hdDetails.leave_time : null,
        half_day_working_time: hdDetails ? hdDetails.working_time : null,
        is_short_leave: slDetails ? slDetails.is_short_leave : false,
        short_leave_now: slDetails ? slDetails.short_leave_now : false,
        short_leave_time: slDetails ? slDetails.time_range : null,
        short_leave_duration: slDetails ? slDetails.duration_hours : null
      },
      todayWork: todayEntry,
      leaveBalance: {
        total_days: totalDays,
        used_days: usedDays,
        available_days: availableDays
      },
      recentLeaveRequests: formattedRecentLeaves
    };
  },

  async saveWorkEntry(userId, work_description) {
    if (!userId) throw new Error('user_id is required');
    const todayStr = getTodayStr();

    const { data: existing } = await supabase
      .from('daily_work_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('entry_date', todayStr);

    if (existing && existing.length > 0) {
      await supabase
        .from('daily_work_entries')
        .update({
          work_description: work_description || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', existing[0].id);
    } else {
      await supabase
        .from('daily_work_entries')
        .insert([{
          user_id: userId,
          entry_date: todayStr,
          work_description: work_description || ''
        }]);
    }

    return { message: 'Work entry updated successfully', work_description };
  },

  async getWorkHistory(userId) {
    if (!userId) throw new Error('user_id is required');

    const { data: entries, error } = await supabase
      .from('daily_work_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    if (error) throw new Error(error.message);
    return { entries: entries || [] };
  },

  async applyLeave(leaveData) {
    const { user_id, leave_type, start_date, end_date, days_count, reason, day_of_week, start_time, end_time, is_recurring, special_session } = leaveData;

    if (!user_id || !leave_type || !start_date || !end_date) {
      throw new Error('user_id, leave_type, start_date, and end_date are required');
    }

    const days = Number(days_count) || 1;
    const isSpecial = leave_type === 'Special Leave';
    const finalRecurring = isSpecial ? true : (is_recurring ? true : false);

    const { error } = await supabase
      .from('leave_requests')
      .insert([{
        user_id: user_id,
        leave_type: leave_type,
        start_date: start_date,
        end_date: end_date,
        days_count: days,
        day_of_week: day_of_week || null,
        start_time: start_time || null,
        end_time: end_time || null,
        special_session: isSpecial ? (special_session || 'Morning') : special_session || null,
        is_recurring: finalRecurring,
        status: 'Pending',
        reason: reason || ''
      }]);

    if (error) throw new Error(error.message);

    // Trigger async email notification
    (async () => {
      try {
        const { data: u } = await supabase.from('users').select('name, email, department').eq('id', user_id).single();
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background-color: #022851; padding: 16px 20px; border-radius: 8px; color: #ffffff; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 20px;">New Leave Application Request</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.85;">P W Holdings - Employee Management System</p>
            </div>
            <p style="font-size: 14px; color: #334155;">A new leave application has been submitted:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
              <tr style="background-color: #f8fafc;"><td style="padding: 8px; font-weight: bold; width: 35%;">Employee:</td><td style="padding: 8px; font-weight: bold; color: #0f172a;">${u?.name || 'N/A'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Department:</td><td style="padding: 8px;">${u?.department || 'IT'}</td></tr>
              <tr style="background-color: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Leave Type:</td><td style="padding: 8px; color: #2563eb; font-weight: bold;">${leave_type}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Dates:</td><td style="padding: 8px; font-weight: bold;">${start_date} to ${end_date} (${days} days)</td></tr>
              <tr style="background-color: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Reason:</td><td style="padding: 8px;">${reason || 'None provided'}</td></tr>
            </table>
          </div>
        `;
        await sendSystemEmail({
          to: 'hashan@pwholdings.lk',
          cc: ['nishani@pwholdings.lk', 'channa@pwholdings.lk', 'pasindu.buddhima@pwholdings.lk'],
          subject: `Leave Request: ${u?.name || 'Employee'} - ${leave_type} (${start_date})`,
          html: htmlContent
        });
      } catch (e) {
        console.warn('Leave email dispatch warning:', e.message);
      }
    })();

    return { message: 'Leave application submitted successfully' };
  },

  async getLeaveHistory(userId) {
    if (!userId) throw new Error('user_id is required');

    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { requests: requests || [] };
  },

  async cancelLeave(id, userId) {
    if (!id) throw new Error('id is required');
    const todayStr = getTodayStr();

    let query = supabase.from('leave_requests').select('*').eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data: requests, error: rErr } = await query;

    if (rErr || !requests || requests.length === 0) {
      throw new Error('Leave request not found');
    }
    const lReq = requests[0];

    if (lReq.status === 'Cancelled') {
      throw new Error('Leave request is already cancelled');
    }

    const cancelEligibility = getLeaveCancellationStatus(lReq);
    if (!cancelEligibility.canCancel) {
      throw new Error(cancelEligibility.reason || 'Cannot cancel leave: The cancellation deadline has passed.');
    }

    const previousStatus = lReq.status;

    const { error: updateErr } = await supabase
      .from('leave_requests')
      .update({ status: 'Cancelled' })
      .eq('id', id);

    if (updateErr) throw new Error(updateErr.message || 'Failed to cancel leave request');

    if (previousStatus === 'Approved') {
      const { data: balances } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', lReq.user_id);

      if (balances && balances.length > 0) {
        const currentUsed = parseFloat(balances[0].used_days || 0);
        const leaveDays = parseFloat(lReq.days_count || 1);
        const newUsed = Math.max(0, currentUsed - leaveDays);
        await supabase
          .from('leave_balances')
          .update({ used_days: newUsed })
          .eq('user_id', lReq.user_id);
      }

      const { data: otherActiveLeaves } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('user_id', lReq.user_id)
        .eq('status', 'Approved')
        .lte('start_date', todayStr)
        .gte('end_date', todayStr)
        .neq('id', id);

      if (!otherActiveLeaves || otherActiveLeaves.length === 0) {
        await supabase
          .from('users')
          .update({ status: 'Working' })
          .eq('id', lReq.user_id);
      }
    }

    return { 
      message: previousStatus === 'Approved'
        ? 'Leave request cancelled and quota successfully restored.'
        : 'Leave request cancelled successfully.'
    };
  },

  async updateUserStatus(userId, status) {
    if (!userId || !status) throw new Error('user_id and status are required');

    const { error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId);

    if (error) throw new Error(error.message);
    return { message: 'Status updated successfully', status };
  }
};

// =============================================================
// ADMIN SERVICE
// =============================================================
const adminService = {
  async getAdminSummary() {
    const todayStr = getTodayStr();

    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, initials, department, status, role')
      .order('name', { ascending: true });

    const { data: todayWorks } = await supabase
      .from('daily_work_entries')
      .select('user_id, work_description')
      .eq('entry_date', todayStr);

    const workMap = {};
    (todayWorks || []).forEach(w => {
      workMap[w.user_id] = w.work_description;
    });

    const { data: activeLeaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'Approved')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr);

    const leaveMap = {};
    (activeLeaves || []).forEach(l => {
      leaveMap[l.user_id] = l;
    });

    const { data: pendingRequests } = await supabase
      .from('leave_requests')
      .select(`
        id, user_id, leave_type, start_date, end_date, days_count, 
        day_of_week, start_time, end_time, special_session, is_recurring, 
        status, reason, created_at,
        users (id, name, email, department)
      `)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    let workingCount = 0;
    let onLeaveCount = 0;
    let halfDayCount = 0;
    let studyLeaveCount = 0;
    let specialLeaveCount = 0;

    const workingWorkforce = [];
    const todaysLeave = [];
    const halfDayEmployees = [];
    const studyLeaveEmployees = [];
    const specialLeaveEmployees = [];

    const staleUserIdsToWorking = [];
    const userIdsToOnLeave = [];

    (allUsers || []).forEach(u => {
      const activeLeave = leaveMap[u.id];
      const todayWork = workMap[u.id] || '';
      let displayStatus = 'Working';
      let hd = null;
      let sl = null;

      if (activeLeave) {
        if (activeLeave.leave_type === 'Study Leave') {
          displayStatus = todayWork.trim() !== '' ? 'Study Leave / Work Today' : 'Study Leave';
        } else if (activeLeave.leave_type === 'Half Day') {
          hd = getHalfDayDetails(activeLeave);
          displayStatus = hd.half_day_leave_now ? `Half Day (${hd.half_day_session})` : 'Working';
        } else if (activeLeave.leave_type === 'Short Leave') {
          sl = getShortLeaveDetails(activeLeave);
          displayStatus = sl.short_leave_now ? 'Short Leave' : 'Working';
        } else if (activeLeave.leave_type === 'Power Cut') {
          displayStatus = 'Power Cut';
        } else {
          displayStatus = `On Leave (${activeLeave.leave_type})`;
        }

        const isActivelyOnLeave = activeLeave.leave_type === 'Half Day' 
          ? hd.half_day_leave_now 
          : activeLeave.leave_type === 'Short Leave'
          ? sl.short_leave_now
          : true;

        if (isActivelyOnLeave && u.status !== 'On Leave') {
          userIdsToOnLeave.push(u.id);
        } else if (!isActivelyOnLeave && u.status === 'On Leave') {
          staleUserIdsToWorking.push(u.id);
        }
      } else {
        if (u.status && u.status !== 'On Leave') {
          displayStatus = u.status;
        } else if (u.status === 'On Leave') {
          staleUserIdsToWorking.push(u.id);
        }
      }

      const formattedEmp = {
        id: u.id,
        name: u.name,
        initials: u.initials || getInitials(u.name),
        department: u.department || 'IT',
        status: displayStatus,
        today_work: todayWork,
        updated_ago: 'Today',
        leave_type: activeLeave ? activeLeave.leave_type : null,
        leave_reason: activeLeave ? (activeLeave.reason || activeLeave.leave_type) : null,
        is_half_day: hd ? hd.is_half_day : false,
        half_day_session: hd ? hd.half_day_session : null,
        half_day_leave_now: hd ? hd.half_day_leave_now : false,
        half_day_time: hd ? hd.leave_time : null,
        half_day_working_time: hd ? hd.working_time : null,
        is_short_leave: sl ? sl.is_short_leave : false,
        short_leave_now: sl ? sl.short_leave_now : false,
        short_leave_time: sl ? sl.time_range : null,
        short_leave_duration: sl ? sl.duration_hours : null
      };

      if (activeLeave) {
        const leaveType = activeLeave.leave_type;

        if (leaveType === 'Half Day') {
          halfDayCount++;
          const hdInfo = hd || getHalfDayDetails(activeLeave);
          halfDayEmployees.push({
            ...formattedEmp,
            session: `${hdInfo.half_day_session} Session (${hdInfo.leave_time})`,
            half_day_type: `${hdInfo.half_day_session} Session`,
            time: hdInfo.leave_time,
            is_leave_now: hdInfo.half_day_leave_now,
            leave_time: hdInfo.leave_time,
            working_time: hdInfo.working_time,
            reason: activeLeave.reason || `${hdInfo.half_day_session} Half Day`
          });

          if (hdInfo.half_day_leave_now) {
            onLeaveCount++;
          } else {
            workingCount++;
            workingWorkforce.push(formattedEmp);
          }
        } else if (leaveType === 'Short Leave') {
          const slInfo = sl || getShortLeaveDetails(activeLeave);
          if (slInfo.short_leave_now) {
            onLeaveCount++;
            todaysLeave.push({
              ...formattedEmp,
              leave_type: 'Short Leave',
              duration: `${slInfo.time_range} (${slInfo.duration_hours} hrs)`,
              leave_reason: activeLeave.reason || 'Short Leave'
            });
          } else {
            workingCount++;
            workingWorkforce.push(formattedEmp);
          }
        } else if (leaveType === 'Study Leave') {
          studyLeaveCount++;
          onLeaveCount++;
          studyLeaveEmployees.push({
            ...formattedEmp,
            session: activeLeave.special_session || 'Full Day',
            reason: activeLeave.reason || 'Study Leave'
          });
        } else if (leaveType === 'Special Leave') {
          specialLeaveCount++;
          onLeaveCount++;
          specialLeaveEmployees.push({
            ...formattedEmp,
            days: formatSpecialDays(activeLeave.day_of_week),
            reason: activeLeave.reason || 'Special Leave'
          });
        } else {
          onLeaveCount++;
          todaysLeave.push({
            ...formattedEmp,
            leave_type: leaveType,
            leave_reason: activeLeave.reason || 'On Leave'
          });
        }
      } else {
        workingCount++;
        workingWorkforce.push(formattedEmp);
      }
    });

    if (staleUserIdsToWorking.length > 0) {
      supabase.from('users').update({ status: 'Working' }).in('id', staleUserIdsToWorking).then(() => {});
    }
    if (userIdsToOnLeave.length > 0) {
      supabase.from('users').update({ status: 'On Leave' }).in('id', userIdsToOnLeave).then(() => {});
    }

    const pendingFormatted = (pendingRequests || []).map(r => ({
      id: r.id,
      employee_name: r.users?.name || 'Employee',
      leave_type: r.leave_type,
      from_date: r.start_date,
      to_date: r.end_date,
      days_count: r.days_count,
      day_of_week: r.day_of_week,
      start_time: r.start_time,
      end_time: r.end_time,
      special_session: r.special_session,
      is_recurring: r.is_recurring,
      reason: r.reason,
      status: r.status,
      applied_date: r.created_at ? r.created_at.split('T')[0] : '',
      duration: r.leave_type === 'Special Leave' && r.day_of_week
        ? formatSpecialDays(r.day_of_week)
        : (r.leave_type === 'Short Leave' && r.start_time && r.end_time)
          ? `${formatTime12(r.start_time)} - ${formatTime12(r.end_time)}`
          : (r.leave_type === 'Half Day' && r.start_time && r.end_time)
            ? `${r.start_time} - ${r.end_time} (${r.days_count} day)`
            : `${r.days_count} ${r.days_count === 1 ? 'day' : 'days'}`
    }));

    return {
      stats: {
        total_employees: (allUsers || []).length,
        working_today: workingCount,
        on_leave_today: onLeaveCount,
        half_day: halfDayCount,
        study_leave: studyLeaveCount,
        special_leave: specialLeaveCount,
        pending_requests: pendingFormatted.length
      },
      workingWorkforce,
      todaysLeave,
      halfDayEmployees,
      studyLeaveEmployees,
      specialLeaveEmployees,
      pendingLeaveRequests: pendingFormatted,
      allEmployees: (allUsers || []).map(u => {
        const activeLeave = leaveMap[u.id];
        const todayWork = workMap[u.id] || '';
        let displayStatus = 'Working';
        let hd = null;
        let sl = null;
        if (activeLeave) {
          if (activeLeave.leave_type === 'Study Leave') {
            displayStatus = todayWork.trim() !== '' ? 'Study Leave / Work Today' : 'Study Leave';
          } else if (activeLeave.leave_type === 'Half Day') {
            hd = getHalfDayDetails(activeLeave);
            displayStatus = hd.half_day_leave_now ? `Half Day (${hd.half_day_session})` : 'Working';
          } else if (activeLeave.leave_type === 'Short Leave') {
            sl = getShortLeaveDetails(activeLeave);
            displayStatus = sl.short_leave_now ? 'Short Leave' : 'Working';
          } else if (activeLeave.leave_type === 'Power Cut') {
            displayStatus = 'Power Cut';
          } else {
            displayStatus = `On Leave (${activeLeave.leave_type})`;
          }
        }
        return {
          id: u.id,
          name: u.name,
          initials: u.initials || getInitials(u.name),
          department: u.department || 'IT',
          status: displayStatus,
          role: u.role || 'Employee',
          today_work: todayWork,
          leave_type: activeLeave ? activeLeave.leave_type : null,
          leave_reason: activeLeave ? (activeLeave.reason || activeLeave.leave_type) : null,
          leave_dates: activeLeave ? (activeLeave.start_date === activeLeave.end_date ? activeLeave.start_date : `${activeLeave.start_date} to ${activeLeave.end_date}`) : null,
          is_half_day: hd ? hd.is_half_day : false,
          half_day_session: hd ? hd.half_day_session : null,
          half_day_leave_now: hd ? hd.half_day_leave_now : false,
          is_short_leave: sl ? sl.is_short_leave : false,
          short_leave_now: sl ? sl.short_leave_now : false
        };
      })
    };
  },

  async getAdminEmployees() {
    const todayStr = getTodayStr();

    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, initials, department, status, role')
      .order('name', { ascending: true });

    const { data: todayWorks } = await supabase
      .from('daily_work_entries')
      .select('user_id, work_description')
      .eq('entry_date', todayStr);

    const workMap = {};
    (todayWorks || []).forEach(w => {
      workMap[w.user_id] = w.work_description;
    });

    const { data: activeLeaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'Approved')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr);

    const leaveMap = {};
    (activeLeaves || []).forEach(l => {
      leaveMap[l.user_id] = l;
    });

    const employees = (allUsers || []).map(u => {
      const activeLeave = leaveMap[u.id];
      const todayWork = workMap[u.id] || '';
      let displayStatus = 'Working';
      let hd = null;
      let sl = null;

      if (activeLeave) {
        if (activeLeave.leave_type === 'Study Leave') {
          displayStatus = todayWork.trim() !== '' ? 'Study Leave / Work Today' : 'Study Leave';
        } else if (activeLeave.leave_type === 'Half Day') {
          hd = getHalfDayDetails(activeLeave);
          displayStatus = hd.half_day_leave_now ? `Half Day (${hd.half_day_session})` : 'Working';
        } else if (activeLeave.leave_type === 'Short Leave') {
          sl = getShortLeaveDetails(activeLeave);
          displayStatus = sl.short_leave_now ? 'Short Leave' : 'Working';
        } else if (activeLeave.leave_type === 'Power Cut') {
          displayStatus = 'Power Cut';
        } else {
          displayStatus = `On Leave (${activeLeave.leave_type})`;
        }
      } else if (u.status && u.status !== 'On Leave') {
        displayStatus = u.status;
      }

      return {
        id: u.id,
        name: u.name,
        initials: u.initials || getInitials(u.name),
        department: u.department || 'IT',
        status: displayStatus,
        role: u.role || 'Employee',
        today_work: todayWork,
        updated_ago: 'Today',
        leave_type: activeLeave ? activeLeave.leave_type : null,
        leave_reason: activeLeave ? (activeLeave.reason || activeLeave.leave_type) : null,
        leave_dates: activeLeave ? (activeLeave.start_date === activeLeave.end_date ? activeLeave.start_date : `${activeLeave.start_date} to ${activeLeave.end_date}`) : null,
        active_leave: activeLeave || null,
        is_half_day: hd ? hd.is_half_day : false,
        half_day_session: hd ? hd.half_day_session : null,
        half_day_leave_now: hd ? hd.half_day_leave_now : false,
        half_day_time: hd ? hd.leave_time : null,
        half_day_working_time: hd ? hd.working_time : null,
        is_short_leave: sl ? sl.is_short_leave : false,
        short_leave_now: sl ? sl.short_leave_now : false,
        short_leave_time: sl ? sl.time_range : null,
        short_leave_duration: sl ? sl.duration_hours : null
      };
    });

    return { employees };
  },

  async getAdminWorkActivity() {
    const { data: entries, error } = await supabase
      .from('daily_work_entries')
      .select(`
        id, user_id, entry_date, work_description, created_at, updated_at,
        users (id, name, initials, department)
      `)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const activities = (entries || []).map(e => ({
      id: e.id,
      user_id: e.user_id,
      employee_name: e.users?.name || 'Employee',
      initials: e.users?.initials || 'EP',
      department: e.users?.department || 'IT',
      work_date: e.entry_date,
      work_description: e.work_description || 'No description provided.',
      created_at: e.created_at,
      updated_at: e.updated_at
    }));

    return { activities };
  },

  async getAdminLeaveCalendar(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: leaves, error } = await supabase
      .from('leave_requests')
      .select(`
        id, user_id, leave_type, start_date, end_date, days_count,
        day_of_week, start_time, end_time, special_session, is_recurring,
        status, reason, created_at,
        users (id, name, initials, department)
      `)
      .eq('status', 'Approved')
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate}),is_recurring.eq.true`);

    if (error) throw new Error(error.message);

    const formattedLeaves = (leaves || []).map(l => ({
      id: l.id,
      user_id: l.user_id,
      employee_name: l.users?.name || 'Employee',
      initials: l.users?.initials || 'EP',
      department: l.users?.department || 'IT',
      leave_type: l.leave_type,
      start_date: l.start_date ? l.start_date.split('T')[0] : '',
      end_date: l.end_date ? l.end_date.split('T')[0] : '',
      days_count: l.days_count,
      day_of_week: l.day_of_week,
      start_time: l.start_time,
      end_time: l.end_time,
      special_session: l.special_session,
      is_recurring: l.is_recurring,
      reason: l.reason,
      status: l.status,
      duration: l.leave_type === 'Special Leave' && l.day_of_week
        ? formatSpecialDays(l.day_of_week)
        : (l.leave_type === 'Short Leave' && l.start_time && l.end_time)
          ? `${formatTime12(l.start_time)} - ${formatTime12(l.end_time)}`
          : `${l.days_count} days`
    }));

    return { leaves: formattedLeaves };
  },

  async approveLeave(id) {
    if (!id) throw new Error('id is required');
    const todayStr = getTodayStr();

    const { data: leaves, error: fErr } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', id);

    if (fErr || !leaves || leaves.length === 0) throw new Error('Leave request not found');
    const lReq = leaves[0];

    if (lReq.status === 'Approved') throw new Error('Leave is already approved');

    const { error: uErr } = await supabase
      .from('leave_requests')
      .update({ status: 'Approved' })
      .eq('id', id);

    if (uErr) throw new Error(uErr.message);

    // Deduct from leave balance if not already deducted
    const { data: balances } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', lReq.user_id);

    if (balances && balances.length > 0) {
      const currentUsed = parseFloat(balances[0].used_days || 0);
      const leaveDays = parseFloat(lReq.days_count || 1);
      await supabase
        .from('leave_balances')
        .update({ used_days: currentUsed + leaveDays })
        .eq('user_id', lReq.user_id);
    }

    // If leave is active today, update user status
    const sDate = lReq.start_date ? lReq.start_date.split('T')[0] : '';
    const eDate = lReq.end_date ? lReq.end_date.split('T')[0] : '';
    if (todayStr >= sDate && todayStr <= eDate) {
      if (lReq.leave_type === 'Half Day') {
        const hd = getHalfDayDetails(lReq);
        if (hd.half_day_leave_now) {
          await supabase.from('users').update({ status: 'On Leave' }).eq('id', lReq.user_id);
        }
      } else if (lReq.leave_type === 'Short Leave') {
        const sl = getShortLeaveDetails(lReq);
        if (sl.short_leave_now) {
          await supabase.from('users').update({ status: 'On Leave' }).eq('id', lReq.user_id);
        }
      } else if (lReq.leave_type !== 'Study Leave') {
        await supabase.from('users').update({ status: 'On Leave' }).eq('id', lReq.user_id);
      }
    }

    return { message: 'Leave approved successfully' };
  },

  async rejectLeave(id) {
    if (!id) throw new Error('id is required');

    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'Rejected' })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { message: 'Leave rejected successfully' };
  }
};

module.exports = {
  authService,
  dashboardService,
  adminService,
  JWT_SECRET
};
