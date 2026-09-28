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

  const isLeaveNow = session === 'Morning' ? isMorningNow : !isMorningNow;

  return {
    is_half_day: true,
    half_day_session: session,
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

// GET /api/dashboard/summary?user_id=X
router.get('/dashboard/summary', async (req, res) => {
  const userId = parseInt(req.query.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id is required' });

  try {
    const todayStr = getTodayStr();

    if (!getIsDbConnected()) await initDatabase();

    if (getIsDbConnected()) {
      const [users] = await pool.query(
        'SELECT id, name, email, initials, status, department FROM users WHERE id = ?',
        [userId]
      );
      if (users.length === 0) return res.status(404).json({ error: 'User not found' });
      const user = users[0];

      const [entries] = await pool.query(
        'SELECT work_description FROM daily_work_entries WHERE user_id = ? AND entry_date = ? ORDER BY created_at DESC LIMIT 1',
        [userId, todayStr]
      );
      const todayEntry = entries[0] ? entries[0].work_description : '';

      const [balances] = await pool.query('SELECT * FROM leave_balances WHERE user_id = ?', [userId]);
      const balance = balances[0] || { total_days: 24, used_days: 0 };
      const available_days = Math.max(0, parseFloat(balance.total_days || 24) - parseFloat(balance.used_days || 0));

      // Fetch active approved leave for today
      const [activeLeavesToday] = await pool.query(
        `SELECT leave_type, special_session, start_time, end_time, reason FROM leave_requests 
         WHERE user_id = ? AND status = 'Approved' AND ? BETWEEN start_date AND end_date LIMIT 1`,
        [userId, todayStr]
      );

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
        } else {
          calculatedStatus = 'On Leave';
        }
      } else if (user.status && user.status !== 'On Leave') {
        calculatedStatus = user.status;
      }

      const [leaves] = await pool.query(
        `SELECT id, leave_type, 
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, 
                days_count, day_of_week, start_time, end_time, special_session, status, reason 
         FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
        [userId]
      );

      return res.json({
        user: { 
          id: user.id, 
          name: user.name, 
          title: user.title, 
          email: user.email, 
          initials: user.initials, 
          status: calculatedStatus,
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
        leaveBalance: { total_days: balance.total_days, used_days: balance.used_days, available_days },
        recentLeaveRequests: leaves
      });
    } else {
      const foundMemUser = (memoryStore.allEmployees || []).find(e => e.id === userId) || memoryStore.user;
      const todayEntryObj = memoryStore.workEntries.find(e => e.user_id === userId && e.entry_date === todayStr) || memoryStore.workEntries.find(e => e.entry_date === todayStr);
      const available_days = memoryStore.leaveBalance.total_days - memoryStore.leaveBalance.used_days;
      return res.json({
        user: foundMemUser,
        todayWork: todayEntryObj ? todayEntryObj.work_description : '',
        leaveBalance: { ...memoryStore.leaveBalance, available_days },
        recentLeaveRequests: memoryStore.leaveRequests
      });
    }
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// POST /api/work-entry - Save or update today's work description
router.post('/work-entry', async (req, res) => {
  const { user_id, work_description } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  if (typeof work_description !== 'string') return res.status(400).json({ error: 'work_description is required' });

  const todayStr = getTodayStr();

  try {
    if (!getIsDbConnected()) await initDatabase();
    if (getIsDbConnected()) {
      const [existing] = await pool.query(
        'SELECT id FROM daily_work_entries WHERE user_id = ? AND entry_date = ?',
        [user_id, todayStr]
      );

      if (existing.length > 0) {
        await pool.query(
          'UPDATE daily_work_entries SET work_description = ? WHERE id = ?',
          [work_description, existing[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO daily_work_entries (user_id, entry_date, work_description) VALUES (?, ?, ?)',
          [user_id, todayStr, work_description]
        );
      }
    } else {
      const existing = memoryStore.workEntries.find(e => e.entry_date === todayStr && e.user_id === user_id);
      if (existing) {
        existing.work_description = work_description;
      } else {
        memoryStore.workEntries.unshift({ id: Date.now(), user_id, entry_date: todayStr, work_description, created_at: new Date().toISOString() });
      }
    }

    res.json({ message: 'Work entry updated successfully', work_description });
  } catch (err) {
    console.error('Error saving work entry:', err);
    res.status(500).json({ error: 'Failed to save work entry' });
  }
});

// GET /api/work-entry/history?user_id=X
router.get('/work-entry/history', async (req, res) => {
  const userId = parseInt(req.query.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id is required' });

  try {
    if (!getIsDbConnected()) await initDatabase();
    if (getIsDbConnected()) {
      const [rows] = await pool.query(
        'SELECT * FROM daily_work_entries WHERE user_id = ? ORDER BY entry_date DESC',
        [userId]
      );
      res.json(rows);
    } else {
      res.json(memoryStore.workEntries.filter(e => e.user_id === userId));
    }
  } catch (err) {
    console.error('Error fetching work history:', err);
    res.status(500).json({ error: 'Failed to fetch work history' });
  }
});

const nodemailer = require('nodemailer');

// Send Leave Request Email Notification
async function sendLeaveNotificationEmail(userObj, leaveDetails) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Skipping email notification: EMAIL_USER / EMAIL_PASS not set.');
    return;
  }

  try {
    let transporter;
    const isGmail = (process.env.EMAIL_USER || '').includes('@gmail.com') || (process.env.EMAIL_HOST || '').includes('gmail');
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #ffffff;">
        <div style="background-color: #022851; padding: 16px 20px; border-radius: 8px; color: #ffffff; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px;">New Leave Application Request</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.85;">P W Holdings - Employee Management System</p>
        </div>

        <p style="font-size: 14px; color: #334155;">A new leave application has been submitted and is pending review. Below are the details:</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; color: #475569; width: 35%;">Employee Name:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold;">${userObj.name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; color: #475569;">Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${userObj.email || 'N/A'}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; color: #475569;">Department:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${userObj.department || 'IT'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; color: #475569;">Leave Type:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #2563eb; font-weight: bold;">${leaveDetails.leave_type}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; color: #475569;">Duration / Dates:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${leaveDetails.start_date} to ${leaveDetails.end_date} (${leaveDetails.days_count} ${leaveDetails.days_count === 1 ? 'day' : 'days'})</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; color: #475569;">Reason / Notes:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${leaveDetails.reason || 'None provided'}</td>
          </tr>
        </table>

        <div style="margin-top: 25px; padding: 12px; background-color: #f1f5f9; border-radius: 6px; font-size: 12px; color: #64748b; text-align: center;">
          Please log into the <strong>Admin Dashboard</strong> to approve or reject this request.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"PeopleOps Leave System" <${process.env.EMAIL_USER}>`,
      to: 'hashan@pwholdings.lk',
      cc: ['nishani@pwholdings.lk', 'channa@pwholdings.lk', 'pasindu.buddhima@pwholdings.lk'],
      subject: `Leave Request: ${userObj.name || 'Employee'} - ${leaveDetails.leave_type} (${leaveDetails.start_date})`,
      html: htmlContent
    });

    console.log(`✅ Leave notification email sent to hashan@pwholdings.lk with CC to nishani@pwholdings.lk, channa@pwholdings.lk, pasindu.buddhima@pwholdings.lk`);
  } catch (err) {
    console.error('Error sending leave notification email:', err);
  }
}

// POST /api/send-leave-email
router.post('/send-leave-email', async (req, res) => {
  const { user, leaveDetails } = req.body;
  if (!user || !leaveDetails) {
    return res.status(400).json({ error: 'user and leaveDetails are required' });
  }

  try {
    await sendLeaveNotificationEmail(user, leaveDetails);
    res.json({ message: 'Leave notification email sent successfully' });
  } catch (err) {
    console.error('Error in /send-leave-email:', err);
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
});

// POST /api/leave/apply
router.post('/leave/apply', async (req, res) => {
  const { user_id, leave_type, start_date, end_date, days_count, reason, day_of_week, start_time, end_time, is_recurring, special_session } = req.body;

  if (!user_id || !leave_type || !start_date || !end_date) {
    return res.status(400).json({ error: 'user_id, leave_type, start_date, and end_date are required' });
  }

  const days = Number(days_count) || 1;
  const isSpecial = leave_type === 'Special Leave';
  const finalRecurring = isSpecial ? 1 : (is_recurring ? 1 : 0);

  try {
    let applicantUser = { id: user_id, name: 'Employee', email: '', department: 'IT' };

    if (!getIsDbConnected()) await initDatabase();

    if (getIsDbConnected()) {
      const [uRows] = await pool.query('SELECT name, email, department FROM users WHERE id = ?', [user_id]);
      if (uRows.length > 0) {
        applicantUser = uRows[0];
      }

      await pool.query(
        `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, day_of_week, start_time, end_time, special_session, is_recurring, status, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
        [user_id, leave_type, start_date, end_date, days, day_of_week || null, start_time || null, end_time || null, isSpecial ? (special_session || 'Morning') : null, finalRecurring, reason || '']
      );
    } else {
      if (memoryStore.user && memoryStore.user.id === Number(user_id)) {
        applicantUser = memoryStore.user;
      }

      memoryStore.leaveRequests.unshift({
        id: Date.now(), user_id, leave_type, start_date, end_date,
        days_count: days, day_of_week: day_of_week || null, start_time: start_time || null, end_time: end_time || null, special_session: isSpecial ? (special_session || 'Morning') : null, is_recurring: finalRecurring, status: 'Pending', reason: reason || '',
        created_at: new Date().toISOString()
      });
    }

    // Trigger async email notification
    sendLeaveNotificationEmail(applicantUser, {
      leave_type,
      start_date,
      end_date,
      days_count: days,
      day_of_week,
      start_time,
      end_time,
      reason: reason || ''
    });

    res.json({ message: 'Leave request submitted successfully' });
  } catch (err) {
    console.error('Error submitting leave request:', err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// GET /api/leave/history?user_id=X
router.get('/leave/history', async (req, res) => {
  const userId = parseInt(req.query.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id is required' });

  try {
    if (!getIsDbConnected()) await initDatabase();
    if (getIsDbConnected()) {
      const [leaves] = await pool.query(
        `SELECT id, user_id, leave_type, 
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, 
                days_count, day_of_week, start_time, end_time, special_session, is_recurring, status, reason, created_at 
         FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      res.json(leaves);
    } else {
      res.json(memoryStore.leaveRequests.filter(l => l.user_id === userId));
    }
  } catch (err) {
    console.error('Error fetching leave history:', err);
    res.status(500).json({ error: 'Failed to fetch leave history' });
  }
});

// PATCH /api/user/status
router.patch('/user/status', async (req, res) => {
  const { user_id, status } = req.body;
  if (!user_id || !status) return res.status(400).json({ error: 'user_id and status are required' });

  try {
    if (!getIsDbConnected()) await initDatabase();
    if (getIsDbConnected()) {
      await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, user_id]);
    } else {
      memoryStore.user.status = status;
    }
    res.json({ message: 'Status updated successfully', status });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
