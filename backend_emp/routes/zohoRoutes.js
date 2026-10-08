const express = require('express');
const router = express.Router();
const zohoService = require('../services/zohoService');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

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
router.get('/admin/client-analytics', requireAdmin, async (req, res) => {
  try {
    const result = await zohoService.getClientAnalytics();
    res.json(result);
  } catch (err) {
    console.error('Fetch client analytics error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch client analytics' });
  }
});

// POST /api/zoho/employee - Create employee record directly in Zoho Books Custom Module cm_employee
router.post('/zoho/employee', requireAdmin, async (req, res) => {
  try {
    const { emp_code, name, dob, date_joined, designation, card_designation, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required fields.' });
    }
    const result = await zohoService.createZohoEmployeeRecord({
      emp_code,
      name,
      dob,
      date_joined,
      designation,
      card_designation,
      email
    });
    res.json(result);
  } catch (err) {
    console.error('Create Zoho employee route error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to submit employee entry to Zoho Books' });
  }
});

module.exports = router;
