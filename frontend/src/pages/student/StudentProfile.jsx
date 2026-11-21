import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { User, Phone, Home, Building, ShieldCheck, Check, AlertCircle } from 'lucide-react';

export function StudentProfile() {
  const { user, config, refreshUser } = useAuth();
  const [name, setName] = useState(user?.profile?.name || user?.name || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [gender, setGender] = useState(user?.profile?.gender || 'Boys');
  const [hostelId, setHostelId] = useState(user?.profile?.hostelId || 'O');
  const [room, setRoom] = useState(user?.profile?.room || '');
  const [loading, setLoading] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hostels = config?.hostels || [];
  const eligibleHostels = hostels.filter((h) => h.group === gender);
  const currentSemester = config?.semesters?.find((s) => s.current);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }
    if (!room.trim()) {
      setError('Please enter your room number.');
      return;
    }

    setLoading(true);
    try {
      await api.saveProfile({
        name: name.trim(),
        phone: phone.trim(),
        gender,
        hostelId,
        room: room.trim()
      });
      await refreshUser();
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await api.renewEnrollment();
      await refreshUser();
      setMessage('Semester enrollment renewed successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Renewal failed.');
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Student Profile & Hostel Room
        </h2>
        <p className="text-xs text-slate-500">
          Manage your contact information, room assignment and semester status
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Semester Enrollment Status Box */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Current Academic Term
          </span>
          <div className="font-extrabold text-slate-900 text-sm mt-0.5">
            {currentSemester?.name || '2026-27 Sem 1'}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                user?.enrollment?.status === 'Active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : user?.enrollment?.status === 'Pending renewal'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Status: {user?.enrollment?.status || 'Active'}
            </span>
            <span className="text-xs text-slate-500">
              {user?.profile?.hostelId ? `Hostel ${user.profile.hostelId}` : ''}
            </span>
          </div>
        </div>

        {user?.enrollment?.status === 'Pending renewal' && (
          <button
            onClick={handleRenew}
            disabled={renewing}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            {renewing ? 'Renewing...' : 'Renew Enrollment'}
          </button>
        )}
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Roll Number (Fixed)
            </label>
            <input
              type="text"
              disabled
              value={user?.id || ''}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Thapar Email
            </label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              10-Digit Mobile Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 pt-4 pb-2 border-b border-slate-100">
          Hostel & Room Assignment
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Gender Group
            </label>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                const nextEligible = hostels.filter(h => h.group === e.target.value);
                if (nextEligible.length > 0) setHostelId(nextEligible[0].id);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Boys">Boys Hostels</option>
              <option value="Girls">Girls Hostels</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Hostel
            </label>
            <select
              value={hostelId}
              onChange={(e) => setHostelId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {eligibleHostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Room Number
            </label>
            <div className="relative">
              <Home className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. O-418"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
