import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Users, User, Shield, Briefcase, Search, RefreshCw, X, ChevronRight, Check } from 'lucide-react';

export function QuickRoleSwitcher() {
  const { user, quickSwitchUser, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchSampleStudents = async () => {
    setLoadingStudents(true);
    try {
      // Fetch list of students from public demo endpoint
      const res = await api.getDemoUsers();
      setStudents(res.sampleStudents || []);
    } catch (err) {
      console.error('Error fetching sample users:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSampleStudents();
    }
  }, [isOpen]);

  const handleSwitch = async (email) => {
    try {
      await quickSwitchUser(email);
      setIsOpen(false);
      setFeedback(`Switched to ${email}`);
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset the database to initial 500 dummy students state? All new modifications will reset.')) return;
    setResetting(true);
    try {
      await api.resetDemo();
      await refreshUser();
      alert('Database successfully reset to initial demo state!');
      setIsOpen(false);
    } catch (err) {
      alert('Reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      {/* Top / Floating bar button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-full shadow-xl hover:bg-slate-800 border border-slate-700 text-xs font-bold transition hover:scale-105"
        >
          <Users className="w-4 h-4 text-teal-400" />
          <span>Switch Role & 500 Users</span>
          {user && (
            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold uppercase text-[10px]">
              {user.role}
            </span>
          )}
        </button>
      </div>

      {feedback && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-teal-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Role Switcher Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Demo Role & User Switcher</h3>
                <p className="text-xs text-slate-500">Test the entire workflow as any of the 3 roles</p>
              </div>
            </div>

            <div className="my-4 grid grid-cols-3 gap-2.5">
              <button
                onClick={() => handleSwitch('24coe123@thapar.edu')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  user?.email === '24coe123@thapar.edu'
                    ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <User className="w-5 h-5 text-teal-600" />
                  <span className="text-[10px] font-bold text-teal-700 uppercase">Student</span>
                </div>
                <div className="font-bold text-xs text-slate-900 truncate">Devansh D.</div>
                <div className="text-[10px] text-slate-500 truncate">24COE123 · Hostel O</div>
              </button>

              <button
                onClick={() => handleSwitch('ramesh.kumar@thapar.edu')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  user?.email === 'ramesh.kumar@thapar.edu'
                    ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Staff</span>
                </div>
                <div className="font-bold text-xs text-slate-900 truncate">Ramesh Kumar</div>
                <div className="text-[10px] text-slate-500 truncate">Hostel O Counter</div>
              </button>

              <button
                onClick={() => handleSwitch('anjali.sharma@thapar.edu')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  user?.email === 'anjali.sharma@thapar.edu'
                    ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="text-[10px] font-bold text-purple-700 uppercase">Admin</span>
                </div>
                <div className="font-bold text-xs text-slate-900 truncate">Anjali Sharma</div>
                <div className="text-[10px] text-slate-500 truncate">Campus Admin</div>
              </button>
            </div>

            {/* 500 Students Section */}
            <div className="flex-1 flex flex-col min-h-0 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  500 Dummy Students Directory
                </span>
                <span className="text-[11px] text-slate-400">Total: 500 students</span>
              </div>

              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Roll (e.g. 24COE045) or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {students
                  .filter(s =>
                    !searchTerm ||
                    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSwitch(s.email)}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 transition border border-transparent hover:border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600">
                          {s.id.slice(-3)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{s.name}</div>
                          <div className="text-[10px] text-slate-500">{s.id} · Hostel {s.hostel} · Room {s.room}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Footer reset */}
            <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Need a clean slate?</span>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl font-semibold transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset Demo Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
