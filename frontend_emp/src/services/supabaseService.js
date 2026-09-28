import { supabase } from '../supabaseClient';

const ADMIN_EMAILS = [
  'hashan@pwholdings.lk',
  'nishani@pwholdings.lk',
  'channa@pwholdings.lk',
  'pasindu.buddhima@pwholdings.lk'
];

// In-memory OTP storage for registration and password resets
const otpStore = {};

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getInitials(name) {
  if (!name) return 'EP';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

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

// Helper to determine active half-day session (Morning 8:30 AM - 12:30 PM, Evening 12:30 PM - 5:30 PM)
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

  // Morning session leave: 8:30 AM - 12:30 PM (leave in morning, working in evening)
  // Evening session leave: 12:30 PM - 5:30 PM (working in morning, leave in evening)
  const isLeaveNow = session === 'Morning' ? isMorningNow : !isMorningNow;

  return {
    is_half_day: true,
    half_day_session: session, // 'Morning' | 'Evening'
    half_day_leave_now: isLeaveNow,
    leave_time: session === 'Morning' ? '08:30 AM - 12:30 PM' : '12:30 PM - 05:30 PM',
    working_time: session === 'Morning' ? '12:30 PM - 05:30 PM' : '08:30 AM - 12:30 PM'
  };
}

