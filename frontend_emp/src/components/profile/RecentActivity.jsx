import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle2, FileText, Camera, UserCheck, HelpCircle } from 'lucide-react';
import API from '../../api';

export default function RecentActivity({ userId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    try {
      const url = userId ? `/profile/activity?user_id=${userId}` : '/profile/activity';
      const res = await API.get(url);
      if (Array.isArray(res.data)) {
        setActivities(res.data);
      }
    } catch (err) {
      console.warn('Failed to load employee activity:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'hr_contacted':
        return <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />;
      case 'photo_changed':
        return <Camera className="w-3.5 h-3.5 text-blue-600" />;
      case 'document_uploaded':
        return <FileText className="w-3.5 h-3.5 text-emerald-600" />;
      case 'profile_created':
        return <UserCheck className="w-3.5 h-3.5 text-purple-600" />;
      case 'profile_updated':
      default:
        return <Activity className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const seconds = Math.floor((new Date() - date) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  const displayedList = showAll ? activities : activities.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#022851]" />
          <span>Recent Activity</span>
        </h3>
        {activities.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            {showAll ? 'Show Less' : 'View All'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4 text-xs text-slate-400">Loading activity log...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400 font-medium">
          No recent activity recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {displayedList.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 text-xs">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                {getActivityIcon(item.activity_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 leading-snug">{item.description}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatTimeAgo(item.created_at)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
