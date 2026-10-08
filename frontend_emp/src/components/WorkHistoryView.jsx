import React, { useState, useEffect } from 'react';
import API from '../api';
import { Briefcase, Calendar, Clock, Building2 } from 'lucide-react';

export default function WorkHistoryView({ userId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    try {
      const res = await API.get(`/work-entry/history?user_id=${userId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.entries || []);
      setEntries(list);
    } catch (err) {
      console.error('Failed to fetch work history:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const parseWorkDesc = (rawDesc) => {
    if (!rawDesc) return { cleanText: '', clientTags: [] };
    const tagMatch = rawDesc.match(/\[Clients:\s*([^\]]+)\]/i);
    let clientTags = [];
    if (tagMatch && tagMatch[1]) {
      clientTags = tagMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    const cleanText = rawDesc.replace(/\n?\[Clients:[^\]]+\]/gi, '').trim();
    return { cleanText, clientTags };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Today's Work Log & History</h2>
          <p className="text-xs text-slate-500 mt-0.5">Review your past daily work entries and logged priorities.</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">Loading history...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No work entries logged yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const { cleanText, clientTags } = parseWorkDesc(entry.work_description);
            return (
              <div key={entry.id || Math.random()} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {entry.entry_date ? entry.entry_date.split('T')[0] : 'Today'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                    <p className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                      {cleanText || 'No details provided.'}
                    </p>
                    {clientTags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clients:</span>
                        {clientTags.map(cName => (
                          <span key={cName} className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                            <Building2 className="w-3 h-3 text-blue-200" />
                            <span>{cName}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
