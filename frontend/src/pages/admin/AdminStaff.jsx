import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Plus, UserX, UserCheck, Mail, Building, X, CheckCircle2 } from 'lucide-react';

export function AdminStaff() {
  const { config } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hostelId, setHostelId] = useState('O');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await api.listStaff();
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleActive = async (staff) => {
    const nextActive = !staff.active;
    if (!window.confirm(`${nextActive ? 'Reactivate' : 'Deactivate'} staff member ${staff.name}?`)) return;
    try {
      await api.setStaffActive(staff.id, nextActive);
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to update staff status.');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Staff name is required.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@thapar.edu')) {
      setError('Staff email must be a valid @thapar.edu address.');
      return;
    }

    setSubmitting(true);
    try {
      await api.addStaff({
        name: name.trim(),
        email: cleanEmail,
        hostelId
      });
      alert(`Staff member ${name.trim()} added successfully!`);
      setShowModal(false);
      setName('');
      setEmail('');
      fetchStaff();
    } catch (err) {
      setError(err.message || 'Failed to add staff.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase tracking-wider">
              Staff Administration
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {staffList.length} Counter Personnel
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Hostel Counter Staff Directory
          </h2>
          <p className="text-xs text-slate-500">
            Assign staff to hostel intake desks, manage access credentials, and monitor counter assignments
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Staff ID</th>
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-4">College Email</th>
                <th className="py-3 px-4">Assigned Counter</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading staff list...
                  </td>
                </tr>
              ) : (
                staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {st.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {st.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {st.email}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Hostel {st.hostelId} Counter
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {st.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          st.active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {st.active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Add Counter Staff Member
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Authorize a new staff member to manage intake and pickup verification
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gurpreet Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  College Email (@thapar.edu)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. gurpreet.singh@thapar.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Assigned Hostel Counter
                </label>
                <select
                  value={hostelId}
                  onChange={(e) => setHostelId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(config?.hostels || []).map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Staff Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