// Helper to format HH:MM:SS to 12-hour AM/PM format
function formatTime12(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Helper to determine active Short Leave time window (strictly <= 3 hours)
function getShortLeaveDetails(activeLeave) {
  if (!activeLeave || activeLeave.leave_type !== 'Short Leave') {
    return null;
  }

  let startTime = activeLeave.start_time || '09:00:00';
  let endTime = activeLeave.end_time || '11:30:00';

  // Fallback extraction from reason if start_time/end_time wasn't saved in column
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

// -------------------------------------------------------------
// AUTH SERVICES
// -------------------------------------------------------------
export const authService = {
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    const cleanEmail = email.trim().toLowerCase();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, department, email, password, initials, status, role')
      .ilike('email', cleanEmail);

    if (error) {
      console.error('Supabase login query error:', error);
      throw new Error(error.message || 'Database error during login');
    }

    if (!users || users.length === 0) {
      throw new Error('Invalid email address or password');
    }

    const user = users[0];
    if (user.password !== password) {
      throw new Error('Invalid email address or password');
    }

    // Auto-promote admin emails
    if (ADMIN_EMAILS.includes(cleanEmail) && user.role !== 'Admin') {
      user.role = 'Admin';
      await supabase
        .from('users')
        .update({ role: 'Admin' })
        .eq('id', user.id);
    }

    delete user.password;
    return { message: 'Login successful', user };
  },

  async sendOtp(email, type = 'register') {
    if (!email) throw new Error('Email is required');
    const cleanEmail = email.trim().toLowerCase();

    // 1. Send OTP email via Supabase Auth (using configured Custom SMTP)
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true
        }
      });
      if (error) {
        console.warn('Supabase Auth signInWithOtp warning:', error.message);
      }
    } catch (e) {
      console.warn('Error invoking Supabase Auth email dispatch:', e.message);
    }

    // 2. Also keep a fallback OTP in memory for development convenience
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore[cleanEmail] = { otp, expiresAt, type };
    console.log(`[Backup OTP for ${cleanEmail}]: ${otp} (Type: ${type})`);

    return { 
      message: `Verification code sent to ${cleanEmail}. Please check your inbox!`,
      backupOtp: otp
    };
  },

  async verifyOtpRegister({ name, department, email, password, otp }) {
    if (!email || !otp || !password || !name) {
      throw new Error('Name, email, password, and OTP are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const stored = otpStore[cleanEmail];

    // Try Supabase Auth verifyOtp first
    let isVerified = false;
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'email'
      });
      if (!error && data?.user) {
        isVerified = true;
      }
    } catch (e) {
      console.warn('Supabase verifyOtp attempt:', e.message);
    }

    // Backup check against memory store
    if (!isVerified && stored && stored.otp === cleanOtp && stored.type === 'register') {
      if (Date.now() <= stored.expiresAt) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      throw new Error('Invalid or expired verification code. Please check your email and try again.');
    }

    // Check if account already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('email', cleanEmail);

    if (existing && existing.length > 0) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const initials = getInitials(name);
    const role = ADMIN_EMAILS.includes(cleanEmail) ? 'Admin' : 'Employee';

    // Insert user
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

    // Create default leave balance (24 total days)
    await supabase
      .from('leave_balances')
      .insert([{
        user_id: newUser.id,
        total_days: 24.00,
        used_days: 0.00
      }]);

    delete otpStore[cleanEmail];
    delete newUser.password;

    return { message: 'Account created successfully', user: newUser };
  },

  async verifyOtpResetPassword({ email, newPassword, otp }) {
    if (!email || !otp || !newPassword) {
      throw new Error('Email, new password, and OTP are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const stored = otpStore[cleanEmail];

    let isVerified = false;
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'email'
      });
      if (!error && data?.user) {
        isVerified = true;
      }
    } catch (e) {
      console.warn('Supabase reset verifyOtp attempt:', e.message);
    }

    if (!isVerified && stored && stored.otp === cleanOtp && stored.type === 'reset-password') {
      if (Date.now() <= stored.expiresAt) {
        isVerified = true;
      }
    }

    if (!isVerified) {
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

// -------------------------------------------------------------
// DASHBOARD SERVICES
// -------------------------------------------------------------
export const dashboardService = {
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
    const available_days = Math.max(0, totalDays - usedDays);

    // 4. Fetch Active Approved Leave for Today
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
      const activeLeave = activeLeavesToday[0];
      if (activeLeave.leave_type === 'Study Leave') {
        calculatedStatus = todayEntry.trim() !== '' ? 'Study Leave / Work Today' : 'Study Leave';
      } else if (activeLeave.leave_type === 'Half Day') {
        hdDetails = getHalfDayDetails(activeLeave);
        calculatedStatus = hdDetails.half_day_leave_now ? `Half Day (${hdDetails.half_day_session})` : 'Working';
      } else if (activeLeave.leave_type === 'Short Leave') {
        slDetails = getShortLeaveDetails(activeLeave);
        calculatedStatus = slDetails.short_leave_now ? 'Short Leave' : 'Working';
      } else {
        calculatedStatus = 'On Leave';
      }
    } else if (user.status && user.status !== 'On Leave') {
      calculatedStatus = user.status;
    }

    // Auto-heal status if outdated
    if (user.status === 'On Leave' && (!activeLeavesToday || activeLeavesToday.length === 0)) {
      supabase.from('users').update({ status: 'Working' }).eq('id', userId).then(() => {});
    }

    // 5. Fetch Recent Leave Requests (5 most recent)
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('id, leave_type, start_date, end_date, days_count, day_of_week, start_time, end_time, special_session, status, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        initials: user.initials,
        status: calculatedStatus,
        department: user.department,
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
        available_days: available_days
      },
      recentLeaveRequests: leaves || []
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

// -------------------------------------------------------------
// ADMIN SERVICES
// -------------------------------------------------------------
export const adminService = {
  async getAdminSummary() {
    const todayStr = getTodayStr();

    // 1. Fetch all users
    const { data: allUsers, error: uErr } = await supabase
      .from('users')
      .select('id, name, initials, department, status, role')
      .order('name', { ascending: true });

    if (uErr) throw new Error(uErr.message);

    // 2. Fetch today's work entries
    const { data: todayWorks } = await supabase
      .from('daily_work_entries')
      .select('user_id, work_description')
      .eq('entry_date', todayStr);

    const workMap = {};
    (todayWorks || []).forEach(w => {
      workMap[w.user_id] = w.work_description;
    });

    // 3. Fetch active approved leaves for today
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

    // 4. Fetch pending leave requests with employee details
    const { data: pendingRequests } = await supabase
      .from('leave_requests')
      .select(`
        id, leave_type, start_date, end_date, days_count, day_of_week, 
        start_time, end_time, special_session, is_recurring, reason, status, created_at, user_id,
        users (id, name, department, email)
      `)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    // Format workforce and categories
    const workingWorkforce = [];
    const todaysLeave = [];
    const halfDayEmployees = [];
    const studyLeaveEmployees = [];
    const specialLeaveEmployees = [];

    let workingCount = 0;
    let onLeaveCount = 0;
    let halfDayCount = 0;
    let studyLeaveCount = 0;
    let specialLeaveCount = 0;

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
        } else {
          displayStatus = 'On Leave';
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
      pendingLeaveRequests: pendingFormatted
    };
  },

  async getAdminEmployees() {
    const todayStr = getTodayStr();

    // 1. Fetch all users
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, initials, department, status, role')
      .order('name', { ascending: true });

    // 2. Fetch today's work entries
    const { data: todayWorks } = await supabase
      .from('daily_work_entries')
      .select('user_id, work_description')
      .eq('entry_date', todayStr);

    const workMap = {};
    (todayWorks || []).forEach(w => {
      workMap[w.user_id] = w.work_description;
    });

    // 3. Fetch active approved leaves for today
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

    const staleUserIdsToWorking = [];
    const userIdsToOnLeave = [];

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
        } else {
          displayStatus = 'On Leave';
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

      return {
        id: u.id,
        name: u.name,
        initials: u.initials || getInitials(u.name),
        department: u.department || 'IT',
        status: displayStatus,
        role: u.role || 'Employee',
        today_work: todayWork,
        updated_ago: 'Today',
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

    // Self-healing: asynchronously sync stale statuses in the users table
    if (staleUserIdsToWorking.length > 0) {
      supabase.from('users').update({ status: 'Working' }).in('id', staleUserIdsToWorking).then(() => {});
    }
    if (userIdsToOnLeave.length > 0) {
      supabase.from('users').update({ status: 'On Leave' }).in('id', userIdsToOnLeave).then(() => {});
    }

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
      name: e.users?.name || 'Employee',
      initials: e.users?.initials || getInitials(e.users?.name),
      department: e.users?.department || 'IT',
      entry_date: e.entry_date,
      work_description: e.work_description,
      updated_at: e.updated_at || e.created_at
    }));

    return { activities };
  },

  async getAdminLeaveCalendar(year, month) {
    const paddedMonth = String(month).padStart(2, '0');
    const startOfMonth = `${year}-${paddedMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

    const { data: leaves, error } = await supabase
      .from('leave_requests')
      .select(`
        id, user_id, leave_type, start_date, end_date, days_count, status, reason,
        users (id, name, initials, department)
      `)
      .eq('status', 'Approved')
      .lte('start_date', endOfMonth)
      .gte('end_date', startOfMonth);

    if (error) throw new Error(error.message);

    const formatted = (leaves || []).map(l => ({
      id: l.id,
      user_id: l.user_id,
      name: l.users?.name || 'Employee',
      employee_name: l.users?.name || 'Employee',
      initials: l.users?.initials || getInitials(l.users?.name),
      department: l.users?.department || 'IT',
      leave_type: l.leave_type,
      start_date: l.start_date,
      end_date: l.end_date,
      days_count: l.days_count,
      status: l.status,
      reason: l.reason
    }));

    return { leaves: formatted };
  },

  async approveLeave(id) {
    if (!id) throw new Error('id is required');
    const todayStr = getTodayStr();

    // 1. Fetch leave request
    const { data: requests, error: rErr } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', id);

    if (rErr || !requests || requests.length === 0) {
      throw new Error('Leave request not found');
    }
    const lReq = requests[0];

    // 2. Update leave request to Approved
    await supabase
      .from('leave_requests')
      .update({ status: 'Approved' })
      .eq('id', id);

    // 3. Update user status to 'On Leave' if today is within leave dates
    if (lReq.start_date <= todayStr && lReq.end_date >= todayStr) {
      await supabase
        .from('users')
        .update({ status: 'On Leave' })
        .eq('id', lReq.user_id);
    }

    // 4. Update leave balance
    const { data: balances } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', lReq.user_id);

    if (balances && balances.length > 0) {
      const currentUsed = parseFloat(balances[0].used_days || 0);
      const addDays = parseFloat(lReq.days_count || 1);
      await supabase
        .from('leave_balances')
        .update({ used_days: currentUsed + addDays })
        .eq('user_id', lReq.user_id);
    }

    return { message: 'Leave request approved successfully' };
  },

  async rejectLeave(id) {
    if (!id) throw new Error('id is required');

    const { data: requests, error: rErr } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', id);

    if (rErr || !requests || requests.length === 0) {
      throw new Error('Leave request not found');
    }
    const lReq = requests[0];

    await supabase
      .from('leave_requests')
      .update({ status: 'Rejected' })
      .eq('id', id);

    // Revert user status if 'On Leave'
    await supabase
      .from('users')
      .update({ status: 'Working' })
      .eq('id', lReq.user_id)
      .eq('status', 'On Leave');

    return { message: 'Leave request rejected successfully' };
  }
};
