import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { QuickRoleSwitcher } from './components/QuickRoleSwitcher';
import { Login } from './pages/Login';

// Student Views
import { StudentDashboard } from './pages/student/StudentDashboard';
import { SubmitRequest } from './pages/student/SubmitRequest';
import { LaundryTracker } from './pages/student/LaundryTracker';
import { LaundryHistory } from './pages/student/LaundryHistory';
import { StudentComplaints } from './pages/student/StudentComplaints';
import { StudentProfile } from './pages/student/StudentProfile';

// Staff Views
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffScanPickup } from './pages/staff/StaffScanPickup';
import { StaffComplaints } from './pages/staff/StaffComplaints';

// Admin Views
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBatches } from './pages/admin/AdminBatches';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminStaff } from './pages/admin/AdminStaff';
import { AdminComplaints } from './pages/admin/AdminComplaints';
import { AdminConfig } from './pages/admin/AdminConfig';
import { AdminAudit } from './pages/admin/AdminAudit';
import { AdminReports } from './pages/admin/AdminReports';

import { Shirt } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [complaintBatchId, setComplaintBatchId] = useState(null);

  // Set default tab on role switch
  useEffect(() => {
    if (user?.role === 'student') setActiveTab('home');
    else if (user?.role === 'staff') setActiveTab('queues');
    else if (user?.role === 'admin') setActiveTab('dashboard');
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-600 text-white flex items-center justify-center shadow-xl animate-pulse mb-4">
          <Shirt className="w-8 h-8 stroke-[2.2]" />
        </div>
        <p className="text-sm font-bold text-slate-700">Loading Hostel LaundARY...</p>
        <p className="text-xs text-slate-400 mt-1">Thapar Institute Campus Portal</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login />
        <QuickRoleSwitcher />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {/* Student View Routing */}
        {user.role === 'student' && (
          <>
            {activeTab === 'home' && (
              <StudentDashboard
                onNavigate={setActiveTab}
                onSelectBatch={setSelectedBatch}
              />
            )}
            {activeTab === 'submit' && (
              <SubmitRequest
                onBack={() => setActiveTab('home')}
                onSuccess={(b) => {
                  setSelectedBatch(b);
                  setActiveTab('tracker');
                }}
              />
            )}
            {activeTab === 'tracker' && (
              <LaundryTracker
                batchId={selectedBatch?.bid || selectedBatch?.rid}
                onBack={() => setActiveTab('home')}
                onFileComplaint={(bId) => {
                  setComplaintBatchId(bId);
                  setActiveTab('complaints');
                }}
              />
            )}
            {activeTab === 'history' && (
              <LaundryHistory
                onSelectBatch={(b) => {
                  setSelectedBatch(b);
                  setActiveTab('tracker');
                }}
              />
            )}
            {activeTab === 'complaints' && (
              <StudentComplaints initialBatchId={complaintBatchId} />
            )}
            {activeTab === 'profile' && <StudentProfile />}
          </>
        )}

        {/* Staff View Routing */}
        {user.role === 'staff' && (
          <>
            {activeTab === 'queues' && (
              <StaffDashboard
                onNavigateToPickup={() => setActiveTab('pickup')}
              />
            )}
            {activeTab === 'pickup' && <StaffScanPickup />}
            {activeTab === 'complaints' && <StaffComplaints />}
          </>
        )}

        {/* Admin View Routing */}
        {user.role === 'admin' && (
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboard onNavigate={setActiveTab} />
            )}
            {activeTab === 'batches' && <AdminBatches />}
            {activeTab === 'students' && <AdminStudents />}
            {activeTab === 'staff' && <AdminStaff />}
            {activeTab === 'complaints' && <AdminComplaints />}
            {activeTab === 'config' && <AdminConfig />}
            {activeTab === 'audit' && <AdminAudit />}
            {activeTab === 'reports' && <AdminReports />}
          </>
        )}
      </main>

      <QuickRoleSwitcher />
    </div>
  );
}
