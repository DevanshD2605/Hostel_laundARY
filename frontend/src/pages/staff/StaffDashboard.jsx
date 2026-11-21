import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { STATUS_MAP } from '../../constants/domain';
import {
  Package,
  Search,
  Filter,
  ShieldCheck,
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
  Bell,
  CheckCircle2,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { StaffVerifyModal } from './StaffVerifyModal';

export function StaffDashboard({ onNavigateToPickup }) {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState('WAITING_FOR_VERIFICATION');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifyingBatch, setVerifyingBatch] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await api.listBatches();
      setBatches(data);
    } catch (err) {
      console.error('Failed to load staff batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [user]);

  // Transitions
  const handleGenerateAndTag = async (batch) => {
    setActionLoading(batch.rid);
    try {
      if (!batch.bid) {
        await api.generateBatchId(batch.rid);
      }
      await api.transition([batch.rid], 'TAGGED');
      alert(`Tag applied to ${batch.bid || batch.rid}! Ready for laundry wash.`);
      fetchBatches();
    } catch (err) {
      alert(err.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendToLaundry = async (batch) => {
    setActionLoading(batch.rid);
    try {
      await api.transition([batch.rid], 'IN_LAUNDRY');
      fetchBatches();
    } catch (err) {
      alert(err.message || 'Failed to send to wash.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReturned = async (batch) => {
    setActionLoading(batch.rid);
    try {
      await api.transition([batch.rid], 'RETURNED');
      fetchBatches();
    } catch (err) {
      alert(err.message || 'Failed to mark returned.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReadyForPickup = async (batch) => {
    setActionLoading(batch.rid);
    try {
      await api.transition([batch.rid], 'READY_FOR_PICKUP');
      alert(`Batch ${batch.bid || batch.rid} is now marked Ready for Pickup! QR pass activated for student.`);
      fetchBatches();
    } catch (err) {
      alert(err.message || 'Failed to activate pickup.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendDelay = async (batch) => {
    if (!window.confirm(`Send delay alert notification to ${batch.studentName}?`)) return;
    setActionLoading(batch.rid);
    try {
      await api.sendDelayNotice(batch.rid);
      alert(`Delay notice sent to ${batch.studentName}.`);
      fetchBatches();
    } catch (err) {
      alert(err.message || 'Failed to send delay notice.');
    } finally {
      setActionLoading(null);
    }
  };

  // Queue counts
  const countOf = (status) => batches.filter((b) => b.status === status).length;

  const queues = [
    { id: 'WAITING_FOR_VERIFICATION', label: 'To Verify', count: countOf('WAITING_FOR_VERIFICATION') },
    { id: 'AWAITING_TAGGING', label: 'To Tag', count: countOf('AWAITING_TAGGING') },
    { id: 'IN_LAUNDRY', label: 'In Wash', count: countOf('IN_LAUNDRY') + countOf('TAGGED') },
    { id: 'RETURNED', label: 'Returned', count: countOf('RETURNED') },
    { id: 'READY_FOR_PICKUP', label: 'Ready for Pickup', count: countOf('READY_FOR_PICKUP') },
    { id: 'ALL', label: 'All', count: batches.length }
  ];

  const filteredBatches = batches.filter((b) => {
    if (selectedQueue !== 'ALL') {
      if (selectedQueue === 'IN_LAUNDRY') {
        if (b.status !== 'IN_LAUNDRY' && b.status !== 'TAGGED') return false;
      } else if (b.status !== selectedQueue) {
        return false;
      }
    }

    if (search) {
      const q = search.toLowerCase();
      const match = [b.rid, b.bid || '', b.studentId, b.studentName, b.room || '']
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
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase tracking-wider">
              Hostel {user?.hostelId} Counter Dashboard
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Laundry Intake & Dispatch Queues
          </h2>
          <p className="text-xs text-slate-500">
            Verify drop-offs, apply tags, track wash progress, and activate pickup passes
          </p>
        </div>

        <button
          onClick={onNavigateToPickup}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
        >
          <QrCode className="w-4 h-4 text-teal-400" />
          <span>Scan Student Pickup Pass</span>
        </button>
      </div>

      {/* Queue Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {queues.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelectedQueue(q.id)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
              selectedQueue === q.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{q.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                selectedQueue === q.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {q.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Request ID, Batch ID, Roll Number (24COE...), or Student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Batches Table / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Loading counter queue...
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 mx-auto stroke-1 text-teal-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">Queue is clear</p>
            <p className="text-xs text-slate-400 mt-1">No batches waiting in this category.</p>
          </div>
        ) : (
          filteredBatches.map((b) => {
            const pcs = Object.values(b.items || {}).reduce((s, n) => s + n, 0);
            const statusConfig = STATUS_MAP[b.status] || {};
            const isProcessing = actionLoading === b.rid;

            return (
              <div
                key={b.rid}
                className="p-5 bg-white rounded-3xl border border-slate-200 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <Package className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {b.bid || b.rid}
                      </span>
                      {b.bid && (
                        <span className="text-xs text-slate-400 font-mono">
                          ({b.rid})
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          statusConfig.color || 'bg-slate-100'
                        }`}
                      >
                        {statusConfig.label || b.status}
                      </span>
                      {b.late && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Delayed
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                      <span className="font-bold text-slate-800">
                        {b.studentName}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-slate-500">{b.studentId}</span>
                      <span>·</span>
                      <span>Room {b.room || '–'}</span>
                      <span>·</span>
                      <span className="font-bold text-teal-700">{pcs} pieces</span>
                    </div>

                    {/* Pieces tag pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(b.items || {}).map(([k, v]) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 font-medium"
                        >
                          {k}: <strong>{v}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Queue Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  {b.status === 'WAITING_FOR_VERIFICATION' && (
                    <button
                      onClick={() => setVerifyingBatch(b)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Request</span>
                    </button>
                  )}

                  {b.status === 'AWAITING_TAGGING' && (
                    <button
                      onClick={() => handleGenerateAndTag(b)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                    >
                      <Tag className="w-4 h-4" />
                      <span>{isProcessing ? 'Tagging...' : 'Apply Tag & ID'}</span>
                    </button>
                  )}

                  {b.status === 'TAGGED' && (
                    <button
                      onClick={() => handleSendToLaundry(b)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                    >
                      <Package className="w-4 h-4" />
                      <span>Send to Wash</span>
                    </button>
                  )}

                  {b.status === 'IN_LAUNDRY' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendDelay(b)}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Send delay notification to student"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-600" />
                        <span>Delay Notice</span>
                      </button>
                      <button
                        onClick={() => handleMarkReturned(b)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                      >
                        Mark Returned
                      </button>
                    </div>
                  )}

                  {b.status === 'RETURNED' && (
                    <button
                      onClick={() => handleMarkReadyForPickup(b)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Activate Pickup QR</span>
                    </button>
                  )}

                  {b.status === 'READY_FOR_PICKUP' && (
                    <button
                      onClick={onNavigateToPickup}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Pickup</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Verify Modal */}
      {verifyingBatch && (
        <StaffVerifyModal
          batch={verifyingBatch}
          onClose={() => setVerifyingBatch(null)}
          onSuccess={() => {
            setVerifyingBatch(null);
            fetchBatches();
          }}
        />
      )}
    </div>
  );
}
