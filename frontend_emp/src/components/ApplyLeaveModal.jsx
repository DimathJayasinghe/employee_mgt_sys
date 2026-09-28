import React, { useState } from 'react';
import { X, CalendarPlus, Plus, Trash2, Zap, Laptop, Smartphone, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ApplyLeaveModal({ isOpen, onClose, onSubmitLeave, user }) {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [halfDaySession, setHalfDaySession] = useState('Morning');
  // Special Leave: list of { day, session } entries
  const [specialEntries, setSpecialEntries] = useState([]);
  const [pendingDay, setPendingDay] = useState('Monday');
  const [pendingSession, setPendingSession] = useState('Full Day');
  
  // Short Leave Fields
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');

  // Power Cut Special Leave Fields
  const [laptopBattery, setLaptopBattery] = useState('');
  const [mobileBattery, setMobileBattery] = useState('');
  const [powerCutDetails, setPowerCutDetails] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState(1);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setLeaveType('Casual Leave');
    setHalfDaySession('Morning');
    setSpecialEntries([]);
    setPendingDay('Monday');
    setPendingSession('Full Day');
    setStartTime('09:00');
    setEndTime('11:30');
    setLaptopBattery('');
    setMobileBattery('');
    setPowerCutDetails('');
    setStartDate('');
    setEndDate('');
    setDaysCount(1);
    setReason('');
    setErrorMsg('');
  };

  const isHalfDay = leaveType === 'Half Day';
  const isShortLeave = leaveType === 'Short Leave';
  const isSpecialLeave = leaveType === 'Special Leave';
  const isPowerCut = leaveType === 'Power Cut';

  const calculateDays = (sDate, eDate) => {
    if (!sDate || !eDate) return 1;
    const s = new Date(sDate);
    const e = new Date(eDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const calculateShortLeaveDuration = (sTime, eTime) => {
    if (!sTime || !eTime) return 0;
    const [sH, sM] = sTime.split(':').map(Number);
    const [eH, eM] = eTime.split(':').map(Number);
    const diffMinutes = (eH * 60 + (sM !== undefined ? eM : 0)) - (sH * 60 + (sM !== undefined ? sM : 0));
    return diffMinutes / 60;
  };

  const shortLeaveHours = calculateShortLeaveDuration(startTime, endTime);
  const isShortLeaveExceeded = isShortLeave && shortLeaveHours > 3.0;
  const isShortLeaveInvalidTime = isShortLeave && shortLeaveHours <= 0;

  const handleStartDateChange = (val) => {
    setStartDate(val);
    setErrorMsg('');
    if (isHalfDay || isShortLeave || isSpecialLeave || isPowerCut) {
      setEndDate(val);
      if (isShortLeave) {
        setDaysCount(shortLeaveHours > 0 ? Math.min(0.5, +(shortLeaveHours / 8).toFixed(2)) : 0.25);
      } else {
        setDaysCount(isHalfDay || isSpecialLeave ? 0.5 : 1);
      }
    } else {
      const targetEnd = endDate && endDate >= val ? endDate : val;
      if (!endDate || endDate < val) setEndDate(val);
      setDaysCount(calculateDays(val, targetEnd));
    }
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    setErrorMsg('');
    if (startDate) {
      setDaysCount(calculateDays(startDate, val));
    }
  };

  const handleLeaveTypeChange = (newType) => {
    setLeaveType(newType);
    setErrorMsg('');
    if (newType === 'Half Day' || newType === 'Special Leave') {
      setDaysCount(0.5);
      if (startDate) setEndDate(startDate);
    } else if (newType === 'Short Leave') {
      const hrs = calculateShortLeaveDuration(startTime, endTime);
      setDaysCount(hrs > 0 ? Math.min(0.5, +(hrs / 8).toFixed(2)) : 0.25);
      if (startDate) setEndDate(startDate);
    } else if (newType === 'Power Cut') {
      setDaysCount(1);
      if (startDate) setEndDate(startDate);
    } else {
      if (startDate && endDate) {
        setDaysCount(calculateDays(startDate, endDate));
      } else {
        setDaysCount(1);
      }
    }
  };

  const handleStartTimeChange = (val) => {
    setStartTime(val);
    setErrorMsg('');
    const hrs = calculateShortLeaveDuration(val, endTime);
    setDaysCount(hrs > 0 ? Math.min(0.5, +(hrs / 8).toFixed(2)) : 0.25);
  };

  const handleEndTimeChange = (val) => {
    setEndTime(val);
    setErrorMsg('');
    const hrs = calculateShortLeaveDuration(startTime, val);
    setDaysCount(hrs > 0 ? Math.min(0.5, +(hrs / 8).toFixed(2)) : 0.25);
  };

  const switchToHalfDay = () => {
    setLeaveType('Half Day');
    setDaysCount(0.5);
    setErrorMsg('');
  };

  const addSpecialEntry = () => {
    // Check for duplicate day
    const exists = specialEntries.find(e => e.day === pendingDay);
    if (exists) {
      setErrorMsg(`${pendingDay} is already added. Remove it first to change the session.`);
      return;
    }
    setSpecialEntries(prev => [...prev, { day: pendingDay, session: pendingSession }]);
    setErrorMsg('');
    // Auto-advance to next available day
    const usedDays = [...specialEntries.map(e => e.day), pendingDay];
    const nextDay = ALL_DAYS.find(d => !usedDays.includes(d));
    if (nextDay) setPendingDay(nextDay);
  };

  const removeSpecialEntry = (day) => {
    setSpecialEntries(prev => prev.filter(e => e.day !== day));
    setErrorMsg('');
  };

  // Sort entries by day order
  const sortedEntries = [...specialEntries].sort(
    (a, b) => ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate) {
      setErrorMsg('Please select a date.');
      return;
    }

    if (isShortLeave) {
      if (!startTime || !endTime) {
        setErrorMsg('Please specify both Start Time and End Time for Short Leave.');
        return;
      }
      const hrs = calculateShortLeaveDuration(startTime, endTime);
      if (hrs <= 0) {
        setErrorMsg('End Time must be later than Start Time.');
        return;
      }
      if (hrs > 3.0) {
        setErrorMsg(`Short Leave cannot exceed 3 hours (Selected: ${hrs.toFixed(1)} hrs). Please apply for a Half Day leave instead.`);
        return;
      }
    }

    if (isSpecialLeave && specialEntries.length === 0) {
      setErrorMsg('Please add at least one day for Special Leave.');
      return;
    }

    if (isPowerCut) {
      if (!laptopBattery.trim()) {
        setErrorMsg('Please enter the battery power / percentage of your laptop.');
        return;
      }
      if (!mobileBattery.trim()) {
        setErrorMsg('Please enter the battery percentage of your mobile.');
        return;
      }
    }

    const finalEndDate = (isHalfDay || isShortLeave || isSpecialLeave || isPowerCut) ? startDate : endDate;
    if (!finalEndDate) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const specialDaysTotal = sortedEntries.reduce((sum, e) => sum + (e.session === 'Full Day' ? 1 : 0.5), 0);
      const finalDaysCount = isSpecialLeave 
        ? specialDaysTotal 
        : isShortLeave 
        ? Math.min(0.5, +(shortLeaveHours / 8).toFixed(2))
        : (isHalfDay ? 0.5 : (Number(daysCount) || 1));

      // Build the day_of_week string: "Monday:Full Day,Wednesday:Half Day"
      const dayOfWeekStr = isSpecialLeave
        ? sortedEntries.map(e => `${e.day}:${e.session}`).join(',')
        : null;

      let finalReason = reason;
      if (isHalfDay) {
        finalReason = `[${halfDaySession} Half Day] ${reason}`.trim();
      } else if (isShortLeave) {
        finalReason = `[Short Leave: ${startTime} - ${endTime} (${shortLeaveHours.toFixed(1)} hrs)] ${reason}`.trim();
      } else if (isSpecialLeave) {
        const entryDesc = sortedEntries.map(e => `${e.day} (${e.session})`).join(', ');
        finalReason = `[Special Leave - ${entryDesc}] ${reason}`.trim();
      } else if (isPowerCut) {
        const extra = powerCutDetails.trim() || reason.trim();
        finalReason = `[Power Cut | Laptop Battery: ${laptopBattery.trim()}, Mobile Battery: ${mobileBattery.trim()}] ${extra}`.trim();
      }

      await onSubmitLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: finalEndDate,
        days_count: finalDaysCount,
        day_of_week: dayOfWeekStr,
        start_time: isShortLeave ? (startTime + ':00') : isHalfDay ? (halfDaySession === 'Morning' ? '08:30:00' : '12:30:00') : null,
        end_time: isShortLeave ? (endTime + ':00') : isHalfDay ? (halfDaySession === 'Morning' ? '12:30:00' : '17:30:00') : null,
        special_session: isHalfDay ? halfDaySession : isShortLeave ? `${shortLeaveHours.toFixed(1)} hrs` : null,
        is_recurring: isSpecialLeave ? 1 : 0,
        reason: finalReason
      });

      // Construct WhatsApp message
      const empName = user?.name || 'Employee';
      const empDept = user?.department ? ` (${user.department})` : '';
      const waNumbers = ['94775227748', '94777885883'];
      
      let leaveDurationStr = '';
      if (isSpecialLeave) {
        leaveDurationStr = sortedEntries.map(e => `${e.day} (${e.session})`).join(', ') + ` starting ${startDate}`;
      } else if (isShortLeave) {
        leaveDurationStr = `${startDate} (${startTime} to ${endTime} · ${shortLeaveHours.toFixed(1)} hrs)`;
      } else if (isPowerCut) {
        leaveDurationStr = `${startDate} (Power Cut)`;
      } else {
        leaveDurationStr = `${startDate} to ${finalEndDate} (${finalDaysCount} ${finalDaysCount === 1 ? 'day' : 'days'})`;
      }

      let extraWaDetails = '';
      if (isPowerCut) {
        extraWaDetails = `\n*Laptop Battery:* ${laptopBattery.trim()}\n*Mobile Battery:* ${mobileBattery.trim()}\n*Additional Outage Details:* ${powerCutDetails.trim() || reason.trim() || 'None'}`;
      }

      const waMessage = 
`*New Leave Request Submission*
----------------------------------
*Employee Name:* ${empName}${empDept}
*Leave Type:* ${isShortLeave ? '⏱️ Short Leave' : isPowerCut ? '⚡ Power Cut' : leaveType}
*Duration / Date:* ${leaveDurationStr}${extraWaDetails ? extraWaDetails : `\n*Reason / Details:* ${finalReason || 'None'}`}
----------------------------------
Submitted via P W Holdings Employee Management System`;

      const encodedMsg = encodeURIComponent(waMessage);
      
      waNumbers.forEach((num, index) => {
        const waUrl = `https://wa.me/${num}?text=${encodedMsg}`;
        setTimeout(() => {
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }, index * 400);
      });

      resetForm();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit leave request';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableDays = ALL_DAYS.filter(d => !specialEntries.find(e => e.day === d));

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-semibold leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => handleLeaveTypeChange(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="Casual Leave">Casual Leave</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Half Day">Half Day</option>
              <option value="Short Leave">⏱️ Short Leave (Max 3 hrs)</option>
              <option value="Study Leave">Study Leave</option>
              <option value="Special Leave">Special Leave (Weekly Recurring)</option>
              <option value="Power Cut">⚡ Power Cut (Emergency Leave)</option>
            </select>
          </div>

          {/* Short Leave Section */}
          {isShortLeave && (
            <div className="bg-teal-50/70 p-4 rounded-xl border border-teal-200/80 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Short Leave Time Window (Max 3 Hours)</span>
                </div>
                {shortLeaveHours > 0 && shortLeaveHours <= 3.0 && (
                  <span className="bg-teal-100/80 text-teal-800 border border-teal-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                    {shortLeaveHours.toFixed(1)} hrs duration
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-teal-950 mb-1">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full border border-teal-200 rounded-xl px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-teal-950 mb-1">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full border border-teal-200 rounded-xl px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
                  />
                </div>
              </div>

              {/* Exceed 3 Hours Warning & Switch Prompt */}
              {isShortLeaveExceeded && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2 text-rose-800 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      Short Leave cannot exceed 3 hours. Your selected duration is <strong className="text-rose-950 underline">{shortLeaveHours.toFixed(1)} hours</strong>.
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    If you need more than 3 hours of leave, please switch to a <strong>Half Day</strong> leave request.
                  </p>
                  <button
                    type="button"
                    onClick={switchToHalfDay}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer text-xs"
                  >
                    <span>Switch to Half Day Leave</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {isShortLeaveInvalidTime && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2.5 rounded-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>End Time must be later than Start Time.</span>
                </div>
              )}
            </div>
          )}

          {/* Power Cut Leave Section */}
          {isPowerCut && (
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/70 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Power Cut (Outage Leave Details)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-950 mb-1 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-amber-700" />
                    <span>Laptop Battery</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={laptopBattery}
                    onChange={(e) => setLaptopBattery(e.target.value)}
                    placeholder="e.g. 35% or 1.5 hrs"
                    className="w-full border border-amber-200 rounded-xl px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-950 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                    <span>Mobile Battery</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mobileBattery}
                    onChange={(e) => setMobileBattery(e.target.value)}
                    placeholder="e.g. 70%"
                    className="w-full border border-amber-200 rounded-xl px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={powerCutDetails}
                  onChange={(e) => setPowerCutDetails(e.target.value)}
                  placeholder="e.g. Power outage started at 1:30 PM, estimated power back at 5:30 PM..."
                  className="w-full border border-amber-200 rounded-xl p-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-medium"
                />
              </div>
            </div>
          )}

          {/* Special Leave: Add day + session entries one by one */}
          {isSpecialLeave && (
            <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200/60 space-y-3">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
                <span>🔄 Weekly Recurring Special Leave</span>
              </div>

              {/* Added entries list */}
              {sortedEntries.length > 0 && (
                <div className="space-y-1.5">
                  {sortedEntries.map(entry => (
                    <div
                      key={entry.day}
                      className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-purple-200/80 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{entry.day}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          entry.session === 'Full Day'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {entry.session === 'Full Day' ? '☀️ Full Day' : '🌗 Half Day'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpecialEntry(entry.day)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new entry row */}
              {availableDays.length > 0 && (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-purple-900 mb-1">Day</label>
                    <select
                      value={pendingDay}
                      onChange={(e) => setPendingDay(e.target.value)}
                      className="w-full border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                    >
                      {availableDays.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-purple-900 mb-1">Duration</label>
                    <div className="flex bg-purple-100/60 p-0.5 rounded-lg border border-purple-200/50">
                      <button
                        type="button"
                        onClick={() => setPendingSession('Full Day')}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          pendingSession === 'Full Day'
                            ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        ☀️ Full Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingSession('Half Day')}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          pendingSession === 'Half Day'
                            ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        🌗 Half Day
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addSpecialEntry}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    title="Add day"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              {availableDays.length === 0 && (
                <p className="text-[10px] text-purple-600 font-medium text-center">All days have been added.</p>
              )}
            </div>
          )}

          {/* Half Day Session Options (Morning / Evening) */}
          {isHalfDay && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Half Day Session</label>
              <div className="grid grid-cols-2 gap-2 bg-amber-50/60 p-1 rounded-xl border border-amber-200/50">
                <button
                  type="button"
                  onClick={() => setHalfDaySession('Morning')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    halfDaySession === 'Morning'
                      ? 'bg-white text-amber-700 shadow-2xs border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌅 Morning Session
                </button>
                <button
                  type="button"
                  onClick={() => setHalfDaySession('Evening')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    halfDaySession === 'Evening'
                      ? 'bg-white text-indigo-700 shadow-2xs border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌆 Evening Session
                </button>
              </div>
            </div>
          )}

          {/* Date Fields */}
          {(isHalfDay || isShortLeave || isSpecialLeave || isPowerCut) ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isSpecialLeave ? 'Effective Start Date' : 'Date'}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Days (Auto-calculated)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={daysCount}
                  onChange={(e) => setDaysCount(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                />
              </div>
            </>
          )}

          {!isPowerCut && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason {isShortLeave ? '(Optional)' : '(Optional)'}
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isShortLeave ? "Optional brief reason for short leave..." : "Brief reason for your leave request..."}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-medium"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isShortLeave && (isShortLeaveExceeded || isShortLeaveInvalidTime))}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
