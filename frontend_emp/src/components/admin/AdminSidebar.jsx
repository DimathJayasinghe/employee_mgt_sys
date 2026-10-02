import React from 'react';
import logoImg from '../../assets/logo.png';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Building2,
  ClipboardList, 
  Calendar, 
  Settings, 
  LogOut, 
  X
} from 'lucide-react';

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

          {/* Section 4: SYSTEM */}
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">System</p>
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
          </div>
        </div>

        {/* Bottom Admin User Profile Card */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="bg-[#0c1f3a] rounded-2xl p-3 flex items-center justify-between border border-slate-800/90 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-[#07162c] font-bold text-xs flex items-center justify-center shrink-0 shadow-inner">
                {adminUser?.initials || 'AD'}
              </div>
              <div className="min-w-0">
                <h4 className="text-white text-xs font-semibold truncate leading-tight">
                  {adminUser?.name || 'Administrator'}
                </h4>
              </div>
            </div>
            <button 
              onClick={onLogout}
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
