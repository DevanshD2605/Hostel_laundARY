import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Shirt, Mail, KeyRound, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export function Login() {
  const { loginWithOtp, quickSwitchUser } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith('@thapar.edu')) {
      setError('Please enter a valid Thapar University email address (@thapar.edu)');
      return;
    }

    setLoading(true);
    try {
      await api.auth.sendOtp(cleanEmail);
      setStep('otp');
      setInfo('Demo OTP is 123456. Check console or enter directly.');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithOtp(email.trim().toLowerCase(), otp.trim());
    } catch (err) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail) => {
    setError('');
    setLoading(true);
    try {
      await quickSwitchUser(targetEmail);
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-teal-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white shadow-xl shadow-teal-500/20 mb-4 ring-8 ring-teal-50">
            <Shirt className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Hostel LaundARY
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thapar Institute Student, Staff & Admin Portal
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-2.5 text-xs text-teal-800">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Thapar Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. 24coe123@thapar.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Students, staff and administrators use their official email.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{loading ? 'Sending OTP...' : 'Continue with OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    6-Digit One-Time Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-xs text-teal-600 hover:underline font-semibold"
                  >
                    Change email
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base tracking-widest font-mono text-center font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Enter demo code <span className="font-bold text-slate-800">123456</span> to sign in.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{loading ? 'Verifying...' : 'Verify & Enter'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-center mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                1-Click Fast Demo Login
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('24coe123@thapar.edu')}
                disabled={loading}
                className="w-full p-2.5 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 flex items-center justify-between text-left transition group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700">
                    Devansh Dhawan (Student)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    24COE123 · Hostel O (Vyom Hall) · Room O-418
                  </div>
                </div>
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                  Login
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ramesh.kumar@thapar.edu')}
                disabled={loading}
                className="w-full p-2.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between text-left transition group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    Ramesh Kumar (Staff)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Counter Staff · Hostel O Laundry Desk
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                  Login
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('anjali.sharma@thapar.edu')}
                disabled={loading}
                className="w-full p-2.5 rounded-2xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 flex items-center justify-between text-left transition group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                    Anjali Sharma (Campus Admin)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Campus-wide Hostels & 500 Students Controller
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                  Login
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Thapar Institute of Engineering & Technology · Hostel Laundry App
        </div>
      </div>
    </div>
  );
}
