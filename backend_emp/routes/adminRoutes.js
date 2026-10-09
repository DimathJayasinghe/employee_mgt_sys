const express = require('express');
const router = express.Router();
const { adminService } = require('../services/backendService');
const { sendDailyBackupEmail, sendMonthlyBackupEmail } = require('../services/backupScheduler');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/summary
router.get('/summary', async (req, res) => {
  try {
    const result = await adminService.getAdminSummary();
    res.json(result);
  } catch (err) {
    console.error('Admin summary error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch admin summary' });
  }
});

// GET /api/admin/employees
router.get('/employees', async (req, res) => {
  try {
    const result = await adminService.getAdminEmployees();
    res.json(result);
  } catch (err) {
    console.error('Admin employees error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch employees' });
  }
});

// GET /api/admin/work-activity
router.get('/work-activity', async (req, res) => {
  try {
    const result = await adminService.getAdminWorkActivity();
    res.json(result);
  } catch (err) {
    console.error('Admin work activity error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch work activity' });
  }
});

// GET /api/admin/leave-calendar
router.get('/leave-calendar', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const result = await adminService.getAdminLeaveCalendar(year, month);
    res.json(result);
  } catch (err) {
    console.error('Admin leave calendar error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch leave calendar' });
  }
});

// POST /api/admin/leave/approve
router.post('/leave/approve', async (req, res) => {
  try {
    const { id } = req.body;
    // Strictly use authenticated user's email from JWT token to prevent spoofing
    const admin_email = req.user?.email;
    const result = await adminService.approveLeave(id, admin_email);
    res.json(result);
  } catch (err) {
    console.error('Approve leave error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to approve leave' });
  }
});

// POST /api/admin/leave/reject
router.post('/leave/reject', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await adminService.rejectLeave(id);
    res.json(result);
  } catch (err) {
    console.error('Reject leave error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to reject leave' });
  }
});

// GET /api/admin/backup - Downloads complete Supabase database backup JSON
router.get('/backup', async (req, res) => {
  try {
    const backupData = await adminService.generateFullBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `supabase_database_backup_${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.json(backupData);
  } catch (err) {
    console.error('Admin database backup error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to generate database backup' });
  }
});

// POST /api/admin/send-backup-email - Manually trigger database backup email dispatch
router.post('/send-backup-email', async (req, res) => {
  try {
    const { to, cc } = req.body || {};
    const result = await sendDailyBackupEmail({ to, cc, isManual: true });
    if (result.success) {
      return res.json({ message: 'Backup email sent successfully', details: result });
    } else {
      return res.status(500).json({ error: result.reason || result.error || 'Failed to send backup email' });
    }
  } catch (err) {
    console.error('Admin send backup email error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to send backup email' });
  }
});

module.exports = router;
