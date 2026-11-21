import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Home,
  Phone,
  Mail,
  Check,
  X,
  Package,
  ArrowRightLeft,
  UserX,
  UserCheck
} from 'lucide-react';

export function AdminStudents() {
  const { config } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedHostel, setSelectedHostel] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Selected student for detail/action modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [newHostel, setNewHostel] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.listStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openStudentModal = async (student) => {
    setSelectedStudent(student);
    setNewHostel(student.enrollments?.[student.enrollments.length - 1]?.hostelId || 'O');
    setModalLoading(true);
    try {
      const details = await api.getStudent(student.id);
      setStudentDetails(details);
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleChangeHostel = async () => {
    if (!selectedStudent || !newHostel) return;
    setActionLoading(true);
    try {
      await api.changeHostel(selectedStudent.id, newHostel);
      alert(`Hostel updated for ${selectedStudent.id}!`);
      fetchStudents();
      openStudentModal({ ...selectedStudent });
    } catch (err) {
      alert(err.message || 'Failed to change hostel.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (student) => {
    const nextActive = !student.active;
    const confirmMsg = nextActive
      ? `Reactivate student ${student.id} (${student.name})?`
      : `Deactivate student ${student.id} (${student.name})? This will end active enrollments.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.setStudentActive(student.id, nextActive);
      alert(`Student ${student.id} status updated.`);
      fetchStudents();
      if (selectedStudent?.id === student.id) {
        setSelectedStudent({ ...selectedStudent, active: nextActive });
      }
    } catch (err) {
      alert(err.message || 'Failed to update active state.');
    }
  };

  // Filter students
  const filtered = students.filter((s) => {
    if (statusFilter === 'ACTIVE' && !s.active) return false;
    if (statusFilter === 'INACTIVE' && s.active) return false;

    const curHostel = s.enrollments?.[s.enrollments.length - 1]?.hostelId;
    if (selectedHostel !== 'ALL' && curHostel !== selectedHostel) return false;

    if (search) {
      const q = search.toLowerCase();
      const match = [s.id, s.name, s.email, s.phone, s.room || '', curHostel || '']
        .some((str) => str.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filtered.length / limit) || 1;
  const paginatedStudents = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-extrabold uppercase tracking-wider">
              Student Directory
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {students.length} Total Users Seeded
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            500 Campus Students Management
          </h2>
          <p className="text-xs text-slate-500">
            Search, inspect room assignments, manage hostel transfers, and toggle student enrollments
          </p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Roll (e.g. 24COE123), Name, Room..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Hostel Filter */}
          <select
            value={selectedHostel}
            onChange={(e) => {
              setSelectedHostel(e.target.value);
              setPage(1);
            }}
            className="p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Hostels ({config?.hostels?.length || 18})</option>
            {(config?.hostels || []).map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Hostel & Room</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading 500 dummy students...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching students found.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => {
                  const curEnr = s.enrollments?.[s.enrollments.length - 1];

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div>{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{s.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-semibold text-slate-900">
                          Hostel {curEnr?.hostelId || s.gender}
                        </span>
                        <span className="text-slate-400 block text-[11px]">
                          Room {s.room || '–'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {s.phone}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {s.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openStudentModal(s)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleToggleActive(s)}
                            className={`p-1 rounded-lg transition ${
                              s.active
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={s.active ? 'Deactivate Student' : 'Reactivate Student'}
                          >
                            {s.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filtered.length)} of {filtered.length} students
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Student Details & Action Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                {selectedStudent.id.slice(-3)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedStudent.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedStudent.id} · {selectedStudent.email}
                </p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1 text-xs">
              {/* Profile summary */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                  <span className="font-bold text-slate-800">{selectedStudent.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Room</span>
                  <span className="font-bold text-slate-800">Room {selectedStudent.room || '–'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender Group</span>
                  <span className="font-bold text-slate-800">{selectedStudent.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Account State</span>
                  <span className={`font-bold ${selectedStudent.active ? 'text-emerald-700' : 'text-red-700'}`}>
                    {selectedStudent.active ? 'Active' : 'Deactivated'}
                  </span>
                </div>
              </div>

              {/* Transfer Hostel Section */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-2">
                <span className="font-bold text-teal-900 block text-xs">
                  Re-assign / Transfer Hostel
                </span>
                <p className="text-teal-700 text-[11px]">
                  Transfers the student to another hostel counter. All past laundry history is preserved.
                </p>
                <div className="flex gap-2 pt-1">
                  <select
                    value={newHostel}
                    onChange={(e) => setNewHostel(e.target.value)}
                    className="flex-1 p-2 bg-white border border-teal-300 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    {(config?.hostels || []).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.group})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleChangeHostel}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Transfer'}
                  </button>
                </div>
              </div>

              {/* Semester Enrollments history */}
              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-1.5">
                  Semester Enrollment History
                </span>
                <div className="space-y-1.5">
                  {(selectedStudent.enrollments || []).map((e, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-800">
                        {e.semesterId}
                      </span>
                      <span className="text-slate-500">
                        Hostel {e.hostelId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Laundry batches */}
              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-1.5">
                  Associated Laundry Batches
                </span>
                {modalLoading ? (
                  <div className="py-4 text-center text-slate-400">Loading history...</div>
                ) : (!studentDetails?.batches || studentDetails.batches.length === 0) ? (
                  <p className="text-slate-400 italic">No laundry batches on record for this student.</p>
                ) : (
                  <div className="space-y-1.5">
                    {studentDetails.batches.map((b) => (
                      <div
                        key={b.rid}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <span className="font-bold font-mono text-slate-900">
                          {b.bid || b.rid}
                        </span>
                        <span className="text-slate-500">
                          {Object.values(b.items || {}).reduce((s, n) => s + n, 0)} pcs
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
