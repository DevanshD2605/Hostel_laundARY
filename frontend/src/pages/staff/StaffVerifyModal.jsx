import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { X, Check, AlertTriangle, Plus, Minus, Tag, ShieldCheck } from 'lucide-react';

export function StaffVerifyModal({ batch, onClose, onSuccess }) {
  const { config } = useAuth();
  const [items, setItems] = useState({ ...batch.items });
  const [conditions, setConditions] = useState(batch.conditions || []);
  const [remark, setRemark] = useState(batch.remark || '');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const conditionOptions = config?.conditions || ['Small tear', 'Faded color', 'Stain', 'Missing button', 'Other damage'];

  const updateItem = (cat, delta) => {
    setItems((prev) => {
      const current = prev[cat] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[cat];
        return copy;
      }
      return { ...prev, [cat]: next };
    });
  };

  const toggleCondition = (cat, condKey) => {
    setConditions((prev) => {
      const exists = prev.some((c) => c.c === cat && c.k === condKey);
      if (exists) {
        return prev.filter((c) => !(c.c === cat && c.k === condKey));
      }
      return [...prev, { c: cat, k: condKey }];
    });
  };

  const handleVerify = async () => {
    const totalPcs = Object.values(items).reduce((s, n) => s + n, 0);
    if (totalPcs === 0) {
      alert('You must approve at least 1 item or reject the request.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api.verifyRequest(batch.rid, {
        items,
        conditions,
        remark
      });
      alert(`Request ${batch.rid} verified successfully! Ready for physical tagging.`);
      onSuccess(updated);
    } catch (err) {
      alert(err.message || 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejecting this laundry submission.');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await api.rejectRequest(batch.rid, rejectReason.trim());
      alert(`Request ${batch.rid} rejected.`);
      onSuccess(updated);
    } catch (err) {
      alert(err.message || 'Failed to reject request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Verify Physical Laundry Count
            </h3>
            <p className="text-xs text-slate-500">
              Request {batch.rid} · {batch.studentName} ({batch.studentId}) · Room {batch.room}
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 my-4 space-y-4 pr-1">
          {/* Garment count adjustment */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3">
              <span>Student Submitted Count</span>
              <span className="text-teal-700 font-extrabold">
                Verified: {Object.values(items).reduce((s, n) => s + n, 0)} pcs
              </span>
            </div>

            <div className="space-y-2">
              {Object.keys({ ...batch.original, ...items }).map((cat) => {
                const orig = batch.original?.[cat] || 0;
                const cur = items[cat] || 0;
                const isDifferent = cur !== orig;

                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{cat}</div>
                      <div className="text-[10px] text-slate-400">
                        Student entered: {orig} pcs
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDifferent && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          Modified
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateItem(cat, -1)}
                          disabled={cur === 0}
                          className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-slate-900 font-mono">
                          {cur}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItem(cat, 1)}
                          className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Garment Condition Defect Tagging */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Note Pre-existing Garment Defects (For Auditing & Disputes)
            </span>
            <div className="space-y-2">
              {Object.keys(items).map((cat) => (
                <div key={cat} className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 text-xs block mb-1.5">
                    {cat}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {conditionOptions.map((cond) => {
                      const isChecked = conditions.some((c) => c.c === cat && c.k === cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => toggleCondition(cat, cond)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                            isChecked
                              ? 'bg-amber-100 border-amber-300 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isChecked ? '✓ ' : ''}{cond}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Counter Staff Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Verified physically by counter staff..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reject Option toggle */}
          {isRejecting ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-red-800">
                Reason for Rejection
              </label>
              <input
                type="text"
                placeholder="e.g. Unwashed heavily soiled items, non-accepted footwear..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 bg-white border border-red-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={submitting}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Reject this laundry request
              </button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={submitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            {submitting ? 'Verifying...' : 'Approve & Send to Tagging'}
          </button>
        </div>
      </div>
    </div>
  );
}
