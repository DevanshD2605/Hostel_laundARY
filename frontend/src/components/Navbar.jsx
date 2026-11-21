import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shirt,
  Bell,
  LogOut,
  User,
  Shield,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';
import { NotificationsModal } from './NotificationsModal';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, unreadCount } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Shirt className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  Hostel LaundARY
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-teal-50 text-teal-700 border border-teal-200">
                  TIET
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Thapar Institute Smart Laundry System
              </p>
            </div>
          </div>

          {/* User profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Student notification bell */}
            {user.role === 'student' && (
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User pill */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold ${
                  user.role === 'admin'
                    ? 'bg-purple-600'
                    : user.role === 'staff'
                    ? 'bg-blue-600'
                    : 'bg-teal-600'
                }`}
              >
                {user.role === 'admin' ? (
                  <Shield className="w-4 h-4" />
                ) : user.role === 'staff' ? (
                  <Briefcase className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user.name || user.id}
                </div>
                <div className="text-[10px] text-slate-500 capitalize leading-tight">
                  {user.role === 'staff'
                    ? `Hostel ${user.hostelId} Counter`
                    : user.role === 'admin'
                    ? 'Campus Administrator'
                    : `${user.profile?.hostelId ? `Hostel ${user.profile.hostelId}` : user.id}`}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation tabs for role */}
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 py-1.5">
          {user.role === 'student' && (
            <>
              <TabBtn
                active={activeTab === 'home'}
                onClick={() => setActiveTab('home')}
                label="Home & Status"
              />
              <TabBtn
                active={activeTab === 'submit'}
                onClick={() => setActiveTab('submit')}
                label="New Drop-off"
              />
              <TabBtn
                active={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
                label="Laundry History"
              />
              <TabBtn
                active={activeTab === 'complaints'}
                onClick={() => setActiveTab('complaints')}
                label="Complaints"
              />
              <TabBtn
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                label="Profile & Room"
              />
            </>
          )}

          {user.role === 'staff' && (
            <>
              <TabBtn
                active={activeTab === 'queues'}
                onClick={() => setActiveTab('queues')}
                label="Counter Queues"
              />
              <TabBtn
                active={activeTab === 'pickup'}
                onClick={() => setActiveTab('pickup')}
                label="Scan Pickup QR"
              />
              <TabBtn
                active={activeTab === 'complaints'}
                onClick={() => setActiveTab('complaints')}
                label="Hostel Complaints"
              />
            </>
          )}

          {user.role === 'admin' && (
            <>
              <TabBtn
                active={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
                label="Overview"
              />
              <TabBtn
                active={activeTab === 'batches'}
                onClick={() => setActiveTab('batches')}
                label="All Batches"
              />
              <TabBtn
                active={activeTab === 'students'}
                onClick={() => setActiveTab('students')}
                label="500 Students"
              />
              <TabBtn
                active={activeTab === 'staff'}
                onClick={() => setActiveTab('staff')}
                label="Staff & Counters"
              />
              <TabBtn
                active={activeTab === 'complaints'}
                onClick={() => setActiveTab('complaints')}
                label="Complaints Desk"
              />
              <TabBtn
                active={activeTab === 'config'}
                onClick={() => setActiveTab('config')}
                label="Hostels & Semesters"
              />
              <TabBtn
                active={activeTab === 'audit'}
                onClick={() => setActiveTab('audit')}
                label="Audit Trail"
              />
              <TabBtn
                active={activeTab === 'reports'}
                onClick={() => setActiveTab('reports')}
                label="Analytics & TAT"
              />
            </>
          )}
        </div>
      </header>

      {/* Notifications Drawer Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}
