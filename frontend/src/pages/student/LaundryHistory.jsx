import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { STATUS_MAP } from '../../constants/domain';
import { Search, Package, ChevronRight, QrCode, Filter, Calendar } from 'lucide-react';
import { PickupModal } from '../../components/PickupModal';

export function LaundryHistory({ onSelectBatch }) {
  const [batches, setBatches] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [pickupModalBatch, setPickupModalBatch] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await api.listBatches();
        setBatches(data);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleOpenPickup = async (e, batch) => {
    e.stopPropagation();
    try {
      const p = await api.getPickup(batch.rid);
      setSelectedPickup(p);
      setPickupModalBatch(batch);
    } catch (err) {
      alert(err.message || 'Unable to load pickup pass.');
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (filter === 'ACTIVE') {
      if (b.status === 'COLLECTED' || b.status === 'CANCELLED') return false;
    } else if (filter === 'READY') {
      if (b.status !== 'READY_FOR_PICKUP') return false;
    } else if (filter === 'COLLECTED') {
      if (b.status !== 'COLLECTED') return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const match = [b.rid, b.bid || '', b.status]
        .some((str) => str.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Laundry History & Requests
        </h2>
        <p className="text-xs text-slate-500">
          All past and active laundry batches submitted under your account
        </p>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
          {['ALL', 'ACTIVE', 'READY', 'COLLECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filter === f
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f === 'ALL'
                ? 'All Batches'
                : f === 'ACTIVE'
                ? 'In Progress'
                : f === 'READY'
                ? 'Ready for Pickup'
                : 'Collected'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID (e.g. L-1002)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>
      </div>

      {/* Batches List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Loading laundry history...
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <Package className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-40" />
            <p className="text-sm font-bold text-slate-700">No requests found</p>
            <p className="text-xs text-slate-400 mt-1">Try another filter or search keyword.</p>
          </div>
        ) : (
          filteredBatches.map((b) => {
            const pcs = Object.values(b.items || {}).reduce((s, n) => s + n, 0);
            const statusInfo = STATUS_MAP[b.status] || {};

            return (
              <div
                key={b.rid}
                onClick={() => onSelectBatch(b)}
                className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 hover:border-teal-500 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition">
                    <Package className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {b.bid || b.rid}
                      </span>
                      {b.bid && (
                        <span className="text-xs text-slate-400 font-mono">
                          ({b.rid})
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          statusInfo.color || 'bg-slate-100'
                        }`}
                      >
                        {statusInfo.studentLabel || b.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{pcs} pieces</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(b.submittedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {b.expectedOn && (
                        <>
                          <span>·</span>
                          <span>Expected: {b.expectedOn}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  {b.status === 'READY_FOR_PICKUP' && (
                    <button
                      onClick={(e) => handleOpenPickup(e, b)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pickup QR</span>
                    </button>
                  )}
                  <div className="p-2 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pickup pass modal */}
      {selectedPickup && pickupModalBatch && (
        <PickupModal
          batch={pickupModalBatch}
          pickup={selectedPickup}
          onClose={() => {
            setSelectedPickup(null);
            setPickupModalBatch(null);
          }}
        />
      )}
    </div>
  );
}
