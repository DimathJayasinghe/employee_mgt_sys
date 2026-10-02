import React, { useState, useEffect } from 'react';
import API from '../../api';
import { 
  Building2, Search, Users, Calendar, Clock, ChevronDown, 
  ChevronUp, FileText, CheckCircle2, TrendingUp, RefreshCw, 
  User, Briefcase, Sparkles 
} from 'lucide-react';

export default function AdminClientAnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClient, setExpandedClient] = useState(null);

  useEffect(() => {
    fetchClientAnalytics();
  }, []);

  const fetchClientAnalytics = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/client-analytics');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching client analytics:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const parseLogDesc = (rawDesc) => {
    if (!rawDesc) return { cleanText: 'No details provided.', clientTags: [] };
    const tagMatch = rawDesc.match(/\[Clients:\s*([^\]]+)\]/i);
    let clientTags = [];
    if (tagMatch && tagMatch[1]) {
      clientTags = tagMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    const cleanText = rawDesc.replace(/\n?\[Clients:[^\]]+\]/gi, '').trim();
    return { cleanText: cleanText || 'No details provided.', clientTags };
  };

  const analytics = data?.analytics || [];

  const filteredAnalytics = analytics.filter((c) => {
    const nameMatch = c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const empMatch = c.employees?.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()));
    return nameMatch || empMatch;
  });

  const totalClients = data?.total_clients || analytics.length;
  const activeClients = data?.active_clients_worked || analytics.filter(c => c.total_work_entries > 0).length;
  const mostActiveClient = analytics.length > 0 ? analytics[0]?.client_name : 'N/A';

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Zoho Books Live Sync</span>
            </span>
            <span className="text-xs text-slate-300 font-medium">•</span>
            <span className="text-xs font-bold text-slate-500">Client Resource Intelligence</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Client Work Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Monitor employee resource allocation, total active work entries, and daily task logs per client company.
          </p>
        </div>

        <button
          onClick={fetchClientAnalytics}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Zoho Clients</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalClients}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Synced from Zoho Books</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Building2 className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Work Clients</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{activeClients}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Clients with logged tasks</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Most Active Client</p>
            <h3 className="text-base font-black text-slate-900 mt-0.5 truncate max-w-[130px]">{mostActiveClient}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Highest task volume</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Coverage</p>
            <h3 className="text-2xl font-black text-blue-900 mt-0.5">
              {totalClients > 0 ? `${((activeClients / totalClients) * 100).toFixed(0)}%` : '0%'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Engagement ratio</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search client or employee..."
            className="w-full bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-2xs"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          Showing {filteredAnalytics.length} Clients ({activeClients} Active)
        </span>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Fetching Zoho Books Client Analytics...</span>
          </div>
        ) : filteredAnalytics.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            No client records found matching "{searchTerm}".
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAnalytics.map((client) => {
              const isExpanded = expandedClient === client.client_name;
              const hasWork = client.total_work_entries > 0;

              return (
                <div key={client.client_name} className="transition-colors">
                  {/* Client Header Item */}
                  <div 
                    onClick={() => setExpandedClient(isExpanded ? null : client.client_name)}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center border shrink-0 shadow-2xs ${
                        hasWork 
                          ? 'bg-blue-600 text-white border-blue-700' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-base">{client.client_name}</h4>
                          {hasWork ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                              Active Work
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-md">
                              No Recent Entries
                            </span>
                          )}
                        </div>

                        {/* Assigned Employees List */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Assigned Team:
                          </span>
                          {client.employees && client.employees.length > 0 ? (
                            client.employees.map((emp) => (
                              <span
                                key={emp}
                                className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200/80 transition-colors flex items-center gap-1"
                              >
                                <User className="w-2.5 h-2.5 text-slate-500" />
                                <span>{emp}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No tasks logged yet</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats & Toggle */}
                    <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-base font-black text-slate-900">
                          {client.total_work_entries} <span className="text-xs font-bold text-slate-400">Entries</span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {client.total_employees_count} Employees • {client.latest_work_date || 'No Date'}
                        </p>
                      </div>

                      <button className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Logs Panel */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 p-4 sm:p-5 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Work Logs for {client.client_name}</span>
                        </h5>
                        <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                          {client.logs?.length || 0} Logs Recorded
                        </span>
                      </div>

                      {client.logs && client.logs.length > 0 ? (
                        <div className="space-y-2">
                          {client.logs.map((log) => {
                            const { cleanText } = parseLogDesc(log.work_description);
                            return (
                              <div 
                                key={log.id} 
                                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-start justify-between gap-3"
                              >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 font-extrabold text-xs flex items-center justify-center border border-blue-200 shrink-0">
                                    {log.initials}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-900 text-xs">{log.employee_name}</span>
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/70">
                                        {log.department}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-800 font-medium mt-1 leading-relaxed whitespace-pre-wrap">
                                      {cleanText}
                                    </p>
                                  </div>
                                </div>

                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80 shrink-0 flex items-center gap-1 self-end md:self-start">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{log.entry_date}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-slate-200/80">
                          No work logs recorded yet for this client.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
