import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { STATUS_MAP, STEPS } from '../../constants/domain';
import {
  ArrowLeft,
  QrCode,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  User,
  ShieldAlert
} from 'lucide-react';
import { PickupModal } from '../../components/PickupModal';

export function LaundryTracker({ batchId, onBack, onFileComplaint }) {
  const [batch, setBatch] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatch = async () => {
      setLoading(true);
      try {
        const b = await api.getBatch(batchId);
        setBatch(b);
        if (b.status === 'READY_FOR_PICKUP') {
          const p = await api.getPickup(b.rid);
          setPickup(p);
        }
      } catch (err) {
        console.error('Failed to load batch:', err);
      } finally {
        setLoading(false);
      }
    };
    if (batchId) fetchBatch();
  }, [batchId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Loading batch tracker details...
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="py-20 text-center text-slate-500">
        <p className="text-sm font-bold">Laundry batch not found.</p>
        <button
          onClick={onBack}
          className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentStep = STATUS_MAP[batch.status]?.step || 0;
  const verifiedPcs = Object.values(batch.items || {}).reduce((s, n) => s + n, 0);
  const originalPcs = Object.values(batch.original || {}).reduce((s, n) => s + n, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                {batch.bid || batch.rid}
              </h2>
              {batch.bid && (
                <span className="text-xs font-mono text-slate-400">
                  ({batch.rid})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Hostel {batch.hostelId} · Room {batch.room || '–'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {batch.status === 'READY_FOR_PICKUP' && (
            <button
              onClick={() => setShowPickupModal(true)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>Pickup Pass</span>
            </button>
          )}

          <button
            onClick={() => onFileComplaint(batch.bid || batch.rid)}
            className="px-3.5 py-2 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                STATUS_MAP[batch.status]?.dot || 'bg-slate-400'
              } animate-ping`}
            ></span>
            <span className="text-base font-extrabold text-slate-900">
              {STATUS_MAP[batch.status]?.studentLabel || batch.status}
            </span>
          </div>
          {batch.late && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200">
              Delayed Processing
            </span>
          )}
        </div>

        {/* Stepper */}
        <div className="my-6">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-200 z-0"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-500 z-0 transition-all duration-500"
              style={{
                width: `${
                  (Math.min(currentStep, STEPS.length - 1) / (STEPS.length - 1)) *
                  100
                }%`
              }}
            ></div>

            {STEPS.map((stepName, idx) => {
              const isDone = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={stepName} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                      isDone
                        ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                        : 'bg-white border-slate-300 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-teal-100 scale-110' : ''}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-bold hidden sm:block ${
                      isCurrent
                        ? 'text-teal-700'
                        : isDone
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {stepName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Submitted
            </span>
            <span className="font-semibold text-slate-700">
              {new Date(batch.submittedAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Expected Return
            </span>
            <span className="font-semibold text-slate-700">
              {batch.expectedOn || 'To be scheduled'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Counter
            </span>
            <span className="font-semibold text-slate-700">
              Hostel {batch.hostelId} Counter
            </span>
          </div>
        </div>
      </div>

      {/* Items Breakdown: Verified vs Original */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900">
            Garments Count Breakdown
          </h3>
          <span className="text-xs font-bold text-slate-500">
            Total Verified: <strong className="text-teal-700">{verifiedPcs} pcs</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2">Category</th>
                <th className="py-2 text-center">Your Count</th>
                <th className="py-2 text-center">Counter Verified</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {Object.keys({ ...batch.original, ...batch.items }).map((cat) => {
                const orig = batch.original?.[cat] || 0;
                const ver = batch.items?.[cat] || 0;
                const diff = ver - orig;

                return (
                  <tr key={cat} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-bold text-slate-800">{cat}</td>
                    <td className="py-2.5 text-center text-slate-500">{orig}</td>
                    <td className="py-2.5 text-center font-bold text-slate-900">
                      {ver}
                    </td>
                    <td className="py-2.5 text-right">
                      {diff === 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          Matched
                        </span>
                      ) : diff > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          +{diff} extra
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {diff} adjusted
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Condition tags if noted */}
        {batch.conditions && batch.conditions.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Garment Defects Noted at Counter Verification</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {batch.conditions.map((cd, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-white border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold"
                >
                  {cd.c}: {cd.k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Student instructions remark */}
        {batch.remark && (
          <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl">
            <span className="font-bold text-slate-700">Instructions: </span>
            {batch.remark}
          </div>
        )}
      </div>

      {/* Activity Timeline Log */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-extrabold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Tracking Log
        </h3>
        <div className="space-y-4">
          {(batch.log || []).map((entry, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">{entry.a}</span>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(entry.t).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  By {entry.who} ({entry.role || 'staff'})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pickup pass modal */}
      {showPickupModal && pickup && (
        <PickupModal
          batch={batch}
          pickup={pickup}
          onClose={() => setShowPickupModal(false)}
        />
      )}
    </div>
  );
}
