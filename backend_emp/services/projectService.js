const fs = require('fs');
const path = require('path');
const supabase = require('../db');

// File storage fallback paths (works in local node environment and /tmp on Vercel)
const DATA_DIR = path.resolve(__dirname, '../data');
const LOCAL_PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const TMP_PROJECTS_FILE = path.join('/tmp', 'emp_mgt_projects.json');

// Ensure directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Ignore in read-only filesystems
}

// Check which file is accessible for reading/writing
function getActiveStorageFile() {
  try {
    if (fs.existsSync(LOCAL_PROJECTS_FILE)) {
      return LOCAL_PROJECTS_FILE;
    }
    return LOCAL_PROJECTS_FILE;
  } catch {
    return TMP_PROJECTS_FILE;
  }
}

// In-memory default seed store to ensure initial rich data
const DEFAULT_SEED_STORE = {
  projects: [
    {
      id: 1,
      name: 'Employee Management System (EMS)',
      client_name: 'P W Holdings (Pvt) Ltd',
      description: 'Internal enterprise HR, workforce tracking, leave approval, and resource allocation platform.',
      status: 'In Progress',
      progress: 85,
      start_date: '2026-08-01',
      end_date: '2026-11-30',
      budget: 'Internal',
      priority: 'High',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Zoho CRM & Books Automation',
      client_name: 'Clever Automations & Teleseen',
      description: 'End-to-end integration and custom Deluge workflows between Zoho One CRM, Books, and customer portals.',
      status: 'In Progress',
      progress: 60,
      start_date: '2026-09-01',
      end_date: '2026-12-15',
      budget: 'Tier 1 Client',
      priority: 'High',
      created_at: '2026-09-01T00:00:00.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Helans POS & Inventory System',
      client_name: 'Helans Food & Retail',
      description: 'Retail POS application security audit, custom receipt layouts, and multi-location inventory syncing.',
      status: 'Planning',
      progress: 25,
      start_date: '2026-10-01',
      end_date: '2027-01-31',
      budget: 'Fixed Contract',
      priority: 'Medium',
      created_at: '2026-10-01T00:00:00.000Z',
      updated_at: new Date().toISOString()
    }
  ],
  members: [
    { id: 1, project_id: 1, user_id: 5, role: 'Project Manager', assigned_at: '2026-08-01T00:00:00.000Z' },
    { id: 2, project_id: 1, user_id: 3, role: 'Team Member', assigned_at: '2026-08-01T00:00:00.000Z' },
    { id: 3, project_id: 1, user_id: 4, role: 'Team Member', assigned_at: '2026-08-01T00:00:00.000Z' },
    { id: 4, project_id: 2, user_id: 5, role: 'Team Member', assigned_at: '2026-09-01T00:00:00.000Z' },
    { id: 5, project_id: 2, user_id: 6, role: 'Project Manager', assigned_at: '2026-09-01T00:00:00.000Z' },
    { id: 6, project_id: 3, user_id: 2, role: 'Project Manager', assigned_at: '2026-10-01T00:00:00.000Z' }
  ]
};

let memoryStore = JSON.parse(JSON.stringify(DEFAULT_SEED_STORE));

// Load initial data from file if present
function loadStore() {
  const filePath = getActiveStorageFile();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.projects) && parsed.projects.length > 0 && Array.isArray(parsed.members)) {
        memoryStore = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('Projects storage load warning, using memory cache:', e.message);
  }
  memoryStore = JSON.parse(JSON.stringify(DEFAULT_SEED_STORE));
  saveStore();
}

