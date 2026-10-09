const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const projectService = require('../services/projectService');

// All project routes require valid authenticated user
router.use(requireAuth);

/**
 * GET /api/projects
 * List all projects with member lists, PMs, and stats
 */
router.get('/', async (req, res) => {
  try {
    const projects = await projectService.getAllProjects();
    return res.json(projects);
  } catch (err) {
    console.error('Failed to list projects:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Failed to list projects' });
  }
});

/**
 * GET /api/projects/user/:userId
 * List all projects assigned to a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userProjects = await projectService.getUserProjects(userId);
    return res.json(userProjects);
  } catch (err) {
    console.error(`Failed to list projects for user ${req.params.userId}:`, err);
    return res.status(err.status || 500).json({ error: err.message || 'Failed to list user projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get single project by ID with full team breakdown
 */
router.get('/:id', async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    return res.json(project);
  } catch (err) {
    return res.status(err.status || 404).json({ error: err.message || 'Project not found' });
  }
});

/**
 * POST /api/projects
 * Create a new project (Admin only)
 */
router.post('/', async (req, res) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required to create projects' });
  }
  try {
    const created = await projectService.createProject(req.body, req.user);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message || 'Failed to create project' });
  }
});

/**
 * PATCH /api/projects/:id
 * Update project details (Admin or assigned Project Manager)
 */
router.patch('/:id', async (req, res) => {
  try {
    const updated = await projectService.updateProject(req.params.id, req.body, req.user);
    return res.json(updated);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message || 'Failed to update project' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project (Admin only)
 */
router.delete('/:id', async (req, res) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required to delete projects' });
  }
  try {
    const result = await projectService.deleteProject(req.params.id, req.user);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message || 'Failed to delete project' });
  }
});

/**
 * POST /api/projects/:id/members
 * Assign member or promote to Project Manager
 * Body: { user_id, role: 'Project Manager' | 'Team Member' }
 */
router.post('/:id/members', async (req, res) => {
  // Only Admin or PM of the project can assign members
  const { user_id, role } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const project = await projectService.getProjectById(req.params.id);
    const isPM = project.project_managers.some(pm => String(pm.user_id) === String(req.user?.id));
    const isAdmin = req.user?.role === 'Admin';

    if (!isAdmin && !isPM) {
      return res.status(403).json({ error: 'Access denied: Only Admins or Project Managers can assign members' });
    }

    const updatedProject = await projectService.assignMember(req.params.id, user_id, role, req.user);
    return res.json(updatedProject);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message || 'Failed to assign project member' });
  }
});

/**
 * DELETE /api/projects/:id/members/:userId
 * Remove member from project
 */
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    const isPM = project.project_managers.some(pm => String(pm.user_id) === String(req.user?.id));
    const isAdmin = req.user?.role === 'Admin';

    if (!isAdmin && !isPM) {
      return res.status(403).json({ error: 'Access denied: Only Admins or Project Managers can remove members' });
    }

    const updatedProject = await projectService.removeMember(req.params.id, req.params.userId, req.user);
    return res.json(updatedProject);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message || 'Failed to remove member from project' });
  }
});

module.exports = router;
