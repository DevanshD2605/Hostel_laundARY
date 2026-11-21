import React, { useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Search, CheckCircle2, AlertTriangle, User, Home, Package, Check, ArrowRight, ShieldCheck } from 'lucide-react';

export function StaffScanPickup() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    setResult(null);

    try {
      const data = await api.lookupPickup(code.trim());
      if (data.kind === 'invalid') {
        setErrorMsg('Invalid QR or PIN. No matching ready batch found for this counter.');
      } else {
        setResult(data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCollection = async () => {
    if (!result?.batch) return;
    setConfirming(true);
    setErrorMsg('');

    try {
      const updated = await api.confirmCollection(result.batch.rid);
      setSuccessMsg(`Collection Confirmed! Batch ${updated.bid || updated.rid} successfully collected by ${updated.studentName}.`);
      setResult(null);
      setCode('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to confirm collection.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase tracking-wider">
            Hostel {user?.hostelId} Counter
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Student Pickup Pass Verification
        </h2>
        <p className="text-xs text-slate-500">
          Scan the student's pickup QR pass or type the 6-digit verification PIN
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center gap-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl flex items-center gap-3 text-xs font-bold text-red-700">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Code input form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              Enter 6-Digit PIN or Paste QR Code Text
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <QrCode className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 482915 or hlp:..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base tracking-widest font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Checking...' : 'Verify'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Lookup Result Card */}
      {result && result.batch && (
        <div className="bg-white rounded-3xl border-2 border-slate-900 p-6 shadow-xl animate-fadeIn space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="font-extrabold text-sm text-slate-900">
                Verified Match Found
              </span>
            </div>
            {result.kind === 'used' ? (
              <span className="px-3 py-1 bg-red-100 text-red-800 font-bold text-xs rounded-full">
                ALREADY COLLECTED
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                READY FOR HANDOVER
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Student Name
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {result.batch.studentName}
              </span>
              <span className="text-[11px] text-slate-500 block font-mono">
                {result.batch.studentId}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Room & Hostel
              </span>
              <span className="font-bold text-slate-900 text-sm">
                Room {result.batch.room || '–'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Hostel {result.batch.hostelId}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Physical Batch ID
              </span>
              <span className="font-black text-slate-900 text-base">
                {result.batch.bid || result.batch.rid}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Garments
              </span>
              <span className="font-black text-slate-900 text-base">
                {Object.values(result.batch.items || {}).reduce((s, n) => s + n, 0)} pcs
              </span>
            </div>
          </div>

          {/* Garments breakdown */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-600 block mb-1">
              Garments in this package:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(result.batch.items || {}).map(([k, v]) => (
                <span
                  key={k}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
                >
                  {k}: <strong className="text-teal-700">{v}</strong>
                </span>
              ))}
            </div>
          </div>

          {result.kind === 'used' ? (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800">
              <strong>Caution:</strong> This laundry batch was already marked as collected. Do not issue items a second time.
            </div>
          ) : (
            <button
              onClick={handleConfirmCollection}
              disabled={confirming}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>{confirming ? 'Confirming...' : 'Confirm Handover to Student'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
