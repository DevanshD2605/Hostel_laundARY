import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { STATUS_MAP } from '../../constants/domain';
import {
  Package,
  Search,
  Filter,
  Calendar,
  X,
  ChevronRight,
  ShieldAlert,
  Clock
} from 'lucide-react';

export function AdminBatches() {
  const { config } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hostelFilter, setHostelFilter] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await api.listBatches();
      setBatches(data);
    } catch (err) {
      console.error('Failed to load admin batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const filteredBatches = batches.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (hostelFilter !== 'ALL' && b.hostelId !== hostelFilter) return false;

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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold uppercase tracking-wider">
            Campus Master Batches
          </span>
          <span className="text-xs text-slate-500 font-bold">
            {batches.length} Total Registered
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Campus-wide Laundry Batches Directory
        </h2>
        <p className="text-xs text-slate-500">
          Inspect any batch across all 18 hostels, verification differences, conditions and complete timelines
        </p>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Batch ID, Request ID, Roll, or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Hostel Filter */}
          <select
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Hostels</option>
            {(config?.hostels || []).map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            {Object.keys(STATUS_MAP).map((st) => (
              <option key={st} value={st}>
                {STATUS_MAP[st]?.label || st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Batch / Request</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Hostel & Room</th>
                <th className="py-3 px-4">Pieces</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading campus batches...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching batches found.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const pcs = Object.values(b.items || {}).reduce((s, n) => s + n, 0);
                  const statusInfo = STATUS_MAP[b.status] || {};

                  return (
                    <tr key={b.rid} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div>{b.bid || b.rid}</div>
                        {b.bid && <div className="text-[10px] text-slate-400 font-normal">({b.rid})</div>}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div>{b.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">{b.studentId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-semibold text-slate-900">Hostel {b.hostelId}</span>
                        <span className="text-slate-400 block text-[11px]">Room {b.room || '–'}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-teal-700">
                        {pcs} pcs
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusInfo.color || 'bg-slate-100'
                          }`}
                        >
                          {statusInfo.label || b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(b.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedBatch(b)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Details Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedBatch(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedBatch.bid || selectedBatch.rid}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedBatch.studentName} ({selectedBatch.studentId}) · Hostel {selectedBatch.hostelId} Room {selectedBatch.room}
                </p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1 text-xs">
              {/* Garments breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-2">
                  Garments Breakdown
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedBatch.items || {}).map(([k, v]) => (
                    <div key={k} className="p-2 bg-white rounded-xl border border-slate-200 flex justify-between">
                      <span className="font-bold text-slate-800">{k}</span>
                      <span className="font-black text-teal-700">{v} pcs</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions if any */}
              {selectedBatch.conditions && selectedBatch.conditions.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Garment Defect Notations</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBatch.conditions.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold">
                        {c.c}: {c.k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Log */}
              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-2">
                  Full Transition Audit Log
                </span>
                <div className="space-y-2">
                  {(selectedBatch.log || []).map((l, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between text-[11px] font-bold text-slate-900 mb-0.5">
                        <span>{l.a}</span>
                        <span className="text-slate-400 font-normal">
                          {new Date(l.t).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        By {l.who} ({l.role}) {l.from ? `· From ${l.from} to ${l.to}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedBatch(null)}
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
