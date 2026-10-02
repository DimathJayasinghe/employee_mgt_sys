const express = require('express');
const router = express.Router();
const zohoService = require('../services/zohoService');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// GET /api/zoho/clients - Fetch Zoho Books clients list
router.get('/zoho/clients', async (req, res) => {
  try {
    const result = await zohoService.getZohoClients();
    res.json(result);
  } catch (err) {
    console.error('Fetch Zoho clients error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch Zoho clients' });
  }
});

// GET /api/admin/client-analytics - Fetch client analytics report for admin
router.get('/admin/client-analytics', async (req, res) => {
  try {
    const result = await zohoService.getClientAnalytics();
    res.json(result);
  } catch (err) {
    console.error('Fetch client analytics error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch client analytics' });
  }
});

module.exports = router;
