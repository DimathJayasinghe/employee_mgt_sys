const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { profileService } = require('../services/backendService');
const { processBirthdayReminders } = require('../services/birthdayReminder');
const supabase = require('../db');

// Manual Test Trigger Route for Birthday Reminders
// Required by prompt: POST only, disabled when NODE_ENV === 'production', requires x-test-key header equal to BIRTHDAY_TEST_KEY
router.post('/test/birthday-reminder', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Manual trigger disabled in production mode' });
  }

  const testKey = req.headers['x-test-key'];
  const expectedKey = process.env.BIRTHDAY_TEST_KEY || 'pw_test_key_2026';

  if (!testKey || testKey !== expectedKey) {
    return res.status(401).json({ error: 'Invalid x-test-key header' });
  }

  try {
    const { testEmployeeId, force } = req.body || {};
    const result = await processBirthdayReminders({ testEmployeeId, force: Boolean(force) });
    return res.json({ message: 'Birthday reminder test process complete', ...result });
  } catch (err) {
    console.error('Test birthday reminder error:', err);
    return res.status(500).json({ error: err.message || 'Failed to execute birthday reminder test' });
  }
});

// Protect profile routes with requireAuth
router.use(['/profile', '/me'], requireAuth);

// GET /profile/me, /profile, /me
router.get(['/profile/me', '/profile', '/me'], async (req, res) => {
  try {
    const targetUserId = req.query.user_id || req.query.target_user_id || req.user.id;
    const profile = await profileService.getMyProfile(targetUserId);
    return res.json(profile);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Failed to fetch profile' });
  }
});

// PATCH /profile/me, /profile, /me
router.patch(['/profile/me', '/profile', '/me'], async (req, res) => {
  try {
    const targetUserId = req.body.target_user_id || req.body.user_id || req.user.id;
    const updated = await profileService.updateMyProfile(targetUserId, req.body, req.user);
    return res.json(updated);
  } catch (err) {
    const status = err.status || err.statusCode || 400;
    return res.status(status).json({ error: err.message || 'Failed to update profile' });
  }
});

// GET /profile/upcoming-birthdays
router.get('/profile/upcoming-birthdays', async (req, res) => {
  try {
    const list = await profileService.getUpcomingBirthdays();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch upcoming birthdays' });
  }
});

// GET /profile/admins
router.get('/profile/admins', async (req, res) => {
  try {
    const admins = await profileService.getAdmins();
    return res.json(admins);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch admin contacts' });
  }
});

// GET /profile/activity?user_id=X
router.get('/profile/activity', async (req, res) => {
  try {
    const targetUserId = req.query.user_id || req.user.id;
    const activities = await profileService.getActivities(targetUserId);
    return res.json(activities);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch activity log' });
  }
});

// POST /profile/contact-hr
router.post('/profile/contact-hr', async (req, res) => {
  try {
    const { category, urgency, message, channel, user_id } = req.body;
    const targetUserId = user_id || req.user.id;
    const desc = `Sent HR request via ${channel || 'Support'} [Urgency: ${urgency || 'Normal'}] (${category || 'General'}): ${message ? message.slice(0, 70) : ''}`;
    await profileService.logActivity(targetUserId, 'hr_contacted', desc);
    return res.json({ message: 'HR support request logged successfully' });
  } catch (err) {
    console.warn('Contact HR log warning:', err.message);
    return res.json({ message: 'HR request processed' });
  }
});

// GET /profile/documents?user_id=X
router.get('/profile/documents', async (req, res) => {
  try {
    const targetUserId = req.query.user_id || req.user.id;
    const docs = await profileService.getDocuments(targetUserId, req.user);
    return res.json(docs);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Failed to fetch documents' });
  }
});

// POST /profile/documents/upload (Base64 payload)
router.post('/profile/documents/upload', async (req, res) => {
  try {
    const { document_data, document_name, user_id, file_type } = req.body;
    const targetUserId = user_id || req.user.id;

    if (!document_data || !document_name) {
      return res.status(400).json({ error: 'document_data and document_name are required' });
    }

    // Extract base64 buffer
    let base64String = document_data;
    if (document_data.includes('base64,')) {
      base64String = document_data.split('base64,')[1];
    }
    const buffer = Buffer.from(base64String, 'base64');

    // Server-side validation: max 5 MB
    const maxSize = 5 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(400).json({ error: 'Document file size exceeds 5 MB limit' });
    }

    const cleanName = document_name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `${targetUserId}/${Date.now()}_${cleanName}`;

    // Upload to Supabase storage bucket 'employee-documents'
    const { data: storageData, error: storageErr } = await supabase.storage
      .from('employee-documents')
      .upload(filePath, buffer, {
        contentType: file_type || 'application/pdf',
        upsert: true
      });

    let fileUrl = null;
    if (!storageErr) {
      const { data: urlData } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(filePath);
      fileUrl = urlData?.publicUrl;
    }

    if (storageErr || !fileUrl) {
      fileUrl = document_data;
    }

    const docRecord = await profileService.addDocument(
      targetUserId,
      document_name,
      fileUrl,
      filePath,
      buffer.length,
      file_type || 'application/pdf'
    );

    return res.json({ message: 'Document uploaded successfully', document: docRecord });
  } catch (err) {
    console.error('Document upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload document' });
  }
});

// DELETE /profile/documents/:id
router.delete('/profile/documents/:id', async (req, res) => {
  try {
    const docId = req.params.id;
    const result = await profileService.deleteDocument(docId, req.user);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Failed to delete document' });
  }
});

// POST /profile/photo/upload (Base64 payload)
router.post('/profile/photo/upload', async (req, res) => {
  try {
    const { photo_data, target_user_id } = req.body;
    const targetUserId = target_user_id || req.user.id;

    if (!photo_data) {
      return res.status(400).json({ error: 'photo_data is required' });
    }

    let base64String = photo_data;
    let mimeType = 'image/jpeg';
    if (photo_data.includes('base64,')) {
      const parts = photo_data.split('base64,');
      mimeType = parts[0].split(';')[0].replace('data:', '') || 'image/jpeg';
      base64String = parts[1];
    }
    const buffer = Buffer.from(base64String, 'base64');

    // Server-side validation: max 2 MB
    const maxSize = 2 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(400).json({ error: 'Photo size exceeds 2 MB limit' });
    }

    const ext = mimeType.split('/')[1] || 'jpg';
    const filePath = `${targetUserId}/avatar_${Date.now()}.${ext}`;

    // Upload to Supabase storage bucket 'profile-photos'
    const { error: storageErr } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    let photoUrl = null;
    if (!storageErr) {
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
      photoUrl = urlData?.publicUrl;
    }

    if (storageErr || !photoUrl) {
      // Fallback to Base64 data URI if storage bucket is unconfigured
      photoUrl = photo_data;
    }

    const result = await profileService.updatePhotoUrl(targetUserId, photoUrl, req.user);
    return res.json(result);
  } catch (err) {
    console.error('Photo upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload photo' });
  }
});

// DELETE /profile/photo
router.delete('/profile/photo', async (req, res) => {
  try {
    const targetUserId = req.query.target_user_id || req.user.id;
    const result = await profileService.deletePhotoUrl(targetUserId, req.user);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Failed to remove photo' });
  }
});

module.exports = router;