function saveStore() {
  const filePath = getActiveStorageFile();
  try {
    fs.writeFileSync(filePath, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch {
    try {
      fs.writeFileSync(TMP_PROJECTS_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
    } catch {
      // Memory cache is still valid
    }
  }
}

// Initialize on startup
loadStore();

// Track Supabase table availability flag
let supabaseHasProjectsTable = null;

async function checkSupabaseProjectsTable() {
  if (supabaseHasProjectsTable !== null) return supabaseHasProjectsTable;
  try {
    const { error } = await supabase.from('projects').select('id').limit(1);
    if (!error) {
      supabaseHasProjectsTable = true;
      return true;
    }
  } catch {
    // ignore
  }
  supabaseHasProjectsTable = false;
  return false;
}

const projectService = {
  /**
   * List all projects with enriched member details, PMs, and assigned stats
   */
  async getAllProjects() {
    const hasDbTable = await checkSupabaseProjectsTable();
    let projects = [];
    let members = [];

    if (hasDbTable) {
      try {
        const { data: pData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        const { data: mData } = await supabase.from('project_members').select('*');
        if (pData) projects = pData;
        if (mData) members = mData;
      } catch {
        projects = memoryStore.projects;
        members = memoryStore.members;
      }
    } else {
      projects = memoryStore.projects;
      members = memoryStore.members;
    }

    // Fetch user details for member resolution
    let usersMap = {};
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, department, designation, role, photo_url, initials');
      if (users) {
        users.forEach(u => { usersMap[u.id] = u; });
      }
    } catch (e) {
      console.warn('Failed to fetch users map for projects:', e.message);
    }

    return projects.map(proj => {
      const projMembers = members
        .filter(m => String(m.project_id) === String(proj.id))
        .map(m => ({
          ...m,
          user: usersMap[m.user_id] || { id: m.user_id, name: `User #${m.user_id}`, initials: 'U' }
        }));

      const projectManagers = projMembers.filter(m => m.role === 'Project Manager');
      const teamMembers = projMembers.filter(m => m.role !== 'Project Manager');

      return {
        ...proj,
        member_count: projMembers.length,
        project_managers: projectManagers,
        team_members: teamMembers,
        members: projMembers
      };
    });
  },

  /**
   * Get single project by ID with full details
   */
  async getProjectById(projectId) {
    const all = await this.getAllProjects();
    const found = all.find(p => String(p.id) === String(projectId));
    if (!found) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }
    return found;
  },

  /**
   * Get all projects assigned to a specific user
   */
  async getUserProjects(userId) {
    if (!userId) return [];
    const all = await this.getAllProjects();
    const strUserId = String(userId);

    const userProjects = [];
    for (const proj of all) {
      const userMembership = proj.members.find(m => String(m.user_id) === strUserId);
      if (userMembership) {
        userProjects.push({
          id: proj.id,
          name: proj.name,
          client_name: proj.client_name,
          description: proj.description,
          status: proj.status,
          progress: proj.progress,
          start_date: proj.start_date,
          end_date: proj.end_date,
          priority: proj.priority,
          role: userMembership.role,
          is_pm: userMembership.role === 'Project Manager',
          assigned_at: userMembership.assigned_at,
          total_members: proj.member_count,
          project_managers: proj.project_managers
        });
      }
    }
    return userProjects;
  },

  /**
   * Create a new project (Admin only)
   */
  async createProject(projectData, requestingUser) {
    if (!projectData.name || !projectData.name.trim()) {
      const err = new Error('Project name is required');
      err.status = 400;
      throw err;
    }

    const hasDbTable = await checkSupabaseProjectsTable();
    const newId = memoryStore.projects.length > 0 
      ? Math.max(...memoryStore.projects.map(p => Number(p.id) || 0)) + 1 
      : 1;

    const newProject = {
      id: newId,
      name: projectData.name.trim(),
      client_name: projectData.client_name ? projectData.client_name.trim() : 'Internal',
      description: projectData.description ? projectData.description.trim() : '',
      status: projectData.status || 'Planning', // 'Planning', 'In Progress', 'On Hold', 'Completed'
      progress: Math.min(100, Math.max(0, parseInt(projectData.progress, 10) || 0)),
      start_date: projectData.start_date || new Date().toISOString().split('T')[0],
      end_date: projectData.end_date || null,
      budget: projectData.budget || null,
      priority: projectData.priority || 'Medium', // 'Low', 'Medium', 'High', 'Urgent'
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (hasDbTable) {
      try {
        const { data, error } = await supabase.from('projects').insert([newProject]).select('*');
        if (!error && data?.[0]) {
          newProject.id = data[0].id;
        }
      } catch (e) {
        console.warn('Supabase project insert failed, keeping in memory/file store:', e.message);
      }
    }

    memoryStore.projects.push(newProject);
    saveStore();

    // If an initial PM was specified, assign them
    if (projectData.manager_id) {
      await this.assignMember(newProject.id, projectData.manager_id, 'Project Manager', requestingUser);
    }

    return this.getProjectById(newProject.id);
  },

  /**
   * Update project details (Admin or assigned Project Manager)
   */
  async updateProject(projectId, updates, requestingUser) {
    const project = await this.getProjectById(projectId);
    
    // Check permission: Admin or PM of this project
    const isPM = project.project_managers.some(pm => String(pm.user_id) === String(requestingUser?.id));
    const isAdmin = requestingUser?.role === 'Admin';

    if (!isAdmin && !isPM) {
      const err = new Error('Access denied: Only Admins or assigned Project Managers can update project details');
      err.status = 403;
      throw err;
    }

    const allowedFields = ['name', 'client_name', 'description', 'status', 'progress', 'start_date', 'end_date', 'budget', 'priority'];
    const sanitizedUpdates = { updated_at: new Date().toISOString() };

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === 'progress') {
          sanitizedUpdates[key] = Math.min(100, Math.max(0, parseInt(updates[key], 10) || 0));
        } else if (typeof updates[key] === 'string') {
          sanitizedUpdates[key] = updates[key].trim();
        } else {
          sanitizedUpdates[key] = updates[key];
        }
      }
    }

    const hasDbTable = await checkSupabaseProjectsTable();
    if (hasDbTable) {
      try {
        await supabase.from('projects').update(sanitizedUpdates).eq('id', projectId);
      } catch (e) {
        console.warn('Supabase project update warning:', e.message);
      }
    }

    const idx = memoryStore.projects.findIndex(p => String(p.id) === String(projectId));
    if (idx !== -1) {
      memoryStore.projects[idx] = { ...memoryStore.projects[idx], ...sanitizedUpdates };
      saveStore();
    }

    return this.getProjectById(projectId);
  },

  /**
   * Delete a project (Admin only)
   */
  async deleteProject(projectId, requestingUser) {
    if (requestingUser?.role !== 'Admin') {
      const err = new Error('Access denied: Admin role required to delete projects');
      err.status = 403;
      throw err;
    }

    const hasDbTable = await checkSupabaseProjectsTable();
    if (hasDbTable) {
      try {
        await supabase.from('project_members').delete().eq('project_id', projectId);
        await supabase.from('projects').delete().eq('id', projectId);
      } catch (e) {
        console.warn('Supabase project delete warning:', e.message);
      }
    }

    memoryStore.projects = memoryStore.projects.filter(p => String(p.id) !== String(projectId));
    memoryStore.members = memoryStore.members.filter(m => String(m.project_id) !== String(projectId));
    saveStore();

    return { success: true, message: 'Project removed successfully' };
  },

  /**
   * Assign or update a member's role in a project (Multiple projects per user allowed!)
   * Role can be 'Project Manager' or 'Team Member'
   */
  async assignMember(projectId, userId, role = 'Team Member', requestingUser) {
    if (!projectId || !userId) {
      const err = new Error('Project ID and User ID are required');
      err.status = 400;
      throw err;
    }

    // Role normalization: 'Project Manager' or 'Team Member'
    const cleanRole = role === 'Project Manager' || role === 'PM' ? 'Project Manager' : 'Team Member';

    // Verify project exists
    await this.getProjectById(projectId);

    const hasDbTable = await checkSupabaseProjectsTable();
    const existingIndex = memoryStore.members.findIndex(
      m => String(m.project_id) === String(projectId) && String(m.user_id) === String(userId)
    );

    if (existingIndex !== -1) {
      // Update existing role
      memoryStore.members[existingIndex].role = cleanRole;
      memoryStore.members[existingIndex].assigned_at = new Date().toISOString();

      if (hasDbTable) {
        try {
          await supabase
            .from('project_members')
            .update({ role: cleanRole, assigned_at: new Date().toISOString() })
            .eq('project_id', projectId)
            .eq('user_id', userId);
        } catch (e) {
          console.warn('Supabase member update warning:', e.message);
        }
      }
    } else {
      // Add new assignment
      const newMemberId = memoryStore.members.length > 0
        ? Math.max(...memoryStore.members.map(m => Number(m.id) || 0)) + 1
        : 1;

      const newAssignment = {
        id: newMemberId,
        project_id: Number(projectId) || projectId,
        user_id: Number(userId) || userId,
        role: cleanRole,
        assigned_at: new Date().toISOString()
      };

      if (hasDbTable) {
        try {
          await supabase.from('project_members').insert([newAssignment]);
        } catch (e) {
          console.warn('Supabase member insert warning:', e.message);
        }
      }

      memoryStore.members.push(newAssignment);
    }

    saveStore();
    return this.getProjectById(projectId);
  },

  /**
   * Remove a member from a project
   */
  async removeMember(projectId, userId, requestingUser) {
    if (!projectId || !userId) {
      const err = new Error('Project ID and User ID are required');
      err.status = 400;
      throw err;
    }

    const hasDbTable = await checkSupabaseProjectsTable();
    if (hasDbTable) {
      try {
        await supabase
          .from('project_members')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn('Supabase member delete warning:', e.message);
      }
    }

    memoryStore.members = memoryStore.members.filter(
      m => !(String(m.project_id) === String(projectId) && String(m.user_id) === String(userId))
    );
    saveStore();

    return this.getProjectById(projectId);
  }
};

module.exports = projectService;
