import React from 'react';
import logoImg from '../../assets/logo.png';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  Briefcase, 
  Building2,
  ClipboardList, 
  Calendar, 
  Settings, 
  LogOut, 
  X,
  User,
  Database,
  FolderKanban
} from 'lucide-react';
import API from '../../api';

export default function AdminSidebar({ activeTab, setActiveTab, adminUser, onLogout, isMobileOpen, setIsMobileOpen }) {
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64 bg-[#07162c] text-slate-300 flex flex-col justify-between border-r border-slate-800 select-none shrink-0 transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Branding & Navigation */}
        <div className="p-5 flex-1 flex flex-col overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-8 px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-md shrink-0">
                <img src={logoImg} alt="P W Holdings Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-snug tracking-tight">P W Holdings</h1>
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Employee Management</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: DASHBOARD */}
          <div className="mb-6">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">Dashboard</p>
            <button
              onClick={() => handleNavClick('admin-dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'admin-dashboard'
                  ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* Section 2: EMPLOYEES */}
          <div className="mb-6">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">Employees</p>
            <nav className="space-y-1">
              <button
                onClick={() => handleNavClick('all-employees')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'all-employees'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All Employees</span>
              </button>

              <button
                onClick={() => handleNavClick('add-employee')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'add-employee'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New Employee</span>
              </button>

              <button
                onClick={() => handleNavClick('projects')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'projects'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <FolderKanban className="w-4 h-4 text-amber-400" />
                <span>Projects & Teams</span>
              </button>

              <button
                onClick={() => handleNavClick('work-activity')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'work-activity'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Work Activity</span>
              </button>

              <button
                onClick={() => handleNavClick('client-analytics')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'client-analytics'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Client Analytics</span>
              </button>
            </nav>
          </div>

          {/* Section 3: LEAVE MANAGEMENT */}
          <div className="mb-6">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">Leave Management</p>
            <nav className="space-y-1">
              <button
                onClick={() => handleNavClick('admin-leave-requests')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'admin-leave-requests'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Leave Requests</span>
              </button>

              <button
                onClick={() => handleNavClick('leave-calendar')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'leave-calendar'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Leave Calendar</span>
              </button>
            </nav>
          </div>

          {/* Section 4: SYSTEM & PERSONAL PROFILE */}
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">System & Profile</p>
            <nav className="space-y-1">
              <button
                onClick={() => handleNavClick('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <User className="w-4 h-4 text-blue-400" />
                <span>My Profile</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await API.get('/admin/backup');
                    const dateStr = new Date().toISOString().split('T')[0];
                    const filename = `supabase_database_backup_${dateStr}.json`;
                    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    alert('✅ Supabase database backup downloaded to your device!');
                  } catch (err) {
                    alert('Failed to generate backup: ' + (err.response?.data?.error || err.message));
                  }
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-[#0c1f3a] cursor-pointer"
                title="Download Supabase database backup JSON file"
              >
                <Database className="w-4 h-4 text-blue-400" />
                <span>Database Backup</span>
              </button>

              <button
                onClick={() => handleNavClick('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Admin User Profile Card */}
        <div className="p-4 border-t border-slate-800/80">
          <div 
            onClick={() => handleNavClick('profile')}
            className="bg-[#0c1f3a] hover:bg-[#122849] rounded-2xl p-3 flex items-center justify-between border border-slate-800/90 shadow-sm cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-[#07162c] font-bold text-xs flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                {adminUser?.photo_url ? (
                  <img src={adminUser.photo_url} alt={adminUser?.name || 'Admin'} className="w-full h-full object-cover" />
                ) : (
                  adminUser?.initials || 'AD'
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-white text-xs font-semibold truncate leading-tight">
                  {adminUser?.name || 'Administrator'}
                </h4>
                <p className="text-[10px] text-blue-400 font-semibold mt-0.5">My Profile</p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              title="Log out"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
