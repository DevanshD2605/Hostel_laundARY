# Thapar Hostel Laundry Management System (Hostel LaundARY)

A full-stack web application designed for university hostel laundry operations at Thapar Institute of Engineering & Technology (TIET). The system fully digitizes the laundry intake, verification, industrial washing, packaging, QR-code based pickup, and grievance resolution workflows across 18 campus hostels.

Converted and completed into modern **React (Vite + Tailwind CSS)** frontend and **Node.js (Express)** REST API backend with **500 pre-seeded dummy students**, 9 counter staff members, 18 hostels, active wash pipelines, pickup passes, and complete audit logging.

---

## 🚀 Quick Start (Run Locally)

### 1. Install Dependencies
Run the install command from the root directory:
```bash
npm run install:all
```
*(Or install in root, `backend/`, and `frontend/` respectively: `npm install && cd backend && npm install && cd ../frontend && npm install`)*

### 2. Start Both Backend & Frontend Concurrently
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173) (Vite HMR Development Server)
- **Backend REST API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

*(Express backend also serves the production build directly on `http://localhost:5000`)*

---

## 🔑 Demo Accounts & Quick Switcher

The website features an interactive **Floating Quick Role & 500 Users Switcher** on every page allowing instant 1-click testing without typing credentials.

### Standard Demo Accounts:
| Role | Email | Name / Details | Demo OTP |
|---|---|---|---|
| **Student** | `24coe123@thapar.edu` | Devansh Dhawan · Hostel O (Vyom Hall) · Room O-418 | `123456` |
| **Staff** | `ramesh.kumar@thapar.edu` | Ramesh Kumar · Hostel O Laundry Counter | `123456` |
| **Admin** | `anjali.sharma@thapar.edu` | Anjali Sharma · Campus Central Administrator | `123456` |

> **500 Dummy Students:** You can also sign in with any student roll number from `24coe001@thapar.edu` to `24coe500@thapar.edu` or search the 500-student directory in the UI!

---

## 📋 Comprehensive Feature Overview

### 1. 🎓 Student Portal (`/student`)
- **Live Counter Timings & Status Banner**: Dynamic schedule engine reflecting hostel drop-off days (12:30 PM - 3:00 PM and 4:00 PM - 7:00 PM), lunch break, and next laundry day countdowns.
- **Garment Drop-Off Intake**: Interactive garment category counters with quantity steppers (`Shirts`, `T-Shirts`, `Jeans / Pants`, `Shorts`, `Pyjama`, `Kurta / Salwar`, `Bedsheet`, `Pillow Cover`, `Towel`, `Turban / Dupatta`), and custom handling remarks.
- **Interactive Laundry Tracker**: Visual step-by-step progress timeline:
  `Submitted` → `Verified` → `Tagged` → `In Laundry` → `Ready for Pickup` → `Collected`
- **Count Difference & Defect Notations**: Transparent audit table showing original student-entered counts vs. physical counter-verified counts, and pre-existing garment defect flags noted by staff.
- **Digital Pickup Pass (QR Code & 6-Digit PIN)**: High-resolution QR code (`hlp:<token>`) with single-use redemption and 6-digit backup code for counter collection.
- **Laundry History**: Complete historical record with status filtering (`In Progress`, `Ready for Pickup`, `Collected`, `Rejected`).
- **Grievance Desk**: File issues regarding missing clothes, damages, or wash delays linked directly to specific batches.
- **Profile & Semester Enrollment**: Edit room, phone, hostel assignment, and one-click semester renewal.
- **In-App Notifications**: Real-time alerts when clothes enter the wash cycle, delay notices, or ready-for-pickup calls.

### 2. 👔 Staff Portal (`/staff`)
- **Multi-Queue Counter Dashboard**:
  - **To Verify**: Physical count verification with discrepancy tracking, defect condition checkboxes (`Small tear`, `Stain`, `Faded color`, `Missing button`), approve or reject with reason.
  - **To Tag**: Generate physical batch ID (`L-xxxx`) and mark tags applied.
  - **In Laundry**: Send tagged batches to central laundry wash, send delay alert notices.
  - **Returned**: Mark clean batches returned from facility.
  - **Ready for Pickup**: Trigger digital pickup passes with single-use tokens for students.
- **Scan / PIN Pickup Desk**:
  - Scan student's pickup QR code or type 6-digit PIN.
  - Real-time verification: Checks hostel match, student identity, package contents, and token validity.
  - Atomic single-use redemption marking the batch as `COLLECTED` and invalidating the token.
- **Counter Complaints Desk**: Review hostel grievances, add investigation notes, advance status, or escalate difficult cases to central administration.

### 3. 🛡️ Campus Administrator Portal (`/admin`)
- **Executive Operations Dashboard**: Campus-wide KPIs (500 enrolled students, total batches, throughput, average turnaround time, status distribution, volume per hostel).
- **500 Students Directory**: Searchable, paginated master table of all 500 dummy students (`24COE001` - `24COE500`), detail inspection, hostel re-allocation/transfers, and account activation toggling.
- **Counter Staff Administration**: Assign staff members to specific hostel counters and toggle access.
- **Campus Master Batches**: Filterable ledger across all 18 hostels with full verification logs.
- **Central Complaints Desk**: Campus-wide dispute resolution, escalated issues filter, administrative directives, and send-back capabilities.
- **Hostels & Schedules Configuration**: Configure collection/delivery days for all 18 hostels, add new hostels.
- **Academic Term Management**: Start new semester with automated rollover (ending previous semester and setting pending renewals), bulk approve renewals.
- **Garment & Defect Setup**: Add/retire clothing categories and manage damage tags.
- **Tamper-Evident Audit Trail**: Searchable immutable record of all student submissions, staff count corrections, status transitions, and administrative reconfigurations.
- **Analytics & TAT Reports**: Garment category breakdown, hostel throughput charts, and average turnaround SLA tracking.

---

## 🛠️ Project Structure

```
├── backend/
│   ├── data/
│   │   └── db.json         # Persistent JSON database (500 students, batches, complaints, audit)
│   ├── server.js           # Express REST API (Auth, Batches, Pickup, Complaints, Admin)
│   ├── seed.js             # Seeding generator for 500 students, staff, hostels & batches
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js   # HTTP API client with Bearer auth handling
│   │   ├── components/     # Navbar, QuickRoleSwitcher, PickupModal, NotificationsModal
│   │   ├── constants/      # Status maps, schedule rules, counter timings
│   │   ├── context/        # AuthContext (user state, notifications, quick switch)
│   │   ├── pages/
│   │   │   ├── Login.jsx   # OTP & Quick login page
│   │   │   ├── student/    # Dashboard, SubmitRequest, LaundryTracker, History, Complaints, Profile
│   │   │   ├── staff/      # StaffDashboard, StaffScanPickup, StaffComplaints, StaffVerifyModal
│   │   │   └── admin/      # Dashboard, Students (500), Staff, Batches, Complaints, Config, Audit, Reports
│   │   ├── App.jsx         # Role-based router & layout
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js      # Vite config with backend proxy on /api
│   └── package.json
├── package.json            # Root runner (concurrently running dev servers)
└── README.md
```

---

## 🔄 Re-seeding the 500 Dummy Users

If you want to reset the database to a clean 500-student state:
```bash
npm run seed
```
*(Or use the "Reset Demo Database" button in the in-app Role Switcher modal).*
