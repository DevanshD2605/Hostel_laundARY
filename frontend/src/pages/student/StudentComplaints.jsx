import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { COMPLAINT_STATUS_MAP, COMPLAINT_TYPES } from '../../constants/domain';
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

export function StudentComplaints({ initialBatchId }) {
  const [complaints, setComplaints] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(!!initialBatchId);
  const [expandedId, setExpandedId] = useState(null);

  // Form states
  const [selectedBatch, setSelectedBatch] = useState(initialBatchId || '');
  const [type, setType] = useState('Missing');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const [cList, bList] = await Promise.all([
        api.listComplaints(),
        api.listBatches()
      ]);
      setComplaints(cList);
      setBatches(bList);
      if (!selectedBatch && bList.length > 0) {
        setSelectedBatch(bList[0].bid || bList[0].rid);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Please provide a description of the issue.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createComplaint({
        batchId: selectedBatch,
        type,
        description: description.trim()
      });
      alert('Complaint submitted successfully. Counter staff has been notified.');
      setShowModal(false);
      setDescription('');
      fetchComplaints();
    } catch (err) {
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Complaints & Support Desk
          </h2>
          <p className="text-xs text-slate-500">
            Track missing items, wash damages, or report counter service delays
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Complaint</span>
        </button>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Loading complaints history...
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 mx-auto stroke-1 text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">No active complaints</p>
            <p className="text-xs text-slate-400 mt-1">
              All your laundry submissions have been processed cleanly.
            </p>
          </div>
        ) : (
          complaints.map((c) => {
            const isExpanded = expandedId === c.id;
            const statusConfig = COMPLAINT_STATUS_MAP[c.status] || {};

            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
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

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>Batch: <strong className="text-slate-700">{c.batchId}</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(c.filedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {c.notes?.length || 0} updates
                    </span>
                    <button className="p-1 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded details & notes */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
                    <div>
                      <span className="font-bold uppercase text-[10px] text-slate-400 block mb-1">
                        Reported Issue Description
                      </span>
                      <p className="text-slate-800 bg-white p-3 rounded-2xl border border-slate-200">
                        {c.description}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold uppercase text-[10px] text-slate-400 block mb-2">
                        Investigation Updates & Notes
                      </span>
                      {(!c.notes || c.notes.length === 0) ? (
                        <p className="text-slate-400 italic">
                          No staff investigation notes recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {c.notes.map((n, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-white rounded-2xl border border-slate-200"
                            >
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-bold text-slate-900">
                                  {n.who} ({n.role})
                                </span>
                                <span className="text-slate-400">
                                  {new Date(n.t).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-700">{n.a}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* File Complaint Modal */}
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
              File a Laundry Complaint
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Report issues directly to your hostel laundry supervisor
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Select Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {batches.map((b) => (
                    <option key={b.rid} value={b.bid || b.rid}>
                      {b.bid || b.rid} ({new Date(b.submittedAt).toLocaleDateString()}) - {b.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Issue Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {COMPLAINT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe garment color, brand, specific defect or what was missing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-amber-600/20 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Register Complaint'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
