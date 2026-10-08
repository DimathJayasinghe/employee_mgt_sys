import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ShieldCheck, Menu, User, LogOut, X } from 'lucide-react';
import NotificationBell from './profile/NotificationBell';
import API from '../api';

export default function Header({ 
  title, 
  user, 
  onToggleViewMode, 
  onMenuClick, 
  onNavigateTab, 
  onLogout, 
  onSelectEmployee 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search employee handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await API.get('/profile/upcoming-birthdays'); // Returns users list
        const query = searchQuery.toLowerCase().trim();
        const list = Array.isArray(res.data) ? res.data : [];
        
        // Also include current user in search candidates
        if (user && !list.some(u => u.id === user.id)) {
          list.unshift(user);
        }

        const filtered = list.filter(u => 
          (u.name && u.name.toLowerCase().includes(query)) ||
          (u.department && u.department.toLowerCase().includes(query)) ||
          (u.emp_code && u.emp_code.toLowerCase().includes(query)) ||
          (u.designation && u.designation.toLowerCase().includes(query))
        );

        setSearchResults(filtered);
        setIsSearchOpen(true);
      } catch (err) {
        console.warn('Search query warning:', err.message);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const handleSelectSearchResult = (emp) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (onNavigateTab) {
      onNavigateTab('profile');
    }
    if (onSelectEmployee) {
      onSelectEmployee(emp);
    }
  };

  const handleMyProfileClick = () => {
    setIsProfileMenuOpen(false);
    if (onNavigateTab) {
      onNavigateTab('profile');
    }
  };

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  // Format current or display date matching screenshot: "Friday, October 2, 2026"
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
        {/* Switch to Admin button — only shown if the logged-in user is an Admin */}
        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-2xs"
            title="Switch to Admin Dashboard"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="hidden md:inline">Employee Mode</span>
            <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold">Admin View</span>
          </button>
        )}

        {/* Notification Bell */}
        <NotificationBell onSelectEmployee={onSelectEmployee} />

        {/* Search Bar with Live Results Dropdown */}
        <div className="relative hidden sm:block" ref={searchRef}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
            placeholder="Search employee..."
            className="bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-8 py-1.5 w-40 md:w-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 max-h-72 overflow-y-auto animate-in fade-in duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Search Results</span>
                <span>{searchResults.length} found</span>
              </div>

              {isSearching ? (
                <div className="py-4 text-center text-xs text-slate-400">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">No employees found</div>
              ) : (
                <div className="space-y-1 mt-1">
                  {searchResults.map(emp => (
                    <div
                      key={emp.id}
                      onClick={() => handleSelectSearchResult(emp)}
                      className="p-2 rounded-xl hover:bg-blue-50/70 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0 overflow-hidden">
                          {emp.photo_url ? (
                            <img src={emp.photo_url} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            emp.initials || (emp.name ? emp.name.slice(0, 2).toUpperCase() : 'EP')
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-700">{emp.name}</h5>
                          <p className="text-[10px] text-slate-400 font-medium truncate">{emp.department || 'General'} • {emp.designation || 'Employee'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 shrink-0">
                        View
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Initials Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-1.5 cursor-pointer pl-1 sm:pl-2 hover:opacity-85 transition-opacity"
            title="Account Options"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shadow-xs overflow-hidden">
              {user?.photo_url ? (
                <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.initials || 'KP'
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </div>

          {/* Top-Right Profile Dropdown Card */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 animate-in fade-in duration-150">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                <h4 className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Employee'}</h4>
                <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{user?.email || user?.department || 'Employee'}</p>
                <span className="inline-block mt-1 text-[9px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                  {user?.role || 'Employee'}
                </span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={handleMyProfileClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-blue-600" />
                  <span>My Profile</span>
                </button>

                {onLogout && (
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
