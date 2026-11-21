import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { getCounterStatus, STATUS_MAP, STEPS } from '../../constants/domain';
import {
  Shirt,
  Clock,
  Plus,
  QrCode,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Package,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PickupModal } from '../../components/PickupModal';

export function StudentDashboard({ onNavigate, onSelectBatch }) {
  const { user, config, refreshUser } = useAuth();
  const [activeBatch, setActiveBatch] = useState(null);
  const [pickupData, setPickupData] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);

  const studentHostel = config?.hostels?.find(
    (h) => h.id === user?.profile?.hostelId
  );
  const counter = getCounterStatus(studentHostel);
  const enrollmentStatus = user?.enrollment?.status;

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        const batches = await api.listBatches();
        // Find most recent active batch (not COLLECTED or CANCELLED)
        const current = batches.find(
          (b) => b.status !== 'COLLECTED' && b.status !== 'CANCELLED'
        );
        setActiveBatch(current || batches[0] || null);

        // If ready for pickup, fetch pickup code
        if (current && current.status === 'READY_FOR_PICKUP') {
          const p = await api.getPickup(current.rid);
          setPickupData(p);
        } else {
          setPickupData(null);
        }
      } catch (err) {
        console.error('Failed to load student batches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [user]);

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await api.renewEnrollment();
      await refreshUser();
      alert('Semester enrollment renewed successfully! You can now submit laundry.');
    } catch (err) {
      alert(err.message || 'Renewal failed.');
    } finally {
      setRenewing(false);
    }
  };

  const openPickup = async (batch) => {
    try {
      const p = await api.getPickup(batch.rid);
      setPickupData(p);
      setShowPickupModal(true);
    } catch (err) {
      alert(err.message || 'Unable to load pickup pass.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Pending Renewal Banner */}
      {enrollmentStatus === 'Pending renewal' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-900">
                Semester Renewal Required
              </div>
              <div className="text-xs text-amber-700">
                Confirm your hostel room for the current semester to unlock laundry drop-offs.
              </div>
            </div>
          </div>
          <button
            onClick={handleRenew}
            disabled={renewing}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition whitespace-nowrap"
          >
            {renewing ? 'Renewing...' : 'Renew Now'}
          </button>
        </div>
      )}

      {/* Profile Setup Warning */}
      {!user?.profile?.room && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-blue-900">
                Set Up Your Hostel Room
              </div>
              <div className="text-xs text-blue-700">
                Add your hostel and room number to submit laundry.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition whitespace-nowrap"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Counter Schedule Card */}
      <div
        className={`p-5 rounded-3xl border transition shadow-sm ${
          counter.open
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
            : counter.tone === 'amber'
            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
            : 'bg-slate-100 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-2xl ${
                counter.open
                  ? 'bg-emerald-600 text-white'
                  : counter.tone === 'amber'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-white'
              }`}
            >
              <Clock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    counter.open
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {counter.open ? 'Counter Open' : 'Counter Timings'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {studentHostel?.name || 'Your Hostel'}
                </span>
              </div>
              <h2 className="text-lg font-extrabold tracking-tight">
                {counter.title}
              </h2>
              <p className="text-xs opacity-80 mt-0.5 leading-relaxed">
                {counter.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('submit')}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Drop-off</span>
          </button>
        </div>
      </div>

      {/* Ready for Pickup Banner if applicable */}
      {activeBatch && activeBatch.status === 'READY_FOR_PICKUP' && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl shadow-teal-700/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                Action Required
              </div>
              <h3 className="text-lg font-bold">
                Batch {activeBatch.bid || activeBatch.rid} is Ready!
              </h3>
              <p className="text-xs text-teal-100">
                Your clothes are washed, packed, and waiting at the Hostel {activeBatch.hostelId} counter.
              </p>
            </div>
          </div>
          <button
            onClick={() => openPickup(activeBatch)}
            className="w-full sm:w-auto px-5 py-2.5 bg-white text-teal-800 font-extrabold text-xs rounded-2xl shadow-lg hover:bg-teal-50 transition flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Show Pickup QR & PIN</span>
          </button>
        </div>
      )}

      {/* Active Laundry Request Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-teal-600" />
            <h3 className="font-extrabold text-base text-slate-900">
              {activeBatch && activeBatch.status !== 'COLLECTED'
                ? 'Current Laundry Batch'
                : 'Recent Activity'}
            </h3>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading laundry status...
          </div>
        ) : !activeBatch ? (
          <div className="py-10 text-center text-slate-500">
            <Shirt className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-2" />
            <div className="font-bold text-slate-700 text-sm">
              No active laundry submissions
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Drop off your dirty clothes on scheduled counter days to get them professionally washed.
            </p>
            <button
              onClick={() => onNavigate('submit')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-teal-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Laundry</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Batch summary header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">
                    {activeBatch.bid || activeBatch.rid}
                  </span>
                  {activeBatch.bid && (
                    <span className="text-xs text-slate-400 font-mono">
                      ({activeBatch.rid})
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      STATUS_MAP[activeBatch.status]?.color || 'bg-slate-100'
                    }`}
                  >
                    {STATUS_MAP[activeBatch.status]?.studentLabel || activeBatch.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>
                    Submitted: {new Date(activeBatch.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {activeBatch.expectedOn && (
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      Expected: {activeBatch.expectedOn}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectBatch(activeBatch);
                    onNavigate('tracker');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>Detailed Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="my-6">
              <div className="relative flex items-center justify-between">
                {/* Connecting bar */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-200 z-0"></div>
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-500 z-0 transition-all duration-500"
                  style={{
                    width: `${
                      (Math.min(
                        STATUS_MAP[activeBatch.status]?.step || 0,
                        STEPS.length - 1
                      ) /
                        (STEPS.length - 1)) *
                      100
                    }%`
                  }}
                ></div>

                {/* Steps dots */}
                {STEPS.map((stepName, idx) => {
                  const currentStep = STATUS_MAP[activeBatch.status]?.step || 0;
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div
                      key={stepName}
                      className="relative z-10 flex flex-col items-center"
                    >
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

            {/* Garments Summary preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Verified Pieces
                </span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {Object.entries(activeBatch.items || {}).map(([cat, qty]) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                    >
                      {cat}: <strong className="text-teal-700">{qty}</strong>
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Total
                </span>
                <div className="text-xl font-black text-slate-900">
                  {Object.values(activeBatch.items || {}).reduce((s, n) => s + n, 0)}{' '}
                  <span className="text-xs font-normal text-slate-500">pcs</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('submit')}
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-teal-500 hover:shadow-md transition text-left group"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <Plus className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">
            Submit New Laundry
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Count and log garments before dropping off at the counter.
          </p>
        </button>

        <button
          onClick={() => onNavigate('complaints')}
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-md transition text-left group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">
            Complaints & Support
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Report missing clothes, damages, or wash quality issues.
          </p>
        </button>
      </div>

      {/* Pickup pass modal */}
      {showPickupModal && activeBatch && pickupData && (
        <PickupModal
          batch={activeBatch}
          pickup={pickupData}
          onClose={() => setShowPickupModal(false)}
        />
      )}
    </div>
  );
}
