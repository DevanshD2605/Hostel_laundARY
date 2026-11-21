import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Shield, Search, Filter, Clock, User } from 'lucide-react';

export function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const data = await api.listAudit({ search, role: roleFilter });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAudit();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold uppercase tracking-wider">
            Compliance & Security
          </span>
          <span className="text-xs text-slate-500 font-bold">
            {logs.length} Logged Events
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Campus Tamper-Evident Audit Trail
        </h2>
        <p className="text-xs text-slate-500">
          Immutable log of all batch intakes, count adjustments, pickup verifications, and policy updates
        </p>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by User, Batch ID, or Action keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          {['All', 'Student', 'Staff', 'Admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                roleFilter === r
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Action Details</th>
                <th className="py-3 px-4">State Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No matching audit records.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{log.who}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {log.batchId || '–'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      {log.from || log.to ? (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {log.from && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                              {log.from}
                            </span>
                          )}
                          {log.from && log.to && <span className="text-slate-400">→</span>}
                          {log.to && (
                            <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200">
                              {log.to}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
