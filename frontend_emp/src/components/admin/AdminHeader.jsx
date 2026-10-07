import React, { useState } from 'react';
import { Search, ChevronDown, User, ShieldCheck, Menu } from 'lucide-react';

export default function AdminHeader({ title, adminUser, currentViewMode, onToggleViewMode, onOpenMyProfile, onMenuClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title & Mobile Menu Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{title || 'Dashboard'}</h2>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">{formattedDate}</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role Switcher Pill */}
        <button
          onClick={onToggleViewMode}
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-2xs"
          title="Switch Dashboard View"
        >
          {currentViewMode === 'admin' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden md:inline">Admin Mode</span>
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold">Employee View</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden md:inline">Employee Mode</span>
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold">Admin View</span>
            </>
          )}
        </button>

        {/* Search Bar */}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            className="bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-4 py-1.5 w-40 md:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-1.5 cursor-pointer pl-1 hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shadow-xs">
              {adminUser?.initials || 'AD'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </div>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 text-xs font-medium text-slate-700">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{adminUser?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-500 font-medium">{adminUser?.email || ''}</p>
              </div>
              
              <button
                onClick={() => {
                  if (onOpenMyProfile) onOpenMyProfile();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-slate-800 font-bold flex items-center gap-2 border-b border-slate-100 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => {
                  onToggleViewMode();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-blue-600 font-semibold cursor-pointer"
              >
                Switch View Mode
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
