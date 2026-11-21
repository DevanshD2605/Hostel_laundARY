import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BarChart3, TrendingUp, Clock, AlertTriangle, ShieldCheck, Layers } from 'lucide-react';

export function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const data = await api.getReports();
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Generating reports...
      </div>
    );
  }

  const {
    totalStudents,
    totalBatches,
    avgTatDays,
    statusCounts,
    volumeByHostel,
    categoryPieces,
    complaintStats
  } = reports || {};

  const maxHostelBatches = Math.max(
    ...Object.values(volumeByHostel || {}).map((h) => h.batches),
    1
  );

  const maxCategoryPieces = Math.max(
    ...Object.values(categoryPieces || {}),
    1
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold uppercase tracking-wider">
            Executive Analytics
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Campus Laundry Performance & Operations Report
        </h2>
        <p className="text-xs text-slate-500">
          Garment load distribution, hostel utilization, SLA turnaround times, and incident resolution ratios
        </p>
      </div>

      {/* Top 3 High Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold uppercase">Average Turnaround Time</span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {avgTatDays} <span className="text-sm font-semibold text-slate-500">days</span>
          </div>
          <p className="text-xs text-purple-700 mt-1 font-semibold">
            Within the 4-day Thapar University laundry service charter.
          </p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase">Complaint Resolution Rate</span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {complaintStats?.total
              ? Math.round((complaintStats.resolved / complaintStats.total) * 100)
              : 100}%
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-semibold">
            {complaintStats?.resolved || 0} resolved of {complaintStats?.total || 0} complaints.
          </p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold uppercase">Total Garments Processed</span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {Object.values(categoryPieces || {}).reduce((s, n) => s + n, 0)} <span className="text-sm font-semibold text-slate-500">pcs</span>
          </div>
          <p className="text-xs text-teal-700 mt-1 font-semibold">
            Across {totalBatches} laundry batches.
          </p>
        </div>
      </div>

      {/* Garments Volume Distribution */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Garment Category Piece Counts
        </h3>
        <div className="space-y-3">
          {Object.entries(categoryPieces || {}).map(([cat, pcs]) => {
            const pct = Math.round((pcs / maxCategoryPieces) * 100);
            return (
              <div key={cat} className="space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-800">{cat}</span>
                  <span className="text-slate-600 font-mono">{pcs} pcs</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hostel Volume Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Campus Hostels Intake & Output
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(volumeByHostel || {}).map(([id, info]) => {
            const pct = Math.round((info.batches / maxHostelBatches) * 100);
            return (
              <div key={id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-900">{info.name}</span>
                  <span className="text-teal-700 font-mono">{info.batches} batches · {info.pieces} pcs</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
