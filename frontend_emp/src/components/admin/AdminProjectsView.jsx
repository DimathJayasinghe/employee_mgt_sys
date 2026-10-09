import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ShieldAlert, 
  Crown, 
  UserPlus, 
  Trash2, 
  X, 
  Edit3,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import API from '../../api';

export default function AdminProjectsView({ onSelectEmployee }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  // All employees for assignment dropdown
  const [availableEmployees, setAvailableEmployees] = useState([]);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    client_name: '',
    description: '',
    status: 'In Progress',
    progress: 0,
    priority: 'Medium',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget: '',
    manager_id: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    client_name: '',
    description: '',
    status: 'In Progress',
    progress: 0,
    priority: 'Medium',
    start_date: '',
    end_date: '',
    budget: ''
  });

  const [assignUserId, setAssignUserId] = useState('');
  const [assignRole, setAssignRole] = useState('Team Member');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await API.get('/projects');
      if (Array.isArray(res.data)) {
        setProjects(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/admin/users');
      if (Array.isArray(res.data)) {
        setAvailableEmployees(res.data);
      }
    } catch (err) {
      console.warn('Failed to load employees for project assignment:', err.message);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setActionLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await API.post('/projects', createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        client_name: '',
        description: '',
        status: 'In Progress',
        progress: 0,
        priority: 'Medium',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        budget: '',
        manager_id: ''
      });
      fetchProjects();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to create project' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditModal = (proj) => {
    setSelectedProject(proj);
    setEditForm({
      name: proj.name || '',
      client_name: proj.client_name || '',
      description: proj.description || '',
      status: proj.status || 'In Progress',
      progress: proj.progress || 0,
      priority: proj.priority || 'Medium',
      start_date: proj.start_date ? proj.start_date.split('T')[0] : '',
      end_date: proj.end_date ? proj.end_date.split('T')[0] : '',
      budget: proj.budget || ''
    });
    setIsEditProjectModalOpen(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    setActionLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await API.patch(`/projects/${selectedProject.id}`, editForm);
      setIsEditProjectModalOpen(false);
      fetchProjects();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to update project' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? All team member assignments will be removed.')) {
      return;
    }
    try {
      await API.delete(`/projects/${projectId}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleOpenTeamModal = (proj) => {
    setSelectedProject(proj);
    setAssignUserId('');
    setAssignRole('Team Member');
    setStatusMsg({ type: '', text: '' });
    setIsTeamModalOpen(true);
  };

  const handleAssignMember = async (e) => {
    e.preventDefault();
    if (!selectedProject || !assignUserId) return;

    setActionLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await API.post(`/projects/${selectedProject.id}/members`, {
        user_id: assignUserId,
        role: assignRole
      });
      setSelectedProject(res.data);
      setAssignUserId('');
      fetchProjects();
      setStatusMsg({ type: 'success', text: 'Team member successfully updated!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to assign member' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedProject) return;
    try {
      const res = await API.delete(`/projects/${selectedProject.id}/members/${userId}`);
      setSelectedProject(res.data);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[#022851]" />
            <h2 className="text-xl font-bold text-slate-900">Project Management & Assignments</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track enterprise project pipelines, assign employees across multiple projects, designate Project Managers, and monitor progress status.
          </p>
        </div>

        <button
          onClick={() => {
            setStatusMsg({ type: '', text: '' });
            setIsCreateModalOpen(true);
          }}
          className="bg-[#022851] hover:bg-[#03376e] active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'In Progress', 'Planning', 'On Hold', 'Completed'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[#022851] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Projects Found</h3>
          <p className="text-xs text-slate-500 mt-1">Get started by creating your first organizational project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(proj => {
            const pms = proj.project_managers || [];
            const members = proj.team_members || [];

            return (
              <div 
                key={proj.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  {/* Status & Priority Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      proj.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      proj.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      proj.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      ● {proj.status}
                    </span>

                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                      {proj.priority} Priority
                    </span>
                  </div>

                  {/* Project Title & Client */}
                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-1">{proj.name}</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Client: <strong className="text-slate-800">{proj.client_name || 'Internal'}</strong>
                  </p>

                  {/* Description */}
                  {proj.description && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-slate-900 font-mono">{proj.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-[#022851] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, proj.progress || 0))}%` }}
                      />
                    </div>
                  </div>

                  {/* Project Managers Section */}
                  <div className="mt-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                      Project Manager
                    </span>
                    {pms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {pms.map(pm => (
                          <div 
                            key={pm.id} 
                            onClick={() => onSelectEmployee && pm.user && onSelectEmployee(pm.user)}
                            className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer hover:bg-amber-100 transition-colors"
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate max-w-[140px]">{pm.user?.name || `PM #${pm.user_id}`}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No PM designated</span>
                    )}
                  </div>

                  {/* Assigned Team Members Avatars / Count */}
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                      Assigned Team ({proj.member_count || 0})
                    </span>
                    <div className="flex items-center gap-1 overflow-hidden">
                      {proj.members?.slice(0, 5).map(m => (
                        <div
                          key={m.id}
                          title={`${m.user?.name || 'Member'} (${m.role})`}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-2xs cursor-pointer ${
                            m.role === 'Project Manager' 
                              ? 'bg-amber-500 text-slate-950 font-black' 
                              : 'bg-slate-800 text-white'
                          }`}
                        >
                          {m.user?.photo_url ? (
                            <img src={m.user.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            m.user?.initials || 'U'
                          )}
                        </div>
                      ))}
                      {proj.member_count > 5 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center border-2 border-white">
                          +{proj.member_count - 5}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-150 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenTeamModal(proj)}
                    className="text-xs font-bold text-[#022851] hover:text-[#03376e] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Manage Team</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(proj)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Edit project"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE PROJECT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[#022851]" />
                <h3 className="text-base font-bold text-slate-900">Create New Project</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusMsg.text && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${
                statusMsg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. ERP System Migration"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client / Stakeholder</label>
                  <input
                    type="text"
                    value={createForm.client_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="e.g. Helans Food / Internal"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Project Manager</label>
                  <select
                    value={createForm.manager_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, manager_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 bg-white"
                  >
                    <option value="">Select Employee as PM...</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || 'Staff'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Objectives, deliverables, key requirements..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 bg-white"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={createForm.progress}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, progress: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#022851] hover:bg-[#03376e] text-white font-bold px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {actionLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PROJECT */}
      {isEditProjectModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Project Details</h3>
              <button onClick={() => setIsEditProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Client / Stakeholder</label>
                <input
                  type="text"
                  value={editForm.client_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, client_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 bg-white"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.progress}
                    onChange={(e) => setEditForm(prev => ({ ...prev, progress: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#022851] hover:bg-[#03376e] text-white font-bold px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE PROJECT TEAM & PROMOTE TO PM */}
      {isTeamModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Team: {selectedProject.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign employees and promote leaders to Project Manager (PM)</p>
              </div>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusMsg.text && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${
                statusMsg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {statusMsg.text}
              </div>
            )}

            {/* Assignment Form */}
            <form onSubmit={handleAssignMember} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#022851]" />
                <span>Assign Employee to Project</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-6">
                  <select
                    required
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">Select Employee...</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || 'Staff'})</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 font-bold"
                  >
                    <option value="Team Member">Team Member</option>
                    <option value="Project Manager">★ Project Manager (PM)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-[#022851] hover:bg-[#03376e] text-white font-bold py-2 px-3 rounded-xl shadow-xs transition-all cursor-pointer text-xs"
                  >
                    {actionLoading ? 'Saving...' : 'Assign'}
                  </button>
                </div>
              </div>
            </form>

            {/* Current Team Members List */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">
                Current Assigned Team ({selectedProject.members?.length || 0})
              </h4>

              {(!selectedProject.members || selectedProject.members.length === 0) ? (
                <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-xl">
                  No employees assigned yet. Use the form above to add members.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedProject.members.map(member => {
                    const isPM = member.role === 'Project Manager';
                    return (
                      <div key={member.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isPM ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-white'
                          }`}>
                            {member.user?.photo_url ? (
                              <img src={member.user.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              member.user?.initials || 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 truncate leading-snug">
                              {member.user?.name || `Employee #${member.user_id}`}
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              {member.user?.designation || member.user?.department || 'Employee'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isPM ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-200 font-extrabold text-[10px] px-2.5 py-1 rounded-md">
                              <Crown className="w-3 h-3 text-amber-600" />
                              <span>Project Manager</span>
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                setActionLoading(true);
                                try {
                                  const res = await API.post(`/projects/${selectedProject.id}/members`, {
                                    user_id: member.user_id,
                                    role: 'Project Manager'
                                  });
                                  setSelectedProject(res.data);
                                  fetchProjects();
                                } catch (err) {
                                  alert(err.response?.data?.error || 'Failed to promote');
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                              title="Promote to Project Manager"
                            >
                              Promote to PM
                            </button>
                          )}

                          {isPM && (
                            <button
                              onClick={async () => {
                                setActionLoading(true);
                                try {
                                  const res = await API.post(`/projects/${selectedProject.id}/members`, {
                                    user_id: member.user_id,
                                    role: 'Team Member'
                                  });
                                  setSelectedProject(res.data);
                                  fetchProjects();
                                } catch (err) {
                                  alert(err.response?.data?.error || 'Failed to demote');
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                              title="Demote to Team Member"
                            >
                              Demote to Member
                            </button>
                          )}

                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove from project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
