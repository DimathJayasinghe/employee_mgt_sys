import React, { useState, useEffect, useCallback } from 'react';
import API from './api';
import sessionManager from './services/sessionManager';

// Authentication Landing Page
import LoginPage from './components/LoginPage';

// Employee Dashboard Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GreetingBanner from './components/GreetingBanner';
import DailyWorkCard from './components/DailyWorkCard';
import LeaveBalanceCard from './components/LeaveBalanceCard';
import TeamDutyStatusCard from './components/TeamDutyStatusCard';
import RecentLeaveRequestsCard from './components/RecentLeaveRequestsCard';
import ApplyLeaveModal from './components/ApplyLeaveModal';
import WorkHistoryView from './components/WorkHistoryView';
import LeaveHistoryView from './components/LeaveHistoryView';
import VisitFormView from './components/VisitFormView';
import EmployeeProfileView from './components/EmployeeProfileView';

// Admin Dashboard Components
import AdminSidebar from './components/admin/AdminSidebar';
import AdminHeader from './components/admin/AdminHeader';
import StatCardsGrid from './components/admin/StatCardsGrid';
import TodaysWorkforceTable from './components/admin/TodaysWorkforceTable';
import TodaysLeaveCards from './components/admin/TodaysLeaveCards';
import HalfDayAndStudyLeave from './components/admin/HalfDayAndStudyLeave';
import PendingLeaveRequestsTable from './components/admin/PendingLeaveRequestsTable';
import AllLeavesTable from './components/admin/AllLeavesTable';
import AdminAllEmployeesView from './components/admin/AdminAllEmployeesView';
import AdminAddEmployeeView from './components/admin/AdminAddEmployeeView';
import AdminWorkActivityView from './components/admin/AdminWorkActivityView';
import AdminClientAnalyticsView from './components/admin/AdminClientAnalyticsView';
import LeaveCalendarView from './components/admin/LeaveCalendarView';

