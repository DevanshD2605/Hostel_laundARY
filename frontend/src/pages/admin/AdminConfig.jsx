import React, { useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { DAY_NAMES } from '../../constants/domain';
import {
  Building,
  Calendar,
  Layers,
  Plus,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export function AdminConfig() {
  const { config, refreshConfig } = useAuth();
  const [activeTab, setActiveTab] = useState('hostels');

  // New Hostel Form
  const [hostelName, setHostelName] = useState('');
  const [hostelGroup, setHostelGroup] = useState('Boys');
  const [colDay, setColDay] = useState(1); // Monday
  const [delDay, setDelDay] = useState(5); // Friday

  // New Semester Form
  const [semName, setSemName] = useState('');
  const [semStart, setSemStart] = useState('');
  const [semEnd, setSemEnd] = useState('');

  // Category & Condition
  const [catName, setCatName] = useState('');
  const [condName, setCondName] = useState('');

  const [loading, setLoading] = useState(false);

  // Handlers
  const handleAddHostel = async (e) => {
    e.preventDefault();
    if (!hostelName.trim()) return;
    setLoading(true);
    try {
      await api.addHostel({
        name: hostelName.trim(),
        group: hostelGroup,
        days: [parseInt(colDay, 10), parseInt(delDay, 10)]
      });
      alert(`Hostel ${hostelName.trim()} created!`);
      setHostelName('');
      refreshConfig();
    } catch (err) {
      alert(err.message || 'Failed to add hostel.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSemester = async (e) => {
    e.preventDefault();
    if (!semName.trim() || !semStart || !semEnd) return;
    if (!window.confirm(`Start new semester "${semName}"? This will set all active student enrollments to Pending Renewal.`)) return;

    setLoading(true);
    try {
      const res = await api.startSemester({
        name: semName.trim(),
        start: semStart,
        end: semEnd
      });
      alert(`Semester ${semName.trim()} started! ${res.pending} students set to pending renewal.`);
      setSemName('');
      setSemStart('');
      setSemEnd('');
      refreshConfig();
    } catch (err) {
      alert(err.message || 'Failed to start semester.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRenewals = async () => {
    if (!window.confirm('Bulk approve all pending student semester renewals?')) return;
    setLoading(true);
    try {
      const approved = await api.approveRenewals();
      alert(`Approved ${approved} student renewals!`);
      refreshConfig();
    } catch (err) {
      alert(err.message || 'Failed to approve renewals.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await api.addCategory(catName.trim());
      setCatName('');
      refreshConfig();
    } catch (err) {
      alert(err.message || 'Failed to add category.');
    }
  };

  const handleToggleCategory = async (name) => {
    try {
      await api.toggleCategory(name);
      refreshConfig();
    } catch (err) {
      alert(err.message || 'Failed to toggle category.');
    }
  };

  const handleAddCondition = async (e) => {
    e.preventDefault();
    if (!condName.trim()) return;
    try {
      await api.addCondition(condName.trim());
      setCondName('');
      refreshConfig();
    } catch (err) {
      alert(err.message || 'Failed to add condition.');
    }
  };

  const handleRemoveCondition = async (name) => {
    try {
      await api.removeCondition(name);
      refreshConfig();
    } catch (err) {
      alert(err.message || 'Failed to remove condition.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold uppercase tracking-wider">
            Campus Infrastructure Settings
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Hostels, Semesters & Garment Configurations
        </h2>
        <p className="text-xs text-slate-500">
          Manage operational schedules, academic term rollover, accepted apparel types, and damage notation tags
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('hostels')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'hostels'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Hostels & Schedules ({config?.hostels?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('semesters')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'semesters'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Academic Semesters ({config?.semesters?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('garments')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'garments'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Garment Categories & Defects
        </button>
      </div>

      {/* Tab 1: Hostels */}
      {activeTab === 'hostels' && (
        <div className="space-y-6">
          {/* Add Hostel Form */}
          <form onSubmit={handleAddHostel} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Add New Campus Hostel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Hostel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hostel R"
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Gender Group
                </label>
                <select
                  value={hostelGroup}
                  onChange={(e) => setHostelGroup(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="Boys">Boys Hostel</option>
                  <option value="Girls">Girls Hostel</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Drop-off Day
                </label>
                <select
                  value={colDay}
                  onChange={(e) => setColDay(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Delivery Day
                </label>
                <select
                  value={delDay}
                  onChange={(e) => setDelDay(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Add Hostel
              </button>
            </div>
          </form>

          {/* Hostels List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(config?.hostels || []).map((h) => (
              <div key={h.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-extrabold text-sm text-slate-900">{h.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${h.group === 'Boys' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                    {h.group}
                  </span>
                </div>
                <div className="text-slate-500">
                  <span>Intake: <strong>{DAY_NAMES[h.days[0]]}</strong></span>
                  <span className="mx-1">→</span>
                  <span>Delivery: <strong>{DAY_NAMES[h.days[1]]}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Semesters */}
      {activeTab === 'semesters' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-teal-50 rounded-2xl border border-teal-200">
            <div>
              <span className="font-bold text-teal-900 text-xs block">Bulk Approve Student Renewals</span>
              <p className="text-teal-700 text-[11px]">One-click approve all pending student enrollments for the current semester.</p>
            </div>
            <button
              onClick={handleApproveRenewals}
              disabled={loading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              Approve All Pending Renewals
            </button>
          </div>

          {/* Start New Semester Form */}
          <form onSubmit={handleStartSemester} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Start New Semester (Automated Rollover)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Semester Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2027-28 Sem 1"
                  value={semName}
                  onChange={(e) => setSemName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={semStart}
                  onChange={(e) => setSemStart(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={semEnd}
                  onChange={(e) => setSemEnd(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Roll Over & Start Semester
              </button>
            </div>
          </form>

          {/* Semesters List */}
          <div className="space-y-2">
            {(config?.semesters || []).map((s) => (
              <div key={s.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {s.start} to {s.end}
                  </div>
                </div>
                {s.current ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                    Current Active Term
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-medium rounded-full text-xs">
                    Past Semester
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Garments & Defects */}
      {activeTab === 'garments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Accepted Clothing Categories
            </h3>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="New category (e.g. Blazer, Jacket)..."
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold">
                Add
              </button>
            </form>

            <div className="space-y-2">
              {(config?.categories || []).map((c) => (
                <div key={c.name} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                  <span className={`font-bold ${c.on ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                    {c.name}
                  </span>
                  <button
                    onClick={() => handleToggleCategory(c.name)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      c.on ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {c.on ? 'Active' : 'Retired'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Condition Defect Options */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Pre-existing Defect Notation Tags
            </h3>
            <form onSubmit={handleAddCondition} className="flex gap-2">
              <input
                type="text"
                placeholder="New defect tag (e.g. Broken zipper)..."
                value={condName}
                onChange={(e) => setCondName(e.target.value)}
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
              <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold">
                Add Tag
              </button>
            </form>

            <div className="space-y-2">
              {(config?.conditions || []).map((cond) => (
                <div key={cond} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                  <span className="font-bold text-slate-800">{cond}</span>
                  <button
                    onClick={() => handleRemoveCondition(cond)}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
