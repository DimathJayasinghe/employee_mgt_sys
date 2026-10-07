import React, { useState } from 'react';
import API from '../../api';
import { 
  UserPlus, 
  Building2, 
  Calendar, 
  Mail, 
  Briefcase, 
  IdCard, 
  Hash, 
  User, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function AdminAddEmployeeView() {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    date_joined: '',
    designation: '',
    card_designation: '',
    email: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      name: '',
      dob: '',
      date_joined: '',
      designation: '',
      card_designation: '',
      email: ''
    });
    setStatusMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setStatusMessage({ type: 'error', text: 'Name and Email are required fields.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await API.post('/zoho/employee', formData);
      if (res.data?.success || res.data?.message?.includes('success')) {
        setStatusMessage({
          type: 'success',
          text: res.data.message || '✅ Employee entry created successfully in Zoho Books (cm_employee)!'
        });
        setFormData({
          name: '',
          dob: '',
          date_joined: '',
          designation: '',
          card_designation: '',
          email: ''
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.data?.message || res.data?.error || 'Failed to submit entry to Zoho Books.'
        });
      }
    } catch (err) {
      console.error('Failed to submit to Zoho Books:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Network error occurred.';
      setStatusMessage({ type: 'error', text: `❌ ${msg}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 select-none">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Zoho Books Custom Module</span>
            </span>
            <span className="text-xs text-slate-300 font-medium">•</span>
            <span className="text-xs font-bold text-slate-500">`cm_employee` Sync</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add New Employee Entry</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Fill out the form below to submit a new employee record directly to Zoho Books (EMP CODE is auto-assigned by Zoho).
          </p>
        </div>
      </div>

      {/* Alert Status Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs sm:text-sm font-semibold">
            {statusMessage.text}
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Zoho Books Employee Record Fields</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              Module: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[11px]">cm_employee</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* NAME */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>NAME <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Hashan Chathuranga"
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* DOB */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>DATE OF BIRTH (DOB)</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* DATE OF JOINED */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>DATE OF JOINED</span>
              </label>
              <input
                type="date"
                name="date_joined"
                value={formData.date_joined}
                onChange={handleChange}
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* DESIGNATION */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span>DESIGNATION</span>
              </label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">-- Select Designation --</option>
                <option value="Systems Consultant">Systems Consultant</option>
                <option value="Associate Systems Consultant">Associate Systems Consultant</option>
                <option value="Associate Software Engineer ">Associate Software Engineer</option>
              </select>
            </div>

            {/* CARD DESIGNATION */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-blue-500" />
                <span>CARD DESIGNATION</span>
              </label>
              <select
                name="card_designation"
                value={formData.card_designation}
                onChange={handleChange}
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">-- Select Card Designation --</option>
                <option value="Systems Consultant">Systems Consultant</option>
                <option value="Application Consultant">Application Consultant</option>
              </select>
            </div>

            {/* EMAIL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>EMAIL ADDRESS <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. hashan@pwholdings.lk"
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="bg-[#022851] hover:bg-[#03376e] active:scale-[0.98] text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting to Zoho Books...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Zoho Books</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
