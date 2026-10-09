import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, User, ShieldCheck, Menu, Database, Download, Mail, Loader2, CheckCircle2, Clock } from 'lucide-react';
import API from '../../api';

export default function AdminHeader({ title, adminUser, currentViewMode, onToggleViewMode, onOpenMyProfile, onMenuClick, onSelectEmployee }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBackupMenuOpen, setIsBackupMenuOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);

  // Live Employee Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await API.get(`/profile/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (Array.isArray(res.data)) setSearchResults(res.data);
      } catch (err) {
        console.warn('Admin search error:', err.message);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const handleDownloadBackup = async () => {
    if (isBackingUp || isSendingEmail) return;
    setIsBackingUp(true);
    setBackupStatus(null);
    setIsBackupMenuOpen(false);
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

      setBackupStatus('✅ Backup JSON Downloaded!');
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err) {
      console.error('Download backup error:', err);
      alert('Failed to generate database backup: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSendBackupEmail = async () => {
    if (isBackingUp || isSendingEmail) return;
    setIsSendingEmail(true);
    setBackupStatus(null);
    setIsBackupMenuOpen(false);
    try {
      await API.post('/admin/send-backup-email', {
        to: adminUser?.email || undefined
      });
      setBackupStatus('✉️ Backup Sent to Email!');
      setTimeout(() => setBackupStatus(null), 5000);
    } catch (err) {
      console.error('Send backup email error:', err);
      alert('Failed to send backup email: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSendingEmail(false);
    }
  };

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
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase Backup Button & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsBackupMenuOpen(!isBackupMenuOpen)}
            disabled={isBackingUp || isSendingEmail}
            className="bg-[#022851] hover:bg-[#033975] active:scale-[0.98] text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-60 shrink-0"
            title="Database Backup & Automatic 6 PM Email Settings"
          >
            {isBackingUp || isSendingEmail ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-blue-300" />
                <span>Backup Data</span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </>
            )}
          </button>

          {isBackupMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs font-medium text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#022851]" />
                  Supabase Backup
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  Auto-sent daily at 6:00 PM (Asia/Colombo)
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={handleDownloadBackup}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Backup (.JSON)</span>
                </button>

                <button
                  onClick={handleSendBackupEmail}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-slate-800">Send Backup to Email Now</p>
                    <p className="text-[10px] text-slate-400">To: {adminUser?.email || 'Admin Inbox'}</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {backupStatus && (
          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg animate-in fade-in duration-150 hidden sm:inline-block">
            {backupStatus}
          </span>
        )}

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

        {/* Search Bar with live search dropdown */}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2 w-44 md:w-60 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchResults.length > 0 && (
            <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {searchResults.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    if (onSelectEmployee) onSelectEmployee(emp);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-2.5 hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {emp.photo_url ? (
                      <img src={emp.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      emp.initials || 'EP'
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{emp.designation || emp.department || 'Employee'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-1.5 cursor-pointer pl-1 hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shadow-xs overflow-hidden">
              {adminUser?.photo_url ? (
                <img src={adminUser.photo_url} alt={adminUser?.name || 'Admin'} className="w-full h-full object-cover" />
              ) : (
                adminUser?.initials || 'AD'
              )}
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
