import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS_MAP } from '../../constants/domain';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  ArrowUpRight,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';

export function StaffComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState({});
  const [submittingNote, setSubmittingNote] = useState(null);

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
  }, [user]);

  const handleAddNote = async (id) => {
    const text = noteText[id]?.trim();
    if (!text) return;
    setSubmittingNote(id);
    try {
      await api.addComplaintNote(id, text);
      setNoteText((prev) => ({ ...prev, [id]: '' }));
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to add note.');
    } finally {
      setSubmittingNote(null);
    }
  };

  const handleAdvance = async (c) => {
    const note = prompt(`Enter resolution / advancement note for ${c.id}:`);
    if (note === null) return;
    try {
      await api.advanceComplaint(c.id, note);
      alert(`Complaint ${c.id} advanced!`);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to advance status.');
    }
  };

  const handleEscalate = async (c) => {
    if (!window.confirm(`Escalate complaint ${c.id} to central campus administration?`)) return;
    try {
      await api.escalateComplaint(c.id);
      alert(`Complaint ${c.id} escalated to Admin.`);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to escalate.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase tracking-wider">
            Hostel {user?.hostelId} Desk
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Hostel Complaints & Issue Investigation
        </h2>
        <p className="text-xs text-slate-500">
          Address reported student discrepancies, add investigation notes, or escalate difficult cases
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 mx-auto stroke-1 text-teal-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">No active complaints</p>
            <p className="text-xs text-slate-400 mt-1">All requests in Hostel {user?.hostelId} are clean.</p>
          </div>
        ) : (
          complaints.map((c) => {
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
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                        Escalated to Admin
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {c.status !== 'Closed' && (
                      <button
                        onClick={() => handleAdvance(c)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
                      >
                        Advance to {c.status === 'Open' ? 'Under review' : c.status === 'Under review' ? 'Investigating' : c.status === 'Investigating' ? 'Resolved' : 'Closed'}
                      </button>
                    )}

                    {!c.escalated && c.status !== 'Closed' && (
                      <button
                        onClick={() => handleEscalate(c)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Escalate</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <div className="flex items-center gap-3 mb-1 text-slate-500">
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
                    Staff & Admin Investigation Notes
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

                {/* Add new note input */}
                {c.status !== 'Closed' && (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add investigation update or counter note..."
                      value={noteText[c.id] || ''}
                      onChange={(e) => setNoteText({ ...noteText, [c.id]: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleAddNote(c.id)}
                      disabled={submittingNote === c.id || !noteText[c.id]?.trim()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingNote === c.id ? 'Adding...' : 'Add Note'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
