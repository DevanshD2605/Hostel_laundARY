import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Users,
  Package,
  Clock,
  AlertTriangle,
  Building,
  CheckCircle2,
  TrendingUp,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

export function AdminDashboard({ onNavigate }) {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const data = await api.getReports();
        setReports(data);
      } catch (err) {
        console.error('Failed to load admin reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Loading campus laundry analytics...
      </div>
    );
  }

  const {
    totalStudents,
    activeStudents,
    totalBatches,
    avgTatDays,
    statusCounts,
    volumeByHostel,
    complaintStats
  } = reports || {};

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold uppercase tracking-wider">
              Central Administration
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Campus Laundry Management System
          </h2>
          <p className="text-xs text-slate-500">
            Overview of 500 enrolled students, 18 hostel counters, wash throughput, and SLA compliance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('students')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-teal-400" />
            <span>Manage 500 Students</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Enrolled Students
            </span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalStudents || 500}
          </div>
          <div className="text-[11px] text-teal-700 font-semibold mt-1">
            {activeStudents || 495} Active This Semester
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Batches
            </span>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalBatches || 0}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold mt-1">
            {statusCounts?.COLLECTED || 0} Handed Over
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Average Turnaround
            </span>
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {avgTatDays || '3.2'} <span className="text-sm font-normal text-slate-500">days</span>
          </div>
          <div className="text-[11px] text-purple-700 font-semibold mt-1">
            Standard SLA: 3-4 days
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Open Complaints
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {complaintStats?.open || 0}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {complaintStats?.escalated || 0} Escalated to Admin
          </div>
        </div>
      </div>

      {/* Wash Status Distribution */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Active Campus Wash Pipeline Status</span>
          <button
            onClick={() => onNavigate('batches')}
            className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
          >
            <span>View All Batches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Waiting Verify', count: statusCounts?.WAITING_FOR_VERIFICATION || 0, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'To Tag', count: statusCounts?.AWAITING_TAGGING || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'Tagged', count: statusCounts?.TAGGED || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'In Wash', count: statusCounts?.IN_LAUNDRY || 0, color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { label: 'Returned', count: statusCounts?.RETURNED || 0, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            { label: 'Ready Pickup', count: statusCounts?.READY_FOR_PICKUP || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'Collected', count: statusCounts?.COLLECTED || 0, color: 'bg-slate-100 text-slate-700 border-slate-200' }
          ].map((item) => (
            <div
              key={item.label}
              className={`p-3.5 rounded-2xl border ${item.color} text-center`}
            >
              <div className="text-xl font-black">{item.count}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume by Hostel Activity */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Hostel Counters Activity & Volume Breakdown</span>
          <span className="text-xs text-slate-400 font-normal">18 Campus Hostels</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(volumeByHostel || {}).map(([id, info]) => (
            <div
              key={id}
              className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-800">{info.name}</span>
                <span className="text-[10px] text-slate-400 block">
                  Counter ID: {id}
                </span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-slate-900 text-sm">
                  {info.batches} batches
                </span>
                <span className="text-[11px] text-teal-700 font-semibold block">
                  {info.pieces} garments
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
