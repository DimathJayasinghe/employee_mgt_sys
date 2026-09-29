import React from 'react';
import logoImg from '../assets/logo.png';
import { 
  LayoutDashboard, 
  Briefcase, 
  CalendarPlus, 
  ClipboardList, 
  FileText,
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenApplyLeave, user, onLogout, isMobileOpen, setIsMobileOpen }) {
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const handleApplyClick = () => {
    onOpenApplyLeave();
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

          {/* Navigation Section 1: MY WORKSPACE */}
          <div className="mb-6">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">My Workspace</p>
            <nav className="space-y-1">
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => handleNavClick('work-history')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'work-history'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Today's Work</span>
              </button>
            </nav>
          </div>

          {/* Navigation Section 2: LEAVE */}
          <div className="mb-6">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">Leave</p>
            <nav className="space-y-1">
              <button
                onClick={handleApplyClick}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a] transition-all"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Apply Leave</span>
              </button>

              <button
                onClick={() => handleNavClick('leave-history')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'leave-history'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>My Leave History</span>
              </button>
            </nav>
          </div>

          {/* Navigation Section 3: FORMS */}
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">Forms</p>
            <nav className="space-y-1">
              <button
                onClick={() => handleNavClick('visit-form')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'visit-form'
                    ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Visit Form</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Profile Card */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="bg-[#0c1f3a] rounded-2xl p-3 flex items-center justify-between border border-slate-800/90 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-[#07162c] font-bold text-xs flex items-center justify-center shrink-0 shadow-inner">
                {user?.initials || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'EP')}
              </div>
              <div className="min-w-0">
                <h4 className="text-white text-xs font-semibold truncate leading-tight">
                  {user?.name || 'Employee'}
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
