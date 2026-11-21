import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Plus, Minus, Shirt, ArrowLeft, Send, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export function SubmitRequest({ onBack, onSuccess }) {
  const { config, user } = useAuth();
  const [items, setItems] = useState({});
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = config?.categories?.filter(c => c.on) || [];

  const updateCount = (catName, delta) => {
    setItems(prev => {
      const current = prev[catName] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[catName];
        return copy;
      }
      return { ...prev, [catName]: next };
    });
  };

  const totalPieces = Object.values(items).reduce((s, n) => s + n, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (totalPieces === 0) {
      setError('Please add at least 1 clothing item.');
      return;
    }

    if (user?.enrollment?.status !== 'Active') {
      setError('Your semester enrollment is not Active. Please renew your profile first.');
      return;
    }

    setLoading(true);
    try {
      const newBatch = await api.submitRequest(items, remark);
      alert(`Success! Laundry request ${newBatch.rid} created. Please take your laundry bag to the Hostel ${user.profile?.hostelId} counter.`);
      onSuccess(newBatch);
    } catch (err) {
      setError(err.message || 'Failed to submit laundry request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Submit New Laundry
          </h2>
          <p className="text-xs text-slate-500">
            Select items to send for wash at Hostel {user?.profile?.hostelId} counter
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Categories selector */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Garment Categories
            </span>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl">
              Total: {totalPieces} {totalPieces === 1 ? 'piece' : 'pieces'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const qty = items[cat.name] || 0;
              return (
                <div
                  key={cat.name}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                    qty > 0
                      ? 'border-teal-500 bg-teal-50/30'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        qty > 0
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Shirt className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateCount(cat.name, -1)}
                      disabled={qty === 0}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900 font-mono">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCount(cat.name, 1)}
                      className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Remarks / Special care */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            Special Instructions / Remarks (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Please wash the white hoodie separately, existing stain on jacket collar..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>

        {/* Submission bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-200 shadow-lg">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Selected</div>
            <div className="text-lg font-black text-slate-900">
              {totalPieces} Pieces
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || totalPieces === 0}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-teal-600/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            <span>{loading ? 'Submitting...' : 'Submit Laundry'}</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
