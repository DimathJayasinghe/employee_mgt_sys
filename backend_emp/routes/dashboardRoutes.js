const express = require('express');
const router = express.Router();
const { dashboardService } = require('../services/backendService');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// GET /api/dashboard/summary?user_id=X
router.get('/dashboard/summary', async (req, res) => {
  try {
    const userId = req.query.user_id || req.user?.id;
    if (!userId) return res.status(400).json({ error: 'user_id is required' });
    const result = await dashboardService.getDashboardSummary(userId);
    res.json(result);
  } catch (err) {
    console.error('Dashboard summary error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard summary' });
  }
});

// GET /api/work-entry/history?user_id=X
router.get('/work-entry/history', async (req, res) => {
  try {
    const userId = req.query.user_id || req.user?.id;
    if (!userId) return res.status(400).json({ error: 'user_id is required' });
    const result = await dashboardService.getWorkHistory(userId);
    res.json(result);
  } catch (err) {
    console.error('Work history error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch work history' });
  }
});

// POST /api/work-entry
router.post('/work-entry', async (req, res) => {
  try {
    const userId = req.body.user_id || req.user?.id;
    const workDescription = req.body.work_description;
    const result = await dashboardService.saveWorkEntry(userId, workDescription);
    res.json(result);
  } catch (err) {
    console.error('Save work entry error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to save work entry' });
  }
});

// GET /api/leave/history?user_id=X
router.get('/leave/history', async (req, res) => {
  try {
    const userId = req.query.user_id || req.user?.id;
    if (!userId) return res.status(400).json({ error: 'user_id is required' });
    const result = await dashboardService.getLeaveHistory(userId);
    res.json(result);
  } catch (err) {
    console.error('Leave history error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch leave history' });
  }
});

// POST /api/leave/apply
router.post('/leave/apply', async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.user_id && req.user?.id) body.user_id = req.user.id;
    const result = await dashboardService.applyLeave(body);
    res.json(result);
  } catch (err) {
    console.error('Apply leave error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to submit leave application' });
  }
});

// POST /api/leave/cancel
router.post('/leave/cancel', async (req, res) => {
  try {
    const { id, user_id } = req.body;
    const finalUserId = user_id || req.user?.id;
    const result = await dashboardService.cancelLeave(id, finalUserId);
    res.json(result);
  } catch (err) {
    console.error('Cancel leave error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to cancel leave' });
  }
});

// PATCH /api/user/status
router.patch('/user/status', async (req, res) => {
  try {
    const userId = req.body.user_id || req.user?.id;
    const status = req.body.status;
    const result = await dashboardService.updateUserStatus(userId, status);
    res.json(result);
  } catch (err) {
    console.error('Update status error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to update status' });
  }
});

module.exports = router;
