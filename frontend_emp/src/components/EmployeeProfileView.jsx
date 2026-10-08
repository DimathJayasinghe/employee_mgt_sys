import React, { useState, useEffect } from 'react';
import API from '../api';
import ProfileHero from './profile/ProfileHero';
import StatCard from './profile/StatCard';
import { PersonalInfoCard, EmploymentInfoCard, ContactInfoCard } from './profile/InfoCard';
import BirthdayReminderCard from './profile/BirthdayReminderCard';
import UpcomingBirthdayCard from './profile/UpcomingBirthdayCard';
import QuickActions from './profile/QuickActions';
import RecentActivity from './profile/RecentActivity';
import DocumentsTab from './profile/DocumentsTab';
import PhotoUploader from './profile/PhotoUploader';
import EditProfileModal from './EditProfileModal';
import { Layers, User, Briefcase, Phone, FileText, AlertCircle, RefreshCw } from 'lucide-react';

export default function EmployeeProfileView({ onBack, user, onSelectEmployee }) {
  const [profile, setProfile] = useState(user || null);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [loading, setLoading] = useState(!user && !profile);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchUpcomingBirthdays();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!profile) setLoading(true);
    setError(null);
    try {
      const targetId = user?.id || profile?.id;
      const endpoint = targetId ? `/profile/me?user_id=${targetId}` : '/profile/me';
      const res = await API.get(endpoint);
      if (res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch profile from API, using active session user:', err);
      if (!profile && !user) {
        const errMsg = err.response?.data?.error || err.message || 'Failed to load profile details';
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingBirthdays = async () => {
    try {
      const res = await API.get('/profile/upcoming-birthdays');
      if (Array.isArray(res.data)) {
        setUpcomingBirthdays(res.data);
      }
    } catch (err) {
      console.warn('Upcoming birthdays fetch warning:', err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="bg-[#07162c] rounded-2xl p-6 h-48 animate-pulse border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 border border-slate-200/80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-xs max-w-md mx-auto">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Failed to Load Profile</h3>
          <p className="text-xs text-slate-500 mb-6">{error}</p>
          <button
            onClick={fetchProfile}
            className="bg-[#022851] hover:bg-[#03376e] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const activeUser = (() => {
    try {
      const saved = localStorage.getItem('emp_mgt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const isOwner = Boolean(
    activeUser && (
      (activeUser.id && profile?.id && String(activeUser.id) === String(profile.id)) ||
      (activeUser.email && profile?.email && activeUser.email.toLowerCase() === profile.email.toLowerCase()) ||
      (!user && profile)
    )
  );

  const handleOpenEditModal = isOwner ? () => setIsEditModalOpen(true) : null;
  const handleOpenPhotoModal = isOwner ? () => setIsPhotoModalOpen(true) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Banner */}
      <ProfileHero
        profile={profile}
        onBack={onBack}
        onOpenEditModal={handleOpenEditModal}
        onOpenPhotoModal={handleOpenPhotoModal}
      />

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'personal', label: 'Personal Details', icon: User },
          { id: 'employment', label: 'Employment Details', icon: Briefcase },
          { id: 'contact', label: 'Contact Details', icon: Phone },
          { id: 'documents', label: 'Documents', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#022851] text-[#022851]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Upcoming Birthday Alert (if any active today/tomorrow) */}
          <UpcomingBirthdayCard
            birthdayEmployees={upcomingBirthdays}
            onSelectEmployee={profile?.role === 'Admin' || (user?.role === 'Admin') ? onSelectEmployee : null}
          />

          {/* Current Profile Birthday Reminder Card */}
          <BirthdayReminderCard
            profile={profile}
            onSelectEmployee={profile?.role === 'Admin' || (user?.role === 'Admin') ? onSelectEmployee : null}
          />

          {/* 4 Stat Cards */}
          <StatCard profile={profile} />

          {/* Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Personal Info & Activity Log */}
            <div className="lg:col-span-8 space-y-6">
              <PersonalInfoCard
                profile={profile}
                onOpenEditModal={handleOpenEditModal}
              />
              <RecentActivity userId={profile?.id} />
            </div>

            {/* Right Column: Quick Actions */}
            <div className="lg:col-span-4 space-y-6">
              <QuickActions
                profile={profile}
                onOpenEditModal={handleOpenEditModal}
                onOpenDocumentsTab={() => setActiveSubTab('documents')}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PERSONAL DETAILS */}
      {activeSubTab === 'personal' && (
        <PersonalInfoCard
          profile={profile}
          onOpenEditModal={handleOpenEditModal}
        />
      )}

      {/* TAB CONTENT 3: EMPLOYMENT DETAILS */}
      {activeSubTab === 'employment' && (
        <EmploymentInfoCard
          profile={profile}
          onOpenEditModal={handleOpenEditModal}
        />
      )}

      {/* TAB CONTENT 4: CONTACT DETAILS */}
      {activeSubTab === 'contact' && (
        <ContactInfoCard
          profile={profile}
          onOpenEditModal={handleOpenEditModal}
        />
      )}

      {/* TAB CONTENT 5: DOCUMENTS */}
      {activeSubTab === 'documents' && (
        <DocumentsTab userId={profile?.id} />
      )}

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      <PhotoUploader
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        profile={profile}
        onPhotoUpdated={(newUrl) => setProfile(prev => ({ ...prev, photo_url: newUrl }))}
      />
    </div>
  );
}
