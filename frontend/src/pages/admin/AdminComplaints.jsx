import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { COMPLAINT_STATUS_MAP, COMPLAINT_TYPES } from '../../constants/domain';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  CornerDownLeft,
  Shield,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';

export function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEscalated, setFilterEscalated] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [noteText, setNoteText] = useState({});

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.listComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleAddNote = async (id) => {
    const text = noteText[id]?.trim();
    if (!text) return;
    try {
      await api.addComplaintNote(id, text);
      setNoteText((prev) => ({ ...prev, [id]: '' }));
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to add note.');
    }
  };

  const handleAdvance = async (c) => {
    const note = prompt(`Enter resolution note to move ${c.id} forward:`);
    if (note === null) return;
    try {
      await api.advanceComplaint(c.id, note);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to advance complaint.');
    }
  };

  const handleSendBack = async (c) => {
    if (!window.confirm(`Send complaint ${c.id} back to counter staff for localized review?`)) return;
    try {
      await api.sendBackComplaint(c.id);
      alert(`Complaint ${c.id} sent back to staff.`);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to send back complaint.');
    }
  };

  const filtered = complaints.filter((c) => {
    if (filterEscalated && !c.escalated) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      const match = [c.id, c.batchId, c.studentName, c.studentId, c.description, c.hostelId]
        .some((str) => str.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold uppercase tracking-wider">
              Dispute Resolution
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {complaints.length} Total Registered
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Campus-wide Complaints & Dispute Desk
          </h2>
          <p className="text-xs text-slate-500">
            Review escalated student grievances, issue administrative directives, or close resolved issues
          </p>
        </div>

        <button
          onClick={() => setFilterEscalated(!filterEscalated)}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border ${
            filterEscalated
              ? 'bg-red-600 text-white border-red-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{filterEscalated ? 'Showing Escalated Only' : 'Filter Escalated to Admin'}</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Complaint ID, Batch, Student, Hostel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none"
        >
          <option value="ALL">All Complaint Statuses</option>
          {['Open', 'Under review', 'Investigating', 'Resolved', 'Closed'].map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Loading complaints...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 mx-auto stroke-1 text-teal-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">No matching complaints found</p>
          </div>
        ) : (
          filtered.map((c) => {
            const statusConfig = COMPLAINT_STATUS_MAP[c.status] || {};

            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-slate-900">
                      {c.id}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {c.type}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        statusConfig.color || 'bg-slate-100'
                      }`}
                    >
                      {c.status}
                    </span>
                    {c.escalated && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold animate-pulse">
                        Escalated to Admin
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {c.escalated && (
                      <button
                        onClick={() => handleSendBack(c)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span>Send Back to Staff</span>
                      </button>
                    )}

                    {c.status !== 'Closed' && (
                      <button
                        onClick={() => handleAdvance(c)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
                      >
                        Advance / Resolve
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-3 mb-1 text-slate-500">
                    <span>Hostel: <strong className="text-slate-800">Hostel {c.hostelId}</strong></span>
                    <span>·</span>
                    <span>Student: <strong className="text-slate-800">{c.studentName}</strong> ({c.studentId})</span>
                    <span>·</span>
                    <span>Batch: <strong className="text-slate-800">{c.batchId}</strong></span>
                    <span>·</span>
                    <span>Filed: {new Date(c.filedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800">
                    {c.description}
                  </div>
                </div>

                {/* Notes History */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Case Updates & Action Log
                  </span>
                  {(c.notes || []).map((n, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-800">
                          {n.who} ({n.role})
                        </span>
                        <span className="text-slate-400">
                          {new Date(n.t).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700">{n.a}</p>
                    </div>
                  ))}
                </div>

                {/* Add admin note */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add central administrative note..."
                    value={noteText[c.id] || ''}
                    onChange={(e) => setNoteText({ ...noteText, [c.id]: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => handleAddNote(c.id)}
                    disabled={!noteText[c.id]?.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Add Note</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
