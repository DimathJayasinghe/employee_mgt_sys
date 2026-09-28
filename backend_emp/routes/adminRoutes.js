const express = require('express');
const router = express.Router();
const pool = require('../db');
const { initDatabase, getIsDbConnected, memoryStore } = require('../initDb');

// Helper to format date strings YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse "Monday:Morning,Wednesday:Evening" → "Mon (Morning), Wed (Evening)"
function formatSpecialDays(dayOfWeekStr) {
  if (!dayOfWeekStr) return 'Special Leave';
  const parts = dayOfWeekStr.split(',').map(p => p.trim());
  const formatted = parts.map(part => {
    if (part.includes(':')) {
      const [day, session] = part.split(':');
      return `${day.slice(0, 3)} (${session})`;
    }
    return part; // backwards compat with old format
  });
  return formatted.join(', ');
}

// Helper to determine active half-day session (Morning 8:30 AM - 12:30 PM, Evening 12:30 PM - 5:30 PM)
function getHalfDayDetails(emp) {
  if (!emp || (emp.leave_type !== 'Half Day' && !emp.is_half_day)) {
    return null;
  }

  let session = 'Morning';
  const text = `${emp.special_session || ''} ${emp.reason || ''} ${emp.start_time || ''}`.toLowerCase();
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

// Helper: format an employee row for admin views (no position field)
function formatEmp(emp) {
  let displayStatus = 'Working';
  const hd = emp.leave_type === 'Half Day' ? getHalfDayDetails(emp) : null;

  if (emp.leave_type === 'Study Leave') {
    if (emp.today_work && emp.today_work.trim() !== '') {
      displayStatus = 'Study Leave / Work Today';
    } else {
      displayStatus = 'Study Leave';
    }
  } else if (emp.leave_type === 'Half Day') {
    displayStatus = hd && hd.half_day_leave_now ? `Half Day (${hd.half_day_session})` : 'Working';
  } else if (emp.leave_type) {
    displayStatus = 'On Leave';
  } else if (emp.status && emp.status !== 'On Leave') {
    displayStatus = emp.status;
  }

  return {
    id: emp.id,
    name: emp.name,
    initials: emp.initials || emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    department: emp.department || 'General',
    status: displayStatus,
    today_work: emp.today_work || '',
    updated_ago: 'Today',
    is_half_day: hd ? hd.is_half_day : false,
    half_day_session: hd ? hd.half_day_session : null,
    half_day_leave_now: hd ? hd.half_day_leave_now : false,
    half_day_time: hd ? hd.leave_time : null,
    half_day_working_time: hd ? hd.working_time : null
  };
}

// GET /api/admin/summary
router.get('/summary', async (req, res) => {
  try {
    const todayStr = getTodayStr();

    if (!getIsDbConnected()) {
      await initDatabase();
    }

    if (!getIsDbConnected()) {
      return res.json({
        stats: { total_employees: 0, working_today: 0, on_leave_today: 0, half_day: 0, study_leave: 0, special_leave: 0, pending_requests: 0 },
        workingWorkforce: [],
        todaysLeave: [],
        halfDayEmployees: [],
        studyLeaveEmployees: [],
        specialLeaveEmployees: [],
        pendingLeaveRequests: []
      });
    }

    // Sync employee statuses automatically based on today's active approved leaves
    await pool.query(`
      UPDATE users u
      SET status = 'On Leave'
      WHERE u.id IN (
        SELECT DISTINCT user_id FROM leave_requests 
        WHERE status = 'Approved' AND ? BETWEEN start_date AND end_date
      )
    `, [todayStr]);

    await pool.query(`
      UPDATE users u
      SET status = 'Working'
      WHERE u.status = 'On Leave' AND u.id NOT IN (
        SELECT DISTINCT user_id FROM leave_requests 
        WHERE status = 'Approved' AND ? BETWEEN start_date AND end_date
      )
    `, [todayStr]);

    // Fetch all users (employees + admins) with today's work description and active approved leave info via LEFT JOIN
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.initials, u.department, u.status,
             COALESCE(dw.work_description, '') AS today_work,
             lr.leave_type, lr.days_count, lr.day_of_week, lr.start_time, lr.end_time, lr.special_session, lr.is_recurring, lr.reason, 
             DATE_FORMAT(lr.start_date, '%Y-%m-%d') AS start_date, 
             DATE_FORMAT(lr.end_date, '%Y-%m-%d') AS end_date
      FROM users u
      LEFT JOIN daily_work_entries dw
        ON dw.user_id = u.id AND dw.entry_date = ?
      LEFT JOIN leave_requests lr
        ON lr.user_id = u.id AND lr.status = 'Approved' AND ? BETWEEN lr.start_date AND lr.end_date
      ORDER BY u.name ASC
    `, [todayStr, todayStr]);

    // Fetch pending leave requests with employee names
    const [pending] = await pool.query(`
      SELECT lr.id, u.name AS employee_name, lr.leave_type,
             DATE_FORMAT(lr.start_date, '%Y-%m-%d') AS from_date, 
             DATE_FORMAT(lr.end_date, '%Y-%m-%d') AS to_date,
             lr.days_count, lr.day_of_week, lr.start_time, lr.end_time, lr.special_session, lr.is_recurring, lr.reason, lr.status,
             DATE_FORMAT(lr.created_at, '%Y-%m-%d') AS applied_date
      FROM leave_requests lr
      JOIN users u ON u.id = lr.user_id
      WHERE lr.status = 'Pending'
      ORDER BY lr.created_at DESC
    `);

    const pendingReqs = pending.map(r => ({
      ...r,
      from_date: r.from_date || '',
      to_date: r.to_date || '',
      applied_date: r.applied_date || '',
      duration: r.leave_type === 'Special Leave' && r.day_of_week
        ? formatSpecialDays(r.day_of_week)
        : `${r.days_count} ${r.days_count === 1 ? 'Day' : 'Days'}`
    }));

    // Helper to format employee with leave info
    const formatEmpWithLeave = (e) => {
      let timeSlot = 'Half Day';
      if (e.leave_type === 'Special Leave') {
        timeSlot = e.day_of_week ? formatSpecialDays(e.day_of_week) : 'Special Leave';
      } else if (e.reason && e.reason.includes('Morning')) timeSlot = 'Morning Session';
      else if (e.reason && e.reason.includes('Evening')) timeSlot = 'Evening Session';

      return {
        ...formatEmp(e),
        leave_type: e.leave_type || 'Leave',
        half_day_type: timeSlot,
        time_slot: timeSlot,
        day_of_week: e.day_of_week || null,
        start_time: e.start_time || null,
        end_time: e.end_time || null,
        from_date: e.start_date || '',
        to_date: e.end_date || '',
        duration: e.leave_type === 'Special Leave' && e.day_of_week
          ? formatSpecialDays(e.day_of_week)
          : (e.days_count ? `${e.days_count} ${e.days_count === 1 ? 'Day' : 'Days'}` : 'Full Day'),
        reason: e.reason || 'Personal'
      };
    };

    // Stats
    const total_employees  = rows.length;
    const working_today    = rows.filter(e => e.status === 'Working' || (e.today_work && e.today_work.trim() !== '')).length;
    const on_leave_today   = rows.filter(e => e.status === 'On Leave' && (!e.leave_type || e.leave_type !== 'Study Leave')).length;
    const half_day         = rows.filter(e => e.leave_type === 'Half Day' || e.status === 'Half Day').length;
    const study_leave      = rows.filter(e => e.leave_type === 'Study Leave' || e.status === 'Study Leave').length;
    const special_leave    = rows.filter(e => e.leave_type === 'Special Leave').length;
    const pending_requests = pendingReqs.length;

    // Partition into status groups
    const workingWorkforce    = rows.filter(e => e.status === 'Working' || (e.today_work && e.today_work.trim() !== '')).map(formatEmp);
    const todaysLeave         = rows.filter(e => e.status === 'On Leave' && (!e.leave_type || e.leave_type !== 'Study Leave')).map(formatEmpWithLeave);
    const halfDayEmployees    = rows.filter(e => e.leave_type === 'Half Day' || e.status === 'Half Day').map(formatEmpWithLeave);
    const studyLeaveEmployees = rows.filter(e => e.leave_type === 'Study Leave' || e.status === 'Study Leave').map(formatEmpWithLeave);
    const specialLeaveEmployees = rows.filter(e => e.leave_type === 'Special Leave').map(formatEmpWithLeave);

    res.json({
      stats: { total_employees, working_today, on_leave_today, half_day, study_leave, special_leave, pending_requests },
      workingWorkforce,
      todaysLeave,
      halfDayEmployees,
      studyLeaveEmployees,
      specialLeaveEmployees,
      pendingLeaveRequests: pendingReqs
    });
  } catch (err) {
    console.error('Error fetching admin summary:', err);
    res.status(500).json({ error: 'Failed to fetch admin summary' });
  }
});

// GET /api/admin/employees?department=All
router.get('/employees', async (req, res) => {
  try {
    const todayStr = getTodayStr();
    if (!getIsDbConnected()) {
      await initDatabase();
    }

    if (!getIsDbConnected()) {
      return res.json([]);
    }

    const { department } = req.query;
    let query = `
      SELECT u.id, u.name, u.department, u.email, u.initials, u.status, u.role,
             COALESCE(dw.work_description, '') AS today_work,
             lr.leave_type
      FROM users u
      LEFT JOIN daily_work_entries dw
        ON dw.user_id = u.id AND dw.entry_date = ?
      LEFT JOIN leave_requests lr
        ON lr.user_id = u.id AND lr.status = 'Approved' AND ? BETWEEN lr.start_date AND lr.end_date
      WHERE 1=1
    `;
    const params = [todayStr, todayStr];

    if (department && department !== 'All departments') {
      query += ' AND LOWER(u.department) = ?';
      params.push(department.toLowerCase());
    }

    query += ' ORDER BY u.name ASC';

    const [rows] = await pool.query(query, params);

    const formatted = rows.map(e => {
      let displayStatus = 'Working';
      const hd = e.leave_type === 'Half Day' ? getHalfDayDetails(e) : null;

      if (e.leave_type === 'Study Leave') {
        if (e.today_work && e.today_work.trim() !== '') {
          displayStatus = 'Study Leave / Work Today';
        } else {
          displayStatus = 'Study Leave';
        }
      } else if (e.leave_type === 'Half Day') {
        displayStatus = hd && hd.half_day_leave_now ? `Half Day (${hd.half_day_session})` : 'Working';
      } else if (e.leave_type) {
        displayStatus = 'On Leave';
      } else if (e.status && e.status !== 'On Leave') {
        displayStatus = e.status;
      }

      return {
        ...e,
        status: displayStatus,
        is_half_day: hd ? hd.is_half_day : false,
        half_day_session: hd ? hd.half_day_session : null,
        half_day_leave_now: hd ? hd.half_day_leave_now : false,
        half_day_time: hd ? hd.leave_time : null,
        half_day_working_time: hd ? hd.working_time : null
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching employees list:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/admin/work-activity
router.get('/work-activity', async (req, res) => {
  try {
    if (!getIsDbConnected()) await initDatabase();
    if (!getIsDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const [rows] = await pool.query(`
      SELECT dw.id, dw.user_id, u.name AS employee_name, u.department, u.initials,
             dw.entry_date, dw.work_description, dw.updated_at
      FROM daily_work_entries dw
      JOIN users u ON u.id = dw.user_id
      ORDER BY dw.entry_date DESC, dw.updated_at DESC
    `);

    const formatted = rows.map(r => ({
      ...r,
      entry_date: r.entry_date ? new Date(r.entry_date).toISOString().split('T')[0] : ''
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching work activity:', err);
    res.status(500).json({ error: 'Failed to fetch work activity' });
  }
});

// GET /api/admin/leave-calendar?year=2026&month=9
router.get('/leave-calendar', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

    if (getIsDbConnected()) {
      const [leaves] = await pool.query(`
        SELECT lr.id, lr.user_id, u.name AS employee_name, u.department, u.initials,
               lr.leave_type, 
               DATE_FORMAT(lr.start_date, '%Y-%m-%d') AS start_date, 
               DATE_FORMAT(lr.end_date, '%Y-%m-%d') AS end_date, 
               lr.days_count, lr.status, lr.reason
        FROM leave_requests lr
        JOIN users u ON u.id = lr.user_id
        WHERE lr.status = 'Approved'
          AND (
            (YEAR(lr.start_date) = ? AND MONTH(lr.start_date) = ?)
            OR (YEAR(lr.end_date) = ? AND MONTH(lr.end_date) = ?)
            OR (lr.start_date <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01')) 
                AND lr.end_date >= CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
          )
        ORDER BY lr.start_date ASC
      `, [year, month, year, month, year, month, year, month]);

      const formatted = leaves.map(l => ({
        id: l.id,
        user_id: l.user_id,
        employee_name: l.employee_name,
        department: l.department || 'General',
        initials: l.initials || l.employee_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        leave_type: l.leave_type,
        start_date: l.start_date || '',
        end_date: l.end_date || '',
        days_count: l.days_count,
        status: l.status,
        reason: l.reason || ''
      }));

      return res.json(formatted);
    } else {
      const approved = memoryStore.leaveRequests.filter(r => r.status === 'Approved');
      const formatted = approved.map(l => {
        const u = memoryStore.user.id === l.user_id ? memoryStore.user : { name: 'Employee', department: 'IT', initials: 'EM' };
        return {
          id: l.id,
          user_id: l.user_id,
          employee_name: u.name,
          department: u.department,
          initials: u.initials,
          leave_type: l.leave_type,
          start_date: l.start_date,
          end_date: l.end_date,
          days_count: l.days_count,
          status: l.status,
          reason: l.reason
        };
      });
      return res.json(formatted);
    }
  } catch (err) {
    console.error('Error fetching leave calendar data:', err);
    res.status(500).json({ error: 'Failed to fetch leave calendar data' });
  }
});

// POST /api/admin/leave/approve
router.post('/leave/approve', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Request ID is required' });

  try {
    if (!getIsDbConnected()) await initDatabase();

    if (getIsDbConnected()) {
      const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
      if (rows.length > 0) {
        const lReq = rows[0];
        const daysCount = parseFloat(lReq.days_count) || 1.0;
        const todayStr = getTodayStr();

        // Mark leave as approved
        await pool.query('UPDATE leave_requests SET status = ? WHERE id = ?', ['Approved', id]);

        // Set employee status to On Leave only if today is within leave date range
        const startDateStr = lReq.start_date ? new Date(lReq.start_date).toISOString().split('T')[0] : '';
        const endDateStr = lReq.end_date ? new Date(lReq.end_date).toISOString().split('T')[0] : '';
        if (startDateStr && endDateStr && todayStr >= startDateStr && todayStr <= endDateStr) {
          await pool.query('UPDATE users SET status = ? WHERE id = ?', ['On Leave', lReq.user_id]);
        }

        // Upsert leave balance (deduct days)
        await pool.query(`
          INSERT INTO leave_balances (user_id, total_days, used_days)
          VALUES (?, 24.00, ?)
          ON DUPLICATE KEY UPDATE used_days = used_days + ?
        `, [lReq.user_id, daysCount, daysCount]);
      }
    } else {
      const lReq = memoryStore.pendingLeaveRequests.find(l => l.id == id);
      if (lReq) {
        lReq.status = 'Approved';
        const todayStr = getTodayStr();
        const emp = (memoryStore.allEmployees || []).find(e => e.id == lReq.user_id);
        if (emp && lReq.start_date <= todayStr && lReq.end_date >= todayStr) {
          emp.status = 'On Leave';
        }
        const daysCount = parseFloat(lReq.days_count) || 1.0;
        memoryStore.leaveBalance.used_days = (memoryStore.leaveBalance.used_days || 0) + daysCount;
        memoryStore.leaveBalance.available_days = Math.max(0, memoryStore.leaveBalance.total_days - memoryStore.leaveBalance.used_days);
      }
    }

    res.json({ message: 'Leave request approved successfully', id });
  } catch (err) {
    console.error('Error approving leave request:', err);
    res.status(500).json({ error: 'Failed to approve leave request', details: err.message });
  }
});

// POST /api/admin/leave/reject
router.post('/leave/reject', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Request ID is required' });

  try {
    if (!getIsDbConnected()) await initDatabase();

    if (getIsDbConnected()) {
      const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
      if (rows.length > 0) {
        const lReq = rows[0];

        // Mark leave as rejected
        await pool.query('UPDATE leave_requests SET status = ? WHERE id = ?', ['Rejected', id]);

        // Revert employee status back to Working
        await pool.query('UPDATE users SET status = ? WHERE id = ? AND status = ?', ['Working', lReq.user_id, 'On Leave']);
      }
    } else {
      const lReq = memoryStore.pendingLeaveRequests.find(l => l.id == id);
      if (lReq) {
        lReq.status = 'Rejected';
      }
    }

    res.json({ message: 'Leave request rejected', id });
  } catch (err) {
    console.error('Error rejecting leave request:', err);
    res.status(500).json({ error: 'Failed to reject leave request', details: err.message });
  }
});

module.exports = router;
