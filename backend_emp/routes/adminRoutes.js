const express = require('express');
const router = express.Router();
const { adminService } = require('../services/backendService');
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
    const { id, admin_email } = req.body;
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

module.exports = router;
