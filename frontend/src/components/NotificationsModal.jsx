import React from 'react';
import { X, Bell, CheckCheck, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function NotificationsModal({ isOpen, onClose }) {
  const { notifications, markAllNotificationsRead } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Notifications</h3>
              <p className="text-xs text-slate-500">Updates on your laundry requests</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllNotificationsRead}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto stroke-[1.5] mb-2 opacity-40" />
              <p className="text-sm font-medium">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition ${
                  n.read
                    ? 'bg-white border-slate-100 text-slate-600'
                    : 'bg-teal-50/50 border-teal-100 text-slate-800 font-medium'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-teal-600"></span>}
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
