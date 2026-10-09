import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, AlertCircle, Save, Lock, CheckCircle2, Calendar, CreditCard, Briefcase, Building, GraduationCap, Shirt, Eye, EyeOff } from 'lucide-react';
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
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentUser = (() => {
    try {
      const saved = localStorage.getItem('emp_mgt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {}
    return null;
  })();

  const isAdmin = currentUser?.role === 'Admin' || profile?.role === 'Admin';

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
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordSection(false);
      setShowPasswords(false);
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

    // Password validation if section is active and filled
    if (showPasswordSection && (passwordData.newPassword || passwordData.currentPassword || passwordData.confirmPassword)) {
      const isSelf = !isAdmin || (profile && currentUser && String(profile.id) === String(currentUser.id));
      if (isSelf && !passwordData.currentPassword) {
        errs.currentPassword = 'Current password is required to change password';
      }
      if (!passwordData.newPassword) {
        errs.newPassword = 'New password is required';
      } else if (passwordData.newPassword.length < 6) {
        errs.newPassword = 'Password must be at least 6 characters long';
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        errs.confirmPassword = 'New passwords do not match';
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

      // If password update requested, submit to change-password endpoint
      if (showPasswordSection && passwordData.newPassword) {
        await API.post('/profile/change-password', {
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          target_user_id: profile?.id
        });
      }

      setSuccessMsg(showPasswordSection && passwordData.newPassword ? 'Profile details and password saved successfully!' : 'Profile details saved successfully!');
      if (onProfileUpdated) {
        onProfileUpdated(res.data);
      }
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 900);
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

          {/* SECTION 3: EMPLOYMENT & COMPANY INFORMATION (ADMIN EDITABLE) */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center justify-between">
              <span>Employment Information</span>
              {!isAdmin && <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Lock className="w-3 h-3" /> Admin Only</span>}
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
                  disabled={!isAdmin}
                  placeholder="e.g. John Doe"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  disabled={!isAdmin}
                  placeholder="e.g. EMP-042"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  disabled={!isAdmin}
                  placeholder="e.g. IT, Finance"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  disabled={!isAdmin}
                  placeholder="e.g. Software Engineer"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  disabled={!isAdmin}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  disabled={!isAdmin}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: SECURITY & PASSWORD */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Security & Password</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(!showPasswordSection);
                  if (showPasswordSection) {
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setErrors(prev => ({ ...prev, currentPassword: null, newPassword: null, confirmPassword: null }));
                  }
                }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {showPasswordSection ? 'Cancel Password Change' : '+ Change Password'}
              </button>
            </div>

            {showPasswordSection && (
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                {/* Current Password (required if editing self) */}
                {(!isAdmin || (profile && currentUser && String(profile.id) === String(currentUser.id))) && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Current Password</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => {
                          setPasswordData(p => ({ ...p, currentPassword: e.target.value }));
                          if (errors.currentPassword) setErrors(p => ({ ...p, currentPassword: null }));
                        }}
                        placeholder="Enter current password"
                        className={`w-full border rounded-xl px-3 py-2 pr-9 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 ${
                          errors.currentPassword ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {errors.currentPassword && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.currentPassword}</p>}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* New Password */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>New Password</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          setPasswordData(p => ({ ...p, newPassword: e.target.value }));
                          if (errors.newPassword) setErrors(p => ({ ...p, newPassword: null }));
                        }}
                        placeholder="Min. 6 characters"
                        className={`w-full border rounded-xl px-3 py-2 pr-9 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 ${
                          errors.newPassword ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.newPassword}</p>}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Confirm New Password</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) => {
                          setPasswordData(p => ({ ...p, confirmPassword: e.target.value }));
                          if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: null }));
                        }}
                        placeholder="Re-enter new password"
                        className={`w-full border rounded-xl px-3 py-2 pr-9 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 ${
                          errors.confirmPassword ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}
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
