import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, AlertCircle, Save, Lock, CheckCircle2, Calendar, CreditCard, Briefcase, Building, GraduationCap, Shirt } from 'lucide-react';
import API from '../api';

export default function EditProfileModal({ isOpen, onClose, profile, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    nic: '',
    school_attended: '',
    tshirt_size: '',
    phone: '',
    personal_email: '',
    address: '',
    emp_code: '',
    department: '',
    designation: '',
    card_designation: '',
    joined_date: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isAdmin = (() => {
    try {
      const saved = localStorage.getItem('emp_mgt_user');
      if (saved) return JSON.parse(saved).role === 'Admin';
    } catch {}
    return profile?.role === 'Admin';
  })();

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        dob: profile.dob ? profile.dob.split('T')[0] : '',
        gender: profile.gender || '',
        nic: profile.nic || '',
        school_attended: profile.school_attended || profile.school || '',
        tshirt_size: profile.tshirt_size || profile.t_shirt_size || '',
        phone: profile.phone || '',
        personal_email: profile.personal_email || '',
        address: profile.address || '',
        emp_code: profile.emp_code || '',
        department: profile.department || '',
        designation: profile.designation || '',
        card_designation: profile.card_designation || '',
        joined_date: (profile.date_joined || profile.joined_date) ? (profile.date_joined || profile.joined_date).split('T')[0] : ''
      });
      setErrors({});
      setServerError('');
      setSuccessMsg('');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};

    // NIC validation if provided: 9 digits+V/X or 12 digits
    if (formData.nic && formData.nic.trim() !== '') {
      const nicTrim = formData.nic.trim();
      if (!/^[0-9]{9}[vVxX]$|^[0-9]{12}$/.test(nicTrim)) {
        errs.nic = 'Invalid Sri Lankan NIC format (e.g. 951234567V or 199512345678)';
      }
    }
    
    // Phone validation: max 50 chars, digits/space/+/-/() only
    if (formData.phone && formData.phone.trim() !== '') {
      if (formData.phone.length > 50) {
        errs.phone = 'Phone number must not exceed 50 characters';
      } else if (!/^[0-9\s\+\-\(\)]+$/.test(formData.phone)) {
        errs.phone = 'Phone number can only contain digits, spaces, and + - ( )';
      }
    }

    // Personal Email validation: max 150 chars, email format
    if (formData.personal_email && formData.personal_email.trim() !== '') {
      if (formData.personal_email.length > 150) {
        errs.personal_email = 'Personal email must not exceed 150 characters';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personal_email)) {
        errs.personal_email = 'Please enter a valid email address';
      }
    }

    // Address validation: max 300 chars
    if (formData.address && formData.address.trim() !== '') {
      if (formData.address.length > 300) {
        errs.address = 'Address must not exceed 300 characters';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');

    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        target_user_id: profile?.id,
        name: formData.name ? formData.name.trim() : undefined,
        dob: formData.dob ? formData.dob.trim() : null,
        gender: formData.gender ? formData.gender.trim() : null,
        nic: formData.nic ? formData.nic.trim() : null,
        school_attended: formData.school_attended ? formData.school_attended.trim() : null,
        tshirt_size: formData.tshirt_size ? formData.tshirt_size.trim() : null,
        phone: formData.phone ? formData.phone.trim() : null,
        personal_email: formData.personal_email ? formData.personal_email.trim() : null,
        address: formData.address ? formData.address.trim() : null,
        emp_code: formData.emp_code ? formData.emp_code.trim() : null,
        department: formData.department ? formData.department.trim() : null,
        designation: formData.designation ? formData.designation.trim() : null,
        card_designation: formData.card_designation ? formData.card_designation.trim() : null,
        joined_date: formData.joined_date ? formData.joined_date.trim() : null
      };

      const res = await API.patch('/profile/me', payload);
      setSuccessMsg('Profile details saved successfully!');
      if (onProfileUpdated) {
        onProfileUpdated(res.data);
      }
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to update profile';
      setServerError(errMsg);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Edit Employee Profile</h3>
              <p className="text-xs text-slate-500 font-medium">Update profile details, birthday, and contact information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Server Error Alert */}
          {serverError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SECTION 1: PERSONAL & BIRTHDAY INFORMATION */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
              Personal & Birthday Information
            </h4>

            {/* Date of Birth (Birthday Input) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pink-500" />
                <span>Date of Birth (Birthday)</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                  errors.dob 
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30' 
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              {errors.dob ? (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.dob}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Select birthday to enable live countdowns and daily reminders.</p>
              )}
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Gender</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* NIC / National ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>NIC / National ID</span>
              </label>
              <input
                type="text"
                name="nic"
                value={formData.nic}
                onChange={handleChange}
                placeholder="e.g. 199512345678 or 951234567V"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.nic 
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30' 
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              {errors.nic && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.nic}</p>}
            </div>

            {/* School Attended */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                <span>School Attended</span>
              </label>
              <input
                type="text"
                name="school_attended"
                value={formData.school_attended}
                onChange={handleChange}
                placeholder="e.g. Royal College, Colombo"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* T-Shirt Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-emerald-500" />
                <span>T-Shirt Size</span>
              </label>
              <select
                name="tshirt_size"
                value={formData.tshirt_size}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer"
              >
                <option value="">Select T-Shirt Size</option>
                <option value="XS">XS (Extra Small)</option>
                <option value="S">S (Small)</option>
                <option value="M">M (Medium)</option>
                <option value="L">L (Large)</option>
                <option value="XL">XL (Extra Large)</option>
                <option value="XXL">XXL (Double Extra Large)</option>
                <option value="3XL">3XL</option>
                <option value="4XL">4XL</option>
              </select>
            </div>
          </div>

          {/* SECTION 2: CONTACT DETAILS */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
              Contact Details
            </h4>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +94 77 123 4567"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.phone 
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30' 
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              {errors.phone ? (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.phone}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Used for WhatsApp click-to-chat and SMS/WhatsApp notifications.</p>
              )}
            </div>

            {/* Personal Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Personal Email
              </label>
              <input
                type="email"
                name="personal_email"
                value={formData.personal_email}
                onChange={handleChange}
                placeholder="e.g. john.doe@gmail.com"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.personal_email 
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30' 
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              {errors.personal_email && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.personal_email}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Residential Address
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter current residential address..."
                className={`w-full border rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                  errors.address 
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30' 
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              {errors.address && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* SECTION 3: EMPLOYMENT & COMPANY INFORMATION */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
              Employment Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Emp Code */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Emp Code</label>
                <input
                  type="text"
                  name="emp_code"
                  value={formData.emp_code}
                  onChange={handleChange}
                  placeholder="e.g. EMP-042"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. IT, Finance"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Official Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Card Designation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Card Designation</label>
                <input
                  type="text"
                  name="card_designation"
                  value={formData.card_designation}
                  onChange={handleChange}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Joined Date */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Joined Date</label>
                <input
                  type="date"
                  name="joined_date"
                  value={formData.joined_date}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#022851] hover:bg-[#03376e] active:scale-[0.98] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