export default function App() {
  // Navigation View: 'login' | 'admin' | 'employee'
  const [currentView, setCurrentView] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sessionNotice, setSessionNotice] = useState('');

  // Logged in User State — restored securely via sessionManager
  const [currentUser, setCurrentUser] = useState(() => {
    if (sessionManager.isSessionValid()) {
      return sessionManager.getUser();
    }
    sessionManager.clearSession();
    return null;
  });

  // Employee Dashboard State
  const [user, setUser] = useState({
    name: '',
    title: '',
    initials: '',
    status: 'Working'
  });
  const [todayWork, setTodayWork] = useState('');
  const [leaveBalance, setLeaveBalance] = useState({
    total_days: 21,
    used_days: 0,
    available_days: 21,
    casual: { total_days: 7, used_days: 0, available_days: 7 },
    annual: { total_days: 14, used_days: 0, available_days: 14 }
  });
  const [recentLeaveRequests, setRecentLeaveRequests] = useState([]);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);

  // Admin Dashboard State
  const [adminUser, setAdminUser] = useState({
    name: 'Administrator',
    title: 'System Administrator',
    initials: 'AD',
    role: 'Admin'
  });
  const [adminStats, setAdminStats] = useState({
    total_employees: 0,
    working_today: 0,
    on_leave_today: 0,
    half_day: 0,
    study_leave: 0,
    pending_requests: 0,
    upcoming_leaves: 0
  });
  const [workingWorkforce, setWorkingWorkforce] = useState([]);
  const [todaysLeave, setTodaysLeave] = useState([]);
  const [halfDayEmployees, setHalfDayEmployees] = useState([]);
  const [studyLeaveEmployees, setStudyLeaveEmployees] = useState([]);
  const [specialLeaveEmployees, setSpecialLeaveEmployees] = useState([]);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  // Auth Handlers (Memoized)
  const handleLogout = useCallback((reason) => {
    sessionManager.clearSession();
    setCurrentUser(null);
    setCurrentView('login');
    if (reason && typeof reason === 'string') {
      setSessionNotice(reason);
    }
  }, []);

  // Listen for session expiration events & Inactivity Auto-logout Watcher
  useEffect(() => {
    const unsubscribe = sessionManager.onSessionExpired((reason) => {
      handleLogout(reason);
    });

    if (currentUser) {
      sessionManager.startInactivityWatcher(() => {
        handleLogout('You have been logged out due to 30 minutes of inactivity.');
      }, 30);
    }

    return () => {
      unsubscribe();
      sessionManager.stopInactivityWatcher();
    };
  }, [currentUser, handleLogout]);

  // On mount: if a valid session exists, restore the correct view
  useEffect(() => {
    if (currentUser && sessionManager.isSessionValid()) {
      if (currentUser.role === 'Admin') {
        setAdminUser(currentUser);
        setCurrentView('admin');
        setActiveTab('admin-dashboard');
      } else {
        setUser(prev => ({ ...prev, ...currentUser }));
        setCurrentView('employee');
        setActiveTab('dashboard');
        fetchEmployeeSummary(currentUser.id);
      }
    } else if (currentUser) {
      handleLogout('Session expired. Please sign in again.');
    }
  }, []);

  useEffect(() => {
    if (currentView === 'admin') {
      fetchAdminSummary();
    } else if (currentView === 'employee' && currentUser?.id) {
      if (activeTab === 'dashboard') {
        fetchEmployeeSummary(currentUser.id);
      }
    }
  }, [currentView]);

  const fetchAdminSummary = async () => {
    try {
      const res = await API.get('/admin/summary');
      if (res.data) {
        if (res.data.adminUser && (!currentUser || currentUser.role !== 'Admin')) setAdminUser(res.data.adminUser);
        if (res.data.stats) setAdminStats(res.data.stats);
        if (res.data.workingWorkforce) setWorkingWorkforce(res.data.workingWorkforce);
        if (res.data.todaysLeave) setTodaysLeave(res.data.todaysLeave);
        if (res.data.halfDayEmployees) setHalfDayEmployees(res.data.halfDayEmployees);
        if (res.data.studyLeaveEmployees) setStudyLeaveEmployees(res.data.studyLeaveEmployees);
        if (res.data.specialLeaveEmployees) setSpecialLeaveEmployees(res.data.specialLeaveEmployees);
        if (res.data.pendingLeaveRequests) setPendingLeaveRequests(res.data.pendingLeaveRequests);
        if (res.data.upcomingLeaves) setUpcomingLeaves(res.data.upcomingLeaves);
        if (res.data.allLeaves) setAllLeaves(res.data.allLeaves);
        if (res.data.allEmployees) setAllEmployees(res.data.allEmployees);
      }
    } catch (err) {
      console.error('Failed to load admin summary:', err);
    }
  };

  const fetchEmployeeSummary = async (userId) => {
    const uid = userId || currentUser?.id;
    if (!uid) return;
    try {
      const res = await API.get(`/dashboard/summary?user_id=${uid}`);
      if (res.data) {
        if (res.data.user) {
          setUser(prev => {
            const merged = { ...prev };
            Object.keys(res.data.user).forEach(k => {
              if (res.data.user[k] !== undefined && res.data.user[k] !== null && res.data.user[k] !== '') {
                merged[k] = res.data.user[k];
              }
            });
            return merged;
          });
        }
        if (res.data.todayWork !== undefined) setTodayWork(res.data.todayWork);
        if (res.data.leaveBalance) setLeaveBalance(res.data.leaveBalance);
        if (res.data.recentLeaveRequests) setRecentLeaveRequests(res.data.recentLeaveRequests);
        if (res.data.workingWorkforce) setWorkingWorkforce(res.data.workingWorkforce);
        if (res.data.todaysLeave) setTodaysLeave(res.data.todaysLeave);
      }
    } catch (err) {
      console.error('Failed to load employee summary:', err);
    }
  };

  // Auth Handlers
  const handleLoginSuccess = (loggedInUser) => {
    sessionManager.setSession(loggedInUser, loggedInUser.token);
    setCurrentUser(loggedInUser);
    setSessionNotice('');
    if (loggedInUser.role === 'Admin') {
      setAdminUser(loggedInUser);
      setCurrentView('admin');
      setActiveTab('admin-dashboard');
    } else {
      setUser(loggedInUser);
      setCurrentView('employee');
      setActiveTab('dashboard');
      fetchEmployeeSummary(loggedInUser.id);
    }
  };

  // Admin Actions
  const handleApproveLeave = async (id) => {
    try {
      await API.post('/admin/leave/approve', { id, admin_email: currentUser?.email });
      await fetchAdminSummary();
    } catch (err) {
      console.error('Failed to approve leave:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to approve leave request';
      alert(`⚠️ Approval Restricted:\n${msg}`);
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await API.post('/admin/leave/reject', { id });
      await fetchAdminSummary();
    } catch (err) {
      console.error('Failed to reject leave:', err);
    }
  };

  // Employee Actions
  const handleSaveWork = async (newDescription, clients = []) => {
    if (!currentUser?.id) return;
    try {
      const res = await API.post('/work-entry', { user_id: currentUser.id, work_description: newDescription, clients });
      setTodayWork(res.data?.work_description || newDescription);
    } catch (err) {
      console.error('Failed to save work entry:', err);
    }
  };

  const handleSubmitLeave = async (leaveData) => {
    if (!currentUser?.id) return;
    try {
      await API.post('/leave/apply', { ...leaveData, user_id: currentUser.id });
      await fetchEmployeeSummary(currentUser.id);
    } catch (err) {
      console.error('Failed to submit leave:', err);
      throw err;
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!currentUser?.id) return;
    try {
      setUser(prev => ({ ...prev, status: newStatus }));
      await API.patch('/user/status', { user_id: currentUser.id, status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const toggleViewMode = () => {
    const nextMode = currentView === 'admin' ? 'employee' : 'admin';
    setCurrentView(nextMode);
    setActiveTab(nextMode === 'admin' ? 'admin-dashboard' : 'dashboard');
    setIsMobileOpen(false);
  };

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Helper for selecting an employee to view profile (Restricted to Admin or Owner)
  const handleSelectEmployee = (emp) => {
    const isAdmin = user?.role === 'Admin';
    const isOwner = emp && user && String(emp.id) === String(user.id);
    if (isAdmin || isOwner) {
      setSelectedEmployee(emp);
      setActiveTab('profile');
    }
  };

  const adminTitles = {
    'admin-dashboard': 'Dashboard',
    'all-employees': 'All Employees',
    'add-employee': 'Add New Employee',
    'work-activity': 'Work Activity',
    'client-analytics': 'Client Analytics',
    'admin-leave-requests': 'Leave Requests',
    'leave-calendar': 'Leave Calendar',
    'settings': 'System Settings',
    'profile': 'Employee Profile'
  };

  const employeeTitles = {
    'dashboard': 'Dashboard',
    'work-history': "Today's Work Log",
    'profile': 'Employee Profile',
    'leave-history': 'My Leave History',
    'visit-form': 'Visiting Form'
  };

  // VIEW 1: LANDING LOGIN PAGE (First Page User Sees)
  if (currentView === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} initialNotice={sessionNotice} />;
  }

  // VIEW 2: ADMIN DASHBOARD
  if (currentView === 'admin') {
    return (
      <div className="flex min-h-screen bg-[#f4f6fa] text-slate-800 font-sans antialiased">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'profile' && !selectedEmployee) {
              setSelectedEmployee(null);
            }
            setActiveTab(tab);
          }}
          adminUser={adminUser}
          onLogout={handleLogout}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            title={adminTitles[activeTab] || 'Dashboard'}
            adminUser={adminUser}
            currentViewMode={currentView}
            onToggleViewMode={toggleViewMode}
            onOpenMyProfile={() => {
              setSelectedEmployee(null);
              setActiveTab('profile');
            }}
            onMenuClick={() => setIsMobileOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'admin-dashboard' && (
              <div>
                <GreetingBanner user={currentUser || adminUser} />

                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    Workforce overview
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    A live snapshot of your team for {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}.
                  </p>
                </div>

                <StatCardsGrid 
                  stats={adminStats} 
                  workingWorkforce={workingWorkforce}
                  todaysLeave={todaysLeave}
                  halfDayEmployees={halfDayEmployees}
                  studyLeaveEmployees={studyLeaveEmployees}
                  specialLeaveEmployees={specialLeaveEmployees}
                  pendingLeaveRequests={pendingLeaveRequests}
                  upcomingLeaves={upcomingLeaves}
                  allEmployees={allEmployees}
                  onNavigateTab={setActiveTab}
                />
                <TodaysWorkforceTable workforce={workingWorkforce} />
                <TodaysLeaveCards leaves={todaysLeave} />
                <HalfDayAndStudyLeave
                  halfDayList={halfDayEmployees}
                  studyLeaveList={studyLeaveEmployees}
                />
                <PendingLeaveRequestsTable
                  requests={pendingLeaveRequests}
                  currentUser={currentUser}
                  onApprove={handleApproveLeave}
                  onReject={handleRejectLeave}
                  onViewAll={() => setActiveTab('admin-leave-requests')}
                />
              </div>
            )}

            {activeTab === 'all-employees' && <AdminAllEmployeesView employees={allEmployees} onSelectEmployee={handleSelectEmployee} />}

            {activeTab === 'add-employee' && <AdminAddEmployeeView />}

            {activeTab === 'admin-leave-requests' && (
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Leave Requests Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Review, approve, or reject employee leave applications, and inspect complete leave history.</p>
                  </div>
                </div>
                <PendingLeaveRequestsTable
                  requests={pendingLeaveRequests}
                  currentUser={currentUser}
                  onApprove={handleApproveLeave}
                  onReject={handleRejectLeave}
                />
                <AllLeavesTable leaves={allLeaves} />
              </div>
            )}

            {activeTab === 'work-activity' && <AdminWorkActivityView onSelectEmployee={handleSelectEmployee} />}

            {activeTab === 'client-analytics' && <AdminClientAnalyticsView />}

            {activeTab === 'leave-calendar' && <LeaveCalendarView />}

            {activeTab === 'profile' && (
              <EmployeeProfileView 
                onBack={() => {
                  setSelectedEmployee(null);
                  setActiveTab('admin-dashboard');
                }} 
                user={selectedEmployee || currentUser || adminUser}
                onSelectEmployee={handleSelectEmployee}
              />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl p-6 sm:p-12 text-center border border-slate-200 shadow-xs max-w-4xl mx-auto">
                <h3 className="text-lg font-bold text-slate-800 capitalize">{adminTitles[activeTab]}</h3>
                <p className="text-xs text-slate-500 mt-1">This section is active and configured for system administration.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // VIEW 3: EMPLOYEE DASHBOARD
  return (
    <div className="flex min-h-screen bg-[#f4f6fa] text-slate-800 font-sans antialiased">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'profile') {
            setSelectedEmployee(null);
          }
          setActiveTab(tab);
        }}
        onOpenApplyLeave={() => setIsApplyLeaveOpen(true)}
        user={user}
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={employeeTitles[activeTab] || 'Dashboard'}
          user={user}
          onToggleViewMode={currentUser?.role === 'Admin' ? toggleViewMode : undefined}
          onMenuClick={() => setIsMobileOpen(true)}
          onNavigateTab={(tab) => {
            if (tab === 'profile') {
              setSelectedEmployee(null);
            }
            setActiveTab(tab);
          }}
          onLogout={handleLogout}
          onSelectEmployee={handleSelectEmployee}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <GreetingBanner user={user} onUpdateStatus={handleUpdateStatus} />
                <DailyWorkCard initialWork={todayWork} onSaveWork={handleSaveWork} />
                <TeamDutyStatusCard 
                  workingWorkforce={workingWorkforce}
                  todaysLeave={todaysLeave}
                />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <LeaveBalanceCard 
                  leaveBalance={leaveBalance} 
                  onOpenApplyLeave={() => setIsApplyLeaveOpen(true)} 
                />
                <RecentLeaveRequestsCard requests={recentLeaveRequests} />
              </div>
            </div>
          )}

          {activeTab === 'work-history' && <WorkHistoryView userId={currentUser?.id} />}

          {activeTab === 'profile' && (
            <EmployeeProfileView 
              onBack={() => {
                setSelectedEmployee(null);
                setActiveTab('dashboard');
              }} 
              user={selectedEmployee || currentUser || user}
              onSelectEmployee={handleSelectEmployee}
              onProfileUpdated={(updated) => {
                if (updated && (String(updated.id) === String(currentUser?.id) || updated.email === currentUser?.email)) {
                  setUser(prev => ({ ...prev, ...updated }));
                  setCurrentUser(prev => ({ ...prev, ...updated }));
                  try {
                    const saved = localStorage.getItem('emp_mgt_user');
                    if (saved) {
                      const parsed = JSON.parse(saved);
                      localStorage.setItem('emp_mgt_user', JSON.stringify({ ...parsed, ...updated }));
                    }
                  } catch (e) {}
                }
              }}
            />
          )}

          {activeTab === 'leave-history' && (
            <LeaveHistoryView 
              userId={currentUser?.id} 
              onOpenApplyLeave={() => setIsApplyLeaveOpen(true)} 
              onLeaveCancelled={() => fetchEmployeeSummary(currentUser?.id)}
            />
          )}

          {activeTab === 'visit-form' && <VisitFormView />}
        </main>
      </div>

      <ApplyLeaveModal
        isOpen={isApplyLeaveOpen}
        onClose={() => setIsApplyLeaveOpen(false)}
        onSubmitLeave={handleSubmitLeave}
        user={user}
        leaveBalance={leaveBalance}
      />
    </div>
  );
}
