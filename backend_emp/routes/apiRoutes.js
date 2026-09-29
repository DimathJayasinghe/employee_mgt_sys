const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sendEmail } = require('../services/emailService');
const { signUser, requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const OTP_TTL_MS = 10 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;
const loginFailures = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase() || 'EP';
}

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function requireString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function requirePassword(value, field = 'Password') {
  const password = requireString(value, field);
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
    const error = new Error(`${field} must be between ${MIN_PASSWORD_LENGTH} and 128 characters`);
    error.status = 400;
    throw error;
  }
  return password;
}

function getUserId(req) {
  return Number(req.auth.sub);
}

function loginKey(req, email) {
  return `${req.ip}:${email}`;
}

function isLoginBlocked(key) {
  const record = loginFailures.get(key);
  if (!record || record.expiresAt <= Date.now()) {
    loginFailures.delete(key);
    return false;
  }
  return record.count >= MAX_LOGIN_FAILURES;
}

function recordLoginFailure(key) {
  const current = loginFailures.get(key);
  if (!current || current.expiresAt <= Date.now()) {
    loginFailures.set(key, { count: 1, expiresAt: Date.now() + LOGIN_WINDOW_MS });
    return;
  }
  current.count += 1;
}

async function getUser(id) {
  const { data, error } = await db.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getActiveLeave(userId, date = today()) {
  const { data, error } = await db.from('leave_requests')
    .select('*').eq('user_id', userId).eq('status', 'Approved')
    .lte('start_date', date).gte('end_date', date).limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

function leaveStatus(leave) {
  if (!leave) return null;
  if (leave.leave_type === 'Half Day') {
    const text = `${leave.special_session || ''} ${leave.reason || ''}`.toLowerCase();
    const evening = text.includes('evening') || text.includes('pm') || text.includes('12:30');
    const session = evening ? 'Evening' : 'Morning';
    const morning = new Date().getHours() * 60 + new Date().getMinutes() < 750;
    return { status: session === 'Morning' === morning ? `Half Day (${session})` : 'Working', session };
  }
  if (leave.leave_type === 'Short Leave' && leave.start_time && leave.end_time) {
    const now = new Date().getHours() * 60 + new Date().getMinutes();
    const [sh, sm] = leave.start_time.split(':').map(Number);
    const [eh, em] = leave.end_time.split(':').map(Number);
    return { status: now >= sh * 60 + sm && now <= eh * 60 + em ? 'Short Leave' : 'Working' };
  }
  return { status: leave.leave_type === 'Study Leave' ? 'Study Leave' : 'On Leave' };
}

router.get('/health', (req, res) => res.json({ status: 'API is running' }));

router.post('/auth/login', async (req, res, next) => {
  try {
    const email = requireString(req.body.email, 'Email').toLowerCase();
    const password = requireString(req.body.password, 'Password');
    const attemptKey = loginKey(req, email);
    if (isLoginBlocked(attemptKey)) return res.status(429).json({ error: 'Too many failed login attempts. Please try again later.' });
    const { data: user, error } = await db.from('users').select('*').ilike('email', email).maybeSingle();
    if (error) throw error;
    if (!user || !(await bcrypt.compare(password, user.password)).valueOf()) {
      if (!user || user.password !== password) {
        recordLoginFailure(attemptKey);
        return res.status(401).json({ error: 'Invalid email address or password' });
      }
      const hashed = await bcrypt.hash(password, 12);
      await db.from('users').update({ password: hashed }).eq('id', user.id);
      user.password = hashed;
    }
    loginFailures.delete(attemptKey);
    res.json({ message: 'Login successful', token: signUser(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/auth/send-otp', async (req, res, next) => {
  try {
    const email = requireString(req.body.email, 'Email').toLowerCase();
    const type = req.body.type === 'reset-password' ? 'reset-password' : 'register';
    const { data: previousOtp, error: previousOtpError } = await db.from('auth_otps').select('last_sent_at').eq('email', email).eq('type', type).maybeSingle();
    if (previousOtpError) throw previousOtpError;
    if (previousOtp && Date.now() - new Date(previousOtp.last_sent_at).getTime() < 60 * 1000) {
      return res.status(429).json({ error: 'Please wait before requesting another verification code' });
    }
    const { data: existing, error } = await db.from('users').select('id').ilike('email', email).maybeSingle();
    if (error) throw error;
    if (type === 'register' && existing) return res.status(409).json({ error: 'An account with this email already exists' });
    if (type === 'reset-password' && !existing) return res.status(404).json({ error: 'No account found with this email address' });
    const otp = String(crypto.randomInt(100000, 1000000));
    const { error: otpError } = await db.from('auth_otps').upsert({
      email,
      type,
      code_hash: await bcrypt.hash(otp, 10),
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      last_sent_at: new Date().toISOString()
    });
    if (otpError) throw otpError;
    await sendEmail({
      to: email,
      subject: type === 'register' ? 'Employee Portal verification code' : 'Employee Portal password reset code',
      text: `Your verification code is ${otp}. It expires in 10 minutes.`
    });
    const response = { message: `Verification code sent to ${email}` };
    if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEBUG_OTP === 'true') response.debugOtp = otp;
    res.json(response);
  } catch (error) { next(error); }
});

async function verifyOtp(email, otp, type) {
  const { data: record, error: fetchError } = await db.from('auth_otps').select('code_hash, expires_at').eq('email', email).eq('type', type).maybeSingle();
  if (fetchError) throw fetchError;
  if (!record || new Date(record.expires_at).getTime() < Date.now() || !(await bcrypt.compare(String(otp), record.code_hash))) {
    const error = new Error('Invalid or expired verification code');
    error.status = 400;
    throw error;
  }
  const { error: deleteError } = await db.from('auth_otps').delete().eq('email', email).eq('type', type);
  if (deleteError) throw deleteError;
}

router.post('/auth/verify-otp-register', async (req, res, next) => {
  try {
    const name = requireString(req.body.name, 'Name');
    const email = requireString(req.body.email, 'Email').toLowerCase();
    const password = requirePassword(req.body.password);
    await verifyOtp(email, req.body.otp, 'register');
    const hashed = await bcrypt.hash(password, 12);
    const { data: user, error } = await db.from('users').insert({ name, department: req.body.department || 'IT', email, password: hashed, initials: initials(name), status: 'Working', role: 'Employee' }).select().single();
    if (error) throw error;
    await db.from('leave_balances').insert({ user_id: user.id, total_days: 24, used_days: 0 });
    res.json({ message: 'Account created successfully', token: signUser(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/auth/verify-otp-reset-password', async (req, res, next) => {
  try {
    const email = requireString(req.body.email, 'Email').toLowerCase();
    const password = requirePassword(req.body.newPassword, 'New password');
    await verifyOtp(email, req.body.otp, 'reset-password');
    const hashed = await bcrypt.hash(password, 12);
    const { error } = await db.from('users').update({ password: hashed }).ilike('email', email);
    if (error) throw error;
    res.json({ message: 'Password reset successfully' });
  } catch (error) { next(error); }
});

router.use(requireAuth);

router.get('/dashboard/summary', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const user = await getUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const date = today();
    const [{ data: entries }, { data: balances }, { data: leaves }] = await Promise.all([
      db.from('daily_work_entries').select('work_description').eq('user_id', userId).eq('entry_date', date).limit(1),
      db.from('leave_balances').select('total_days, used_days').eq('user_id', userId).limit(1),
      db.from('leave_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
    ]);
    const active = await getActiveLeave(userId, date);
    const details = leaveStatus(active);
    const balance = balances?.[0] || { total_days: 24, used_days: 0 };
    res.json({ user: { ...publicUser(user), status: details?.status || user.status }, todayWork: entries?.[0]?.work_description || '', leaveBalance: { ...balance, available_days: Math.max(0, Number(balance.total_days) - Number(balance.used_days)) }, recentLeaveRequests: leaves || [] });
  } catch (error) { next(error); }
});

router.get('/work-entry/history', async (req, res, next) => {
  try { const { data, error } = await db.from('daily_work_entries').select('*').eq('user_id', getUserId(req)).order('entry_date', { ascending: false }); if (error) throw error; res.json(data || []); } catch (error) { next(error); }
});

router.post('/work-entry', async (req, res, next) => {
  try {
    const description = typeof req.body.work_description === 'string' ? req.body.work_description : '';
    const userId = getUserId(req);
    const date = today();
    const { data: existing } = await db.from('daily_work_entries').select('id').eq('user_id', userId).eq('entry_date', date).maybeSingle();
    const result = existing
      ? await db.from('daily_work_entries').update({ work_description: description, updated_at: new Date().toISOString() }).eq('id', existing.id)
      : await db.from('daily_work_entries').insert({ user_id: userId, entry_date: date, work_description: description });
    if (result.error) throw result.error;
    res.json({ message: 'Work entry updated successfully', work_description: description });
  } catch (error) { next(error); }
});

router.get('/leave/history', async (req, res, next) => {
  try { const { data, error } = await db.from('leave_requests').select('*').eq('user_id', getUserId(req)).order('created_at', { ascending: false }); if (error) throw error; res.json(data || []); } catch (error) { next(error); }
});

router.post('/leave/apply', async (req, res, next) => {
  try {
    const { leave_type, start_date, end_date } = req.body;
    if (!leave_type || !start_date || !end_date) return res.status(400).json({ error: 'leave_type, start_date, and end_date are required' });
    const { error } = await db.from('leave_requests').insert({ user_id: getUserId(req), leave_type, start_date, end_date, days_count: Number(req.body.days_count) || 1, day_of_week: req.body.day_of_week || null, start_time: req.body.start_time || null, end_time: req.body.end_time || null, special_session: req.body.special_session || null, is_recurring: leave_type === 'Special Leave' || Boolean(req.body.is_recurring), status: 'Pending', reason: req.body.reason || '' });
    if (error) throw error;
    res.json({ message: 'Leave application submitted successfully' });
  } catch (error) { next(error); }
});

router.post('/leave/cancel', async (req, res, next) => {
  try {
    const { data: leave, error: fetchError } = await db.from('leave_requests').select('*').eq('id', req.body.id).eq('user_id', getUserId(req)).maybeSingle();
    if (fetchError) throw fetchError;
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    if (!['Pending', 'Approved'].includes(leave.status)) return res.status(400).json({ error: `Leave is already ${leave.status}` });
    const { error } = await db.from('leave_requests').update({ status: 'Cancelled' }).eq('id', leave.id); if (error) throw error;
    res.json({ message: 'Leave request cancelled successfully' });
  } catch (error) { next(error); }
});

router.patch('/user/status', async (req, res, next) => {
  try { const status = requireString(req.body.status, 'Status'); const { error } = await db.from('users').update({ status }).eq('id', getUserId(req)); if (error) throw error; res.json({ message: 'Status updated successfully', status }); } catch (error) { next(error); }
});

router.use('/admin', requireAdmin);

router.get('/admin/summary', async (req, res, next) => {
  try {
    const [{ data: users, error: usersError }, { data: works }, { data: activeLeaves }, { data: pending }] = await Promise.all([
      db.from('users').select('id, name, initials, department, status, role').order('name'),
      db.from('daily_work_entries').select('user_id, work_description').eq('entry_date', today()),
      db.from('leave_requests').select('*').eq('status', 'Approved').lte('start_date', today()).gte('end_date', today()),
      db.from('leave_requests').select('*, users (name, department, email)').eq('status', 'Pending').order('created_at', { ascending: false })
    ]);
    if (usersError) throw usersError;
    const workMap = Object.fromEntries((works || []).map(item => [item.user_id, item.work_description]));
    const leaveMap = Object.fromEntries((activeLeaves || []).map(item => [item.user_id, item]));
    const employees = (users || []).map(user => { const leave = leaveMap[user.id]; const details = leaveStatus(leave); return { ...user, today_work: workMap[user.id] || '', status: details?.status || user.status, leave_type: leave?.leave_type || null, leave_reason: leave?.reason || null, is_half_day: leave?.leave_type === 'Half Day', is_short_leave: leave?.leave_type === 'Short Leave' }; });
    const workingWorkforce = employees.filter(item => item.status === 'Working');
    const todaysLeave = employees.filter(item => item.status !== 'Working');
    res.json({ stats: { total_employees: employees.length, working_today: workingWorkforce.length, on_leave_today: todaysLeave.length, half_day: employees.filter(e => e.is_half_day).length, study_leave: employees.filter(e => e.leave_type === 'Study Leave').length, special_leave: employees.filter(e => e.leave_type === 'Special Leave').length, pending_requests: (pending || []).length }, workingWorkforce, todaysLeave, halfDayEmployees: employees.filter(e => e.is_half_day), studyLeaveEmployees: employees.filter(e => e.leave_type === 'Study Leave'), specialLeaveEmployees: employees.filter(e => e.leave_type === 'Special Leave'), pendingLeaveRequests: (pending || []).map(item => ({ ...item, employee_name: item.users?.name || 'Employee' })), allEmployees: employees });
  } catch (error) { next(error); }
});

router.get('/admin/employees', async (req, res, next) => {
  try { const { data, error } = await db.from('users').select('id, name, initials, department, status, role').order('name'); if (error) throw error; res.json(data || []); } catch (error) { next(error); }
});

router.get('/admin/work-activity', async (req, res, next) => {
  try { const { data, error } = await db.from('daily_work_entries').select('id, user_id, entry_date, work_description, created_at, updated_at, users (name, initials, department)').order('entry_date', { ascending: false }); if (error) throw error; res.json((data || []).map(item => ({ ...item, employee_name: item.users?.name, name: item.users?.name, department: item.users?.department, initials: item.users?.initials }))); } catch (error) { next(error); }
});

router.get('/admin/leave-calendar', async (req, res, next) => {
  try { const year = Number(req.query.year) || new Date().getFullYear(); const month = Number(req.query.month) || new Date().getMonth() + 1; const start = `${year}-${String(month).padStart(2, '0')}-01`; const end = new Date(year, month, 0).toISOString().slice(0, 10); const { data, error } = await db.from('leave_requests').select('id, user_id, leave_type, start_date, end_date, days_count, status, reason, users (name, initials, department)').eq('status', 'Approved').lte('start_date', end).gte('end_date', start); if (error) throw error; res.json((data || []).map(item => ({ ...item, employee_name: item.users?.name, name: item.users?.name, initials: item.users?.initials, department: item.users?.department }))); } catch (error) { next(error); }
});

router.post('/admin/leave/approve', async (req, res, next) => {
  try {
    const { data, error } = await db.rpc('record_leave_decision', { p_leave_id: req.body.id, p_status: 'Approved' });
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Pending leave request not found' });
    res.json({ message: 'Leave request approved successfully' });
  } catch (error) { next(error); }
});

router.post('/admin/leave/reject', async (req, res, next) => {
  try {
    const { data, error } = await db.rpc('record_leave_decision', { p_leave_id: req.body.id, p_status: 'Rejected' });
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Pending leave request not found' });
    res.json({ message: 'Leave request rejected successfully' });
  } catch (error) { next(error); }
});

router.use((error, req, res, next) => { console.error(error); res.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error' }); });

module.exports = router;