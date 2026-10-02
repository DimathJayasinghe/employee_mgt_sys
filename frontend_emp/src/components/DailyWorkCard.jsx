import React, { useState, useEffect } from 'react';
import { Save, Check, Building2, Plus, X, Search, CheckCircle2 } from 'lucide-react';
import API from '../api';

export default function DailyWorkCard({ initialWork, onSaveWork }) {
  const [workText, setWorkText] = useState('');
  const [availableClients, setAvailableClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  useEffect(() => {
    if (initialWork !== undefined) {
      const rawText = initialWork || '';
      const tagMatch = rawText.match(/\[Clients:\s*([^\]]+)\]/i);
      if (tagMatch && tagMatch[1]) {
        const clientList = tagMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        setSelectedClients(clientList);
        const cleanText = rawText.replace(/\n?\[Clients:[^\]]+\]/gi, '').trim();
        setWorkText(cleanText);
      } else {
        setWorkText(rawText);
      }
    }
  }, [initialWork]);

  useEffect(() => {
    fetchZohoClients();
  }, []);

  const fetchZohoClients = async () => {
    try {
      const res = await API.get('/zoho/clients');
      const list = res.data?.clients || [];
      setAvailableClients(list);
    } catch (err) {
      console.error('Failed to fetch Zoho clients:', err);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const toggleClientSelection = (clientName) => {
    if (!clientName) return;
    const trimmed = clientName.trim();
    if (!trimmed) return;
    if (selectedClients.includes(trimmed)) {
      setSelectedClients(prev => prev.filter(c => c !== trimmed));
    } else {
      setSelectedClients(prev => [...prev, trimmed]);
    }
  };

  const filteredClients = availableClients.filter((client) => {
    const cName = client.contact_name || client.company_name || '';
    return cName.toLowerCase().includes(clientSearch.toLowerCase());
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    await onSaveWork(workText, selectedClients);
    setIsSaving(false);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      {/* Top Label */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Daily Work Entry</p>
        {/*
        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
          <Building2 className="w-3 h-3 text-blue-600" />
          <span>Zoho Books Sync ({availableClients.length} Live Clients)</span>
        </span>
        */}
      </div>

      {/* Main Heading & Subtitle */}
      <h3 className="text-xl font-bold text-slate-900 mt-1">What are you working on today?</h3>
      <p className="text-xs text-slate-500 mt-0.5 mb-4">
        Keep your team informed with a clear summary of your priorities for today.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* TEMPORARILY HIDDEN ZOHO CLIENT SELECTION - UNCOMMENT TO RESTORE IN FUTURE */}
        {/* 
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Select Zoho Books Client(s) Worked For Today</span>
            </label>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
              {selectedClients.length} Selected
            </span>
          </div>

          {selectedClients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-blue-100 shadow-2xs">
              {selectedClients.map((cName) => (
                <span
                  key={cName}
                  className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-3 h-3 text-blue-200" />
                  <span>{cName}</span>
                  <button
                    type="button"
                    onClick={() => toggleClientSelection(cName)}
                    className="hover:text-rose-200 p-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search from 237+ Zoho Books clients..."
                className="w-full bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            <select
              onChange={(e) => {
                if (e.target.value) {
                  toggleClientSelection(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs min-w-[180px]"
            >
              <option value="">+ Add Client from List...</option>
              {availableClients.map((c) => {
                const name = c.contact_name || c.company_name;
                return (
                  <option key={c.id || name} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="max-h-36 overflow-y-auto pr-1 flex flex-wrap gap-1.5 pt-1">
            {clientSearch.trim().length > 0 && !selectedClients.includes(clientSearch.trim()) && (
              <button
                type="button"
                onClick={() => {
                  toggleClientSelection(clientSearch.trim());
                  setClientSearch('');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3 h-3 text-white" />
                <span>Add "{clientSearch.trim()}"</span>
              </button>
            )}
            {isLoadingClients ? (
              <span className="text-xs text-slate-400 italic">Loading Zoho Books clients...</span>
            ) : filteredClients.length === 0 && clientSearch.trim().length === 0 ? (
              <span className="text-xs text-slate-400 italic">No clients found matching search</span>
            ) : (
              filteredClients.slice(0, 30).map((client) => {
                const cName = client.contact_name || client.company_name;
                const isSelected = selectedClients.includes(cName);
                return (
                  <button
                    type="button"
                    key={client.id || cName}
                    onClick={() => toggleClientSelection(cName)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <span>{cName}</span>
                    {isSelected ? <X className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-slate-400" />}
                  </button>
                );
              })
            )}
            {filteredClients.length > 30 && (
              <span className="text-[11px] font-semibold text-slate-400 self-center px-1">
                + {filteredClients.length - 30} more (use search to find specific client)
              </span>
            )}
          </div>
        </div>
        */}

        {/* Work Description Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Today's work description
          </label>
          <textarea
            value={workText}
            onChange={(e) => setWorkText(e.target.value.slice(0, 500))}
            placeholder="Describe your goals and tasks for today..."
            rows={4}
            className="w-full border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-normal"
          />
        </div>

        {/* Footer info & button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-400 font-medium">
            {workText.length}/500 characters
          </span>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#022851] hover:bg-[#03376e] active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Updating...' : 'Update work'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
