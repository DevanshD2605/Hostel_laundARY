import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSeedData } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'db.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Load or seed DB
let db;
function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    console.log('Database file not found, seeding new database...');
    db = generateSeedData();
    saveDb();
  } else {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
    } catch (err) {
      console.error('Error reading db.json, re-seeding:', err);
      db = generateSeedData();
      saveDb();
    }
  }
}

function saveDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

loadDb();

// Helper functions
const curSem = () => db.semesters.find((s) => s.current) || db.semesters[0];
const curEnr = (s) => (s.enrollments && s.enrollments.find((e) => e.status === 'Active'))
  || (s.enrollments && s.enrollments.find((e) => e.status === 'Pending renewal'))
  || (s.enrollments && s.enrollments[s.enrollments.length - 1]);

const hName = (id) => db.hostels.find((h) => h.id === id)?.name ?? id;

function getUser(req) {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token && req.headers['x-user-email']) {
    token = req.headers['x-user-email'];
  }
  if (!token) return null;
  const email = token.trim().toLowerCase();

  if (email === db.admin.email.toLowerCase()) {
    return { id: db.admin.id, role: 'admin', name: db.admin.name, email: db.admin.email };
  }

  const staff = db.staff.find((s) => s.email.toLowerCase() === email);
  if (staff) {
    if (!staff.active) return { error: 'Account deactivated', status: 403 };
    return { id: staff.id, role: 'staff', name: staff.name, email: staff.email, hostelId: staff.hostelId };
  }

  const student = db.students.find((s) => s.email.toLowerCase() === email);
  if (student) {
    if (!student.active) return { error: 'Account deactivated', status: 403 };
    return { id: student.id, role: 'student', name: student.name, email: student.email };
  }

  // If user signed in with valid thapar email not in db yet, create new student
  if (email.endsWith('@thapar.edu')) {
    const rollMatch = email.match(/^([a-z0-9]+)@/i);
    const roll = rollMatch ? rollMatch[1].toUpperCase() : `24STU${Math.floor(100 + Math.random() * 900)}`;
    const newStudent = {
      id: roll,
      name: '',
      phone: '',
      email,
      active: true,
      enrollments: [],
      room: '',
      gender: 'Boys',
      hasProfile: false
    };
    db.students.push(newStudent);
    saveDb();
    return { id: newStudent.id, role: 'student', name: newStudent.name, email: newStudent.email };
  }

  return null;
}

function requireAuth(req, res, next) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  if (user.error) return res.status(user.status || 403).json({ error: user.error });
  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'You do not have permission to do this' });
      }
      next();
    });
  };
}

function addAudit(batchId, action, from, to, who, role) {
  db.audit.unshift({
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    at: new Date().toISOString(),
    batchId: batchId || '',
    who,
    role,
    action,
    from,
    to
  });
  saveDb();
}

function notify(studentId, title, body) {
  if (!db.notifications[studentId]) db.notifications[studentId] = [];
  db.notifications[studentId].unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title,
    body,
    at: new Date().toISOString(),
    read: false
  });
  saveDb();
}

function toMe(user) {
  if (user.role !== 'student') {
    return { id: user.id, role: user.role, email: user.email, name: user.name, hostelId: user.hostelId };
  }
  const s = db.students.find((x) => x.id === user.id);
  if (!s) return { id: user.id, role: 'student', email: user.email, name: user.name };
  const e = curEnr(s);
  return {
    id: s.id,
    role: 'student',
    email: s.email,
    name: s.name,
    profile: s.hasProfile && e ? { name: s.name, gender: s.gender, hostelId: e.hostelId, room: s.room, phone: s.phone } : null,
    enrollment: e ? { ...e } : null
  };
}

// -----------------------------------------------------------------------------
// ROUTES
// -----------------------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    studentsCount: db.students.length,
    staffCount: db.staff.length,
    batchesCount: db.batches.length,
    complaintsCount: db.complaints.length,
    serverTime: new Date().toISOString()
  });
});

// Demo info & quick accounts
app.get('/api/demo/users', (req, res) => {
  const sampleStudents = db.students.slice(0, 15).map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    hostel: curEnr(s)?.hostelId || s.gender,
    room: s.room
  }));

  res.json({
    demoOtp: '123456',
    admin: db.admin,
    staff: db.staff,
    sampleStudents,
    totalStudents: db.students.length
  });
});

// Auth: Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { email } = req.body;
  if (!email || !email.toLowerCase().endsWith('@thapar.edu')) {
    return res.status(400).json({ error: 'Please use your college email (@thapar.edu).' });
  }
  console.log(`[OTP] Sent OTP 123456 to ${email}`);
  res.json({ message: 'OTP sent successfully (Demo OTP: 123456)' });
});

// Auth: Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp, token } = req.body;
  const code = (otp || token || '').trim();
  const e = (email || '').trim().toLowerCase();

  if (!e.endsWith('@thapar.edu')) {
    return res.status(400).json({ error: 'Please use your college email (@thapar.edu).' });
  }

  if (code !== '123456') {
    return res.status(401).json({ error: 'Incorrect OTP. Authentication rejected.' });
  }

  let user = null;
  if (e === db.admin.email.toLowerCase()) {
    user = { id: db.admin.id, role: 'admin', name: db.admin.name, email: db.admin.email };
  } else {
    const staff = db.staff.find(s => s.email.toLowerCase() === e);
    if (staff) {
      if (!staff.active) return res.status(403).json({ error: 'Account deactivated' });
      user = { id: staff.id, role: 'staff', name: staff.name, email: staff.email, hostelId: staff.hostelId };
    } else {
      let student = db.students.find(s => s.email.toLowerCase() === e);
      if (!student) {
        const roll = e.split('@')[0].toUpperCase();
        student = {
          id: roll,
          name: '',
          phone: '',
          email: e,
          active: true,
          enrollments: [],
          room: '',
          gender: 'Boys',
          hasProfile: false
        };
        db.students.push(student);
        saveDb();
      }
      if (!student.active) return res.status(403).json({ error: 'Account deactivated' });
      user = { id: student.id, role: 'student', name: student.name, email: student.email };
    }
  }

  const access_token = e;
  res.json({
    token: access_token,
    access_token,
    session: { access_token },
    me: toMe(user)
  });
});

// Current User Me
app.get('/api/me', requireAuth, (req, res) => {
  res.json(toMe(req.user));
});

// Update Student Profile
app.put('/api/me/profile', requireRole('student'), (req, res) => {
  const p = req.body;
  const s = db.students.find(x => x.id === req.user.id);
  if (!s) return res.status(404).json({ error: 'Student not found' });

  if (!p.name || !p.name.trim()) return res.status(400).json({ error: 'Please enter your name.' });
  const h = db.hostels.find(x => x.id === p.hostelId);
  if (!h) return res.status(400).json({ error: 'Please choose your hostel.' });
  if (!p.room || !p.room.trim()) return res.status(400).json({ error: 'Please enter a valid room number.' });
  if (!p.phone || !/^\d{10}$/.test(p.phone.trim())) return res.status(400).json({ error: 'Mobile number must be 10 digits.' });

  const e = curEnr(s);
  s.name = p.name.trim();
  s.room = p.room.trim();
  s.phone = p.phone.trim();
  s.gender = h.group;
  s.hasProfile = true;

  if (!e) {
    s.enrollments = s.enrollments || [];
    s.enrollments.push({ semesterId: curSem().id, hostelId: h.id, status: 'Active' });
  } else if (e.hostelId !== h.id) {
    e.status = 'Ended';
    s.enrollments.push({ semesterId: curSem().id, hostelId: h.id, status: 'Active' });
    addAudit('', `Changed hostel for ${s.id} (${s.name})`, hName(e.hostelId), hName(h.id), req.user.name, 'student');
  }

  saveDb();
  res.json(toMe(req.user));
});

// Renew Enrollment
app.post('/api/me/renew', requireRole('student'), (req, res) => {
  const s = db.students.find(x => x.id === req.user.id);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const e = s.enrollments?.find(x => x.status === 'Pending renewal');
  if (!e) return res.status(400).json({ error: 'Nothing to renew' });
  e.status = 'Active';
  addAudit('', `Renewed enrollment for ${s.id} (${s.name})`, 'Pending renewal', 'Active', req.user.name, 'student');
  saveDb();
  res.json(toMe(req.user));
});

// App Config
app.get('/api/config', (req, res) => {
  res.json({
    hostels: db.hostels,
    semesters: db.semesters,
    categories: db.categories,
    conditions: db.conditions
  });
});

// Batches List
app.get('/api/batches', requireAuth, (req, res) => {
  const { status, search, hostelId, studentId } = req.query;
  const u = req.user;
  const statusFilter = status ? status.split(',').map(s => s.trim()) : null;
  const qSearch = search ? search.trim().toLowerCase() : null;

  let results = db.batches.filter(b => {
    // Role permissions
    if (u.role === 'student' && b.studentId !== u.id) return false;
    if (u.role === 'staff' && b.hostelId !== u.hostelId) return false;

    // Filters
    if (hostelId && b.hostelId !== hostelId) return false;
    if (studentId && b.studentId !== studentId) return false;
    if (statusFilter && !statusFilter.includes(b.status)) return false;
    if (qSearch) {
      const match = [b.rid, b.bid || '', b.studentId, b.studentName, b.room || '']
        .some(str => str.toLowerCase().includes(qSearch));
      if (!match) return false;
    }
    return true;
  });

  results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json(results);
});

// Get Single Batch
app.get('/api/batches/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const u = req.user;
  const b = db.batches.find(x => x.rid === id || x.bid === id);
  if (!b) return res.status(404).json({ error: 'Laundry batch not found' });

  if (u.role === 'student' && b.studentId !== u.id) {
    return res.status(403).json({ error: 'You do not have permission to view this batch' });
  }
  if (u.role === 'staff' && b.hostelId !== u.hostelId) {
    return res.status(403).json({ error: 'This batch belongs to another counter' });
  }

  res.json(b);
});

// Submit Laundry Request
app.post('/api/batches', requireRole('student'), (req, res) => {
  const { items, remark } = req.body;
  const s = db.students.find(x => x.id === req.user.id);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const e = curEnr(s);
  if (!e || e.status !== 'Active') {
    return res.status(409).json({ error: 'Renew your hostel for this semester before submitting laundry.' });
  }

  const cleanItems = {};
  let totalPieces = 0;
  for (const [k, v] of Object.entries(items || {})) {
    const qty = parseInt(v, 10);
    if (qty > 0) {
      cleanItems[k] = qty;
      totalPieces += qty;
    }
  }

  if (totalPieces === 0) {
    return res.status(400).json({ error: 'Add at least one item.' });
  }

  const h = db.hostels.find(x => x.id === e.hostelId);
  const highestRidNum = db.batches.reduce((max, b) => {
    const m = b.rid.match(/^LR-(\d+)$/);
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 1000);

  const nextNum = highestRidNum + 1;
  const rid = `LR-${nextNum}`;

  // Next delivery date calculation
  const nextDow = (dow) => {
    const from = new Date();
    const gap = ((dow - from.getDay() + 7) % 7) || 7;
    const d = new Date(from.getTime() + gap * 864e5);
    return d.toISOString().split('T')[0];
  };

  const expectedOn = h ? nextDow(h.days[1]) : null;
  const submittedAt = new Date().toISOString();

  const newBatch = {
    rid,
    bid: null,
    studentId: s.id,
    studentName: s.name,
    hostelId: e.hostelId,
    room: s.room,
    semesterId: e.semesterId,
    status: 'WAITING_FOR_VERIFICATION',
    late: false,
    submittedAt,
    expectedOn,
    returnedAt: null,
    items: cleanItems,
    original: { ...cleanItems },
    conditions: [],
    remark: (remark || '').trim(),
    log: [
      { t: submittedAt, who: s.name, role: 'student', a: 'Submitted request', to: 'Waiting for verification' }
    ],
    complaintId: null
  };

  db.batches.unshift(newBatch);
  addAudit(rid, 'Submitted request', '', 'Waiting for verification', s.name, 'student');
  notify(s.id, 'Request submitted', `Request ${rid} is waiting for staff verification at Hostel ${e.hostelId} counter`);
  saveDb();

  res.status(201).json(newBatch);
});

// Verify Request (Staff)
app.post('/api/batches/:rid/verify', requireRole('staff'), (req, res) => {
  const rid = req.params.rid;
  const { items, conditions, remark } = req.body;
  const b = db.batches.find(x => x.rid === rid);
  if (!b) return res.status(404).json({ error: 'Batch not found' });
  if (b.hostelId !== req.user.hostelId) return res.status(403).json({ error: 'This batch belongs to another counter' });
  if (b.status !== 'WAITING_FOR_VERIFICATION') {
    return res.status(409).json({ error: `Not allowed: this laundry is already in progress` });
  }

  const cleanItems = {};
  let totalPieces = 0;
  for (const [k, v] of Object.entries(items || {})) {
    const qty = parseInt(v, 10);
    if (qty > 0) {
      cleanItems[k] = qty;
      totalPieces += qty;
    }
  }

  if (totalPieces === 0) {
    return res.status(400).json({ error: 'Approve at least one piece, or reject the request.' });
  }

  const changed = Object.keys({ ...b.original, ...cleanItems })
    .filter(k => (b.original[k] || 0) !== (cleanItems[k] || 0));

  b.items = cleanItems;
  b.conditions = Array.isArray(conditions) ? conditions : [];
  b.remark = (remark || '').trim();
  b.status = 'AWAITING_TAGGING';

  const actionMsg = changed.length
    ? `Verified. Changed ${changed.map(k => `${k} ${b.original[k] || 0} to ${cleanItems[k] || 0}`).join(', ')}`
    : 'Verified physical count, no changes';

  const logAt = new Date().toISOString();
  b.log.push({
    t: logAt,
    who: req.user.name,
    role: 'staff',
    a: actionMsg,
    from: 'Waiting for verification',
    to: 'Awaiting tagging'
  });

  addAudit(b.bid || b.rid, actionMsg, 'Waiting for verification', 'Awaiting tagging', req.user.name, 'staff');

  if (changed.length) {
    changed.forEach(k => {
      addAudit(b.bid || b.rid, 'Changed student’s entry at verification', `${k} ${b.original[k] || 0}`, `${k} ${cleanItems[k] || 0}`, req.user.name, 'staff');
    });
  }

  notify(b.studentId, changed.length ? 'Request count modified' : 'Verification completed', `${b.rid} verified: ${totalPieces} pieces at counter`);
  saveDb();

  res.json(b);
});

// Reject Request (Staff)
app.post('/api/batches/:rid/reject', requireRole('staff'), (req, res) => {
  const rid = req.params.rid;
  const { reason } = req.body;
  const b = db.batches.find(x => x.rid === rid);
  if (!b) return res.status(404).json({ error: 'Batch not found' });
  if (b.hostelId !== req.user.hostelId) return res.status(403).json({ error: 'This batch belongs to another counter' });
  if (b.status !== 'WAITING_FOR_VERIFICATION') return res.status(409).json({ error: 'Can only reject pending requests' });

  b.status = 'CANCELLED';
  const aMsg = `Rejected at verification: ${reason || 'Not accepted'}`;
  b.log.push({
    t: new Date().toISOString(),
    who: req.user.name,
    role: 'staff',
    a: aMsg,
    from: 'Waiting for verification',
    to: 'Rejected'
  });

  addAudit(b.bid || b.rid, aMsg, 'Waiting for verification', 'Rejected', req.user.name, 'staff');
  notify(b.studentId, 'Request rejected', `${b.rid} was rejected by staff: ${reason || 'Discrepancy at counter'}`);
  saveDb();

  res.json(b);
});

// Generate Batch ID (Staff)
app.post('/api/batches/:rid/batch-id', requireRole('staff'), (req, res) => {
  const rid = req.params.rid;
  const b = db.batches.find(x => x.rid === rid);
  if (!b) return res.status(404).json({ error: 'Batch not found' });
  if (b.hostelId !== req.user.hostelId) return res.status(403).json({ error: 'This batch belongs to another counter' });
  if (b.bid) return res.json(b);

  const highestBidNum = db.batches.reduce((max, x) => {
    const m = x.bid?.match(/^L-(\d+)$/);
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 1000);

  b.bid = `L-${highestBidNum + 1}`;
  b.log.push({
    t: new Date().toISOString(),
    who: req.user.name,
    role: 'staff',
    a: `Generated batch ID ${b.bid}`
  });

  addAudit(b.bid, `Generated batch ID ${b.bid}`, '', '', req.user.name, 'staff');
  saveDb();

  res.json(b);
});

// Batch State Transition (Staff)
app.post('/api/batches/transition', requireRole('staff'), (req, res) => {
  const { ids, to } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No batch IDs provided' });

  const validTransitions = {
    TAGGED: { from: 'AWAITING_TAGGING', msg: 'Tag applied', label: 'Tagged' },
    IN_LAUNDRY: { from: 'TAGGED', msg: 'Sent to laundry', label: 'In laundry' },
    RETURNED: { from: 'IN_LAUNDRY', msg: 'Marked returned', label: 'Returned' },
    READY_FOR_PICKUP: { from: 'RETURNED', msg: 'Marked ready for pickup. QR activated', label: 'Ready for pickup' }
  };

  const conf = validTransitions[to];
  if (!conf) return res.status(400).json({ error: `Invalid transition target: ${to}` });

  const updatedBatches = [];
  for (const id of ids) {
    const b = db.batches.find(x => x.rid === id || x.bid === id);
    if (!b || b.hostelId !== req.user.hostelId) continue;
    if (to === 'TAGGED' && !b.bid) {
      const highestBidNum = db.batches.reduce((max, x) => {
        const m = x.bid?.match(/^L-(\d+)$/);
        return m ? Math.max(max, parseInt(m[1], 10)) : max;
      }, 1000);
      b.bid = `L-${highestBidNum + 1}`;
    }

    const prevStatus = b.status;
    b.status = to;
    const nowIso = new Date().toISOString();

    b.log.push({
      t: nowIso,
      who: req.user.name,
      role: 'staff',
      a: conf.msg,
      from: prevStatus,
      to: conf.label
    });

    addAudit(b.bid || b.rid, conf.msg, prevStatus, conf.label, req.user.name, 'staff');

    if (to === 'RETURNED') {
      b.late = false;
      b.returnedAt = nowIso;
      notify(b.studentId, 'Laundry returned', `Batch ${b.bid || b.rid} is back from central laundry`);
    } else if (to === 'IN_LAUNDRY') {
      notify(b.studentId, 'Wash in progress', `Batch ${b.bid || b.rid} entered washing cycle`);
    } else if (to === 'READY_FOR_PICKUP') {
      const token = `hlp_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      let code;
      do {
        code = String(100000 + Math.floor(Math.random() * 900000));
      } while (Object.values(db.pickups).some(p => p.code === code && !p.used));

      db.pickups[b.rid] = { token, code, used: false };
      b.tokenActive = true;
      b.tokenUsed = false;
      notify(b.studentId, 'Ready for pickup!', `Batch ${b.bid || b.rid} is ready at Hostel ${b.hostelId} counter. Use QR code or code ${code}`);
    }

    updatedBatches.push(b);
  }

  saveDb();
  res.json(updatedBatches);
});

// Send Delay Notice (Staff)
app.post('/api/batches/:rid/delay-notice', requireRole('staff'), (req, res) => {
  const rid = req.params.rid;
  const b = db.batches.find(x => x.rid === rid);
  if (!b) return res.status(404).json({ error: 'Batch not found' });
  if (b.hostelId !== req.user.hostelId) return res.status(403).json({ error: 'This batch belongs to another counter' });

  b.late = true;
  b.log.push({
    t: new Date().toISOString(),
    who: req.user.name,
    role: 'staff',
    a: 'Delay notice sent to student'
  });

  addAudit(b.bid || b.rid, 'Sent delay notice to student', '', '', req.user.name, 'staff');
  notify(b.studentId, 'Laundry delayed', `Batch ${b.bid || b.rid} is taking slightly longer than scheduled due to heavy campus load.`);
  saveDb();

  res.json({ success: true, message: 'Delay notice sent' });
});

// Get Pickup Info (Student)
app.get('/api/batches/:rid/pickup', requireRole('student'), (req, res) => {
  const rid = req.params.rid;
  const b = db.batches.find(x => x.rid === rid);
  if (!b || b.studentId !== req.user.id) return res.status(404).json({ error: 'Batch not found' });

  const pickup = db.pickups[b.rid];
  res.json(pickup || null);
});

// Pickup Lookup (Staff)
app.post('/api/pickup/lookup', requireRole('staff'), (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ kind: 'invalid', message: 'No code provided' });

  const clean = code.replace(/\s+/g, '').replace(/^hlp:/, '');
  const hit = Object.entries(db.pickups).find(([, p]) => p.code === clean || p.token === clean);

  if (!hit) return res.json({ kind: 'invalid' });
  const [targetRid, pickupData] = hit;
  const b = db.batches.find(x => x.rid === targetRid);

  if (!b || b.hostelId !== req.user.hostelId) {
    return res.json({ kind: 'invalid', message: 'Batch belongs to another hostel counter' });
  }

  if (b.status === 'COLLECTED' || pickupData.used) {
    return res.json({ kind: 'used', batch: b });
  }

  if (b.status !== 'READY_FOR_PICKUP') {
    return res.json({ kind: 'invalid', message: 'Batch is not marked ready for pickup yet' });
  }

  res.json({ kind: 'ok', batch: b });
});

// Confirm Collection (Staff)
app.post('/api/pickup/confirm', requireRole('staff'), (req, res) => {
  const { rid } = req.body;
  const b = db.batches.find(x => x.rid === rid);
  if (!b) return res.status(404).json({ error: 'Batch not found' });
  if (b.hostelId !== req.user.hostelId) return res.status(403).json({ error: 'This batch belongs to another counter' });
  if (b.status === 'COLLECTED') return res.status(409).json({ error: 'Batch already collected' });
  if (b.status !== 'READY_FOR_PICKUP') return res.status(409).json({ error: 'Batch is not ready for pickup' });

  b.status = 'COLLECTED';
  b.tokenActive = false;
  b.tokenUsed = true;

  if (db.pickups[b.rid]) {
    db.pickups[b.rid].used = true;
  }

  const nowIso = new Date().toISOString();
  b.log.push({
    t: nowIso,
    who: req.user.name,
    role: 'staff',
    a: 'Collection confirmed. QR token used',
    from: 'Ready for pickup',
    to: 'Collected'
  });

  addAudit(b.bid || b.rid, 'Collection confirmed. QR token used', 'Ready for pickup', 'Collected', req.user.name, 'staff');
  notify(b.studentId, 'Laundry collected', `Batch ${b.bid || b.rid} handover confirmed at counter. Enjoy clean clothes!`);
  saveDb();

  res.json(b);
});

// Complaints: List
app.get('/api/complaints', requireAuth, (req, res) => {
  const u = req.user;
  let results = db.complaints.filter(c => {
    if (u.role === 'student') return c.studentId === u.id;
    if (u.role === 'staff') return c.hostelId === u.hostelId;
    return true; // admin sees all
  });

  results.sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt));
  res.json(results);
});

// Complaints: Get by ID
app.get('/api/complaints/:id', requireAuth, (req, res) => {
  const c = db.complaints.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  const u = req.user;

  if (u.role === 'student' && c.studentId !== u.id) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  if (u.role === 'staff' && c.hostelId !== u.hostelId) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  res.json(c);
});

// Complaints: Create (Student)
app.post('/api/complaints', requireRole('student'), (req, res) => {
  const { batchId, type, description } = req.body;
  const s = db.students.find(x => x.id === req.user.id);
  const b = db.batches.find(x => x.bid === batchId || x.rid === batchId);

  if (!b || b.studentId !== s.id) return res.status(404).json({ error: 'Linked laundry batch not found' });
  if (!description || !description.trim()) return res.status(400).json({ error: 'Please describe the issue.' });

  const highestCId = db.complaints.reduce((max, c) => {
    const m = c.id.match(/^C-(\d+)$/);
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 10);

  const cId = `C-${highestCId + 1}`;
  const nowIso = new Date().toISOString();

  const complaint = {
    id: cId,
    batchId: b.bid || b.rid,
    studentId: s.id,
    studentName: s.name,
    hostelId: b.hostelId,
    type: type || 'Other',
    status: 'Open',
    escalated: false,
    filedAt: nowIso,
    description: description.trim(),
    notes: []
  };

  db.complaints.unshift(complaint);
  b.complaintId = cId;
  b.log.push({
    t: nowIso,
    who: s.name,
    role: 'student',
    a: `Complaint ${cId} filed: ${type}`
  });

  addAudit(b.bid || b.rid, `Complaint ${cId} filed: ${type}`, '', 'Open', s.name, 'student');
  notify(s.id, 'Complaint submitted', `Complaint ${cId} registered for batch ${b.bid || b.rid}. Counter staff notified.`);
  saveDb();

  res.status(201).json(complaint);
});

// Complaints: Add Note (Staff / Admin)
app.post('/api/complaints/:id/notes', requireRole('staff', 'admin'), (req, res) => {
  const c = db.complaints.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Write a note first.' });

  const nowIso = new Date().toISOString();
  c.notes = c.notes || [];
  c.notes.push({
    t: nowIso,
    who: req.user.name,
    role: req.user.role,
    a: text.trim()
  });

  addAudit(c.batchId, `Complaint ${c.id}: ${text.trim().substring(0, 50)}`, '', '', req.user.name, req.user.role);
  saveDb();

  res.json(c);
});

// Complaints: Advance Status (Staff / Admin)
app.post('/api/complaints/:id/advance', requireRole('staff', 'admin'), (req, res) => {
  const c = db.complaints.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });

  const stages = ['Open', 'Under review', 'Investigating', 'Resolved', 'Closed'];
  const curIdx = stages.indexOf(c.status);
  if (curIdx >= stages.length - 1) {
    return res.status(409).json({ error: 'This complaint is already closed.' });
  }

  const { note } = req.body;
  const nextStatus = stages[curIdx + 1];
  const nowIso = new Date().toISOString();

  if (note && note.trim()) {
    c.notes.push({
      t: nowIso,
      who: req.user.name,
      role: req.user.role,
      a: note.trim()
    });
  }

  const fromStatus = c.status;
  c.status = nextStatus;

  addAudit(c.batchId, `Complaint ${c.id} moved to ${nextStatus}`, fromStatus, nextStatus, req.user.name, req.user.role);
  notify(c.studentId, 'Complaint update', `Complaint ${c.id} moved to status: ${nextStatus}`);
  saveDb();

  res.json(c);
});

// Complaints: Escalate (Staff)
app.post('/api/complaints/:id/escalate', requireRole('staff'), (req, res) => {
  const c = db.complaints.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });

  c.escalated = true;
  c.notes.push({
    t: new Date().toISOString(),
    who: req.user.name,
    role: 'staff',
    a: 'Escalated to central admin for review'
  });

  addAudit(c.batchId, `Escalated complaint ${c.id} to admin`, '', '', req.user.name, 'staff');
  saveDb();

  res.json(c);
});

// Complaints: Send Back to Staff (Admin)
app.post('/api/complaints/:id/send-back', requireRole('admin'), (req, res) => {
  const c = db.complaints.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });

  c.escalated = false;
  c.notes.push({
    t: new Date().toISOString(),
    who: req.user.name,
    role: 'admin',
    a: 'Sent back to hostel counter staff for local resolution'
  });

  addAudit(c.batchId, `Complaint ${c.id} sent back to staff`, '', '', req.user.name, 'admin');
  saveDb();

  res.json(c);
});

// Notifications: List (Student)
app.get('/api/notifications', requireAuth, (req, res) => {
  if (req.user.role !== 'student') return res.json([]);
  const list = db.notifications[req.user.id] || [];
  res.json(list);
});

// Notifications: Mark All Read (Student)
app.post('/api/notifications/read-all', requireRole('student'), (req, res) => {
  const list = db.notifications[req.user.id] || [];
  list.forEach(n => { n.read = true; });
  saveDb();
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// ADMIN ENDPOINTS
// -----------------------------------------------------------------------------

// Admin: Students List (500+ Dummy Students)
app.get('/api/admin/students', requireRole('admin'), (req, res) => {
  const { search, hostelId, active, page, limit } = req.query;
  const qSearch = search ? search.trim().toLowerCase() : null;

  let results = db.students.filter(s => {
    if (active !== undefined && String(s.active) !== String(active)) return false;
    const curH = curEnr(s)?.hostelId;
    if (hostelId && curH !== hostelId) return false;
    if (qSearch) {
      return [s.id, s.name, s.email, s.phone, s.room || '', curH || '']
        .some(x => x.toLowerCase().includes(qSearch));
    }
    return true;
  });

  // If pagination requested
  if (limit) {
    const lim = parseInt(limit, 10);
    const pg = parseInt(page || '1', 10);
    const total = results.length;
    const paginated = results.slice((pg - 1) * lim, pg * lim);
    return res.json({ students: paginated, total, page: pg, pages: Math.ceil(total / lim) });
  }

  res.json(results);
});

// Admin: Get Student Details
app.get('/api/admin/students/:id', requireRole('admin'), (req, res) => {
  const s = db.students.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const batches = db.batches.filter(b => b.studentId === s.id);
  const complaints = db.complaints.filter(c => c.studentId === s.id);

  res.json({
    ...s,
    batches,
    complaints
  });
});

// Admin: Change Student Hostel
app.post('/api/admin/students/:id/change-hostel', requireRole('admin'), (req, res) => {
  const s = db.students.find(x => x.id === req.params.id);
  if (!s || !s.active) return res.status(404).json({ error: 'Student not found or inactive' });
  const { hostelId } = req.body;
  const h = db.hostels.find(x => x.id === hostelId);
  if (!h) return res.status(400).json({ error: 'Unknown hostel' });

  const e = curEnr(s);
  const prevHostel = e?.hostelId;
  if (e) e.status = 'Ended';

  s.enrollments.push({ semesterId: curSem().id, hostelId: h.id, status: 'Active' });
  s.gender = h.group;

  addAudit('', `Changed hostel for ${s.id} (${s.name})`, prevHostel ? hName(prevHostel) : '', h.name, req.user.name, 'admin');
  saveDb();

  res.json(s);
});

// Admin: Toggle Student Active
app.patch('/api/admin/students/:id', requireRole('admin'), (req, res) => {
  const s = db.students.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const { active } = req.body;
  s.active = !!active;

  if (!s.active) {
    s.enrollments?.forEach(e => { e.status = 'Ended'; });
  } else {
    const lastH = s.enrollments?.[s.enrollments.length - 1]?.hostelId || db.hostels[0].id;
    s.enrollments.push({ semesterId: curSem().id, hostelId: lastH, status: 'Active' });
  }

  addAudit('', `${s.active ? 'Reactivated' : 'Deactivated'} student ${s.id} (${s.name})`, '', '', req.user.name, 'admin');
  saveDb();

  res.json(s);
});

// Admin: List Staff
app.get('/api/admin/staff', requireRole('admin'), (req, res) => {
  res.json(db.staff);
});

// Admin: Add Staff
app.post('/api/admin/staff', requireRole('admin'), (req, res) => {
  const { name, email, hostelId } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Enter staff member’s name.' });
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail.endsWith('@thapar.edu')) return res.status(400).json({ error: 'Use a college email (@thapar.edu).' });
  if (db.staff.some(s => s.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: 'Staff account already exists with this email.' });
  }

  const newStaff = {
    id: `ST${db.staff.length + 1}`,
    name: name.trim(),
    email: cleanEmail,
    hostelId: hostelId || 'O',
    active: true
  };

  db.staff.push(newStaff);
  addAudit('', `Added staff member ${newStaff.name} (${hName(newStaff.hostelId)})`, '', '', req.user.name, 'admin');
  saveDb();

  res.status(201).json(newStaff);
});

// Admin: Toggle Staff Active
app.patch('/api/admin/staff/:id', requireRole('admin'), (req, res) => {
  const st = db.staff.find(x => x.id === req.params.id);
  if (!st) return res.status(404).json({ error: 'Staff member not found' });
  st.active = !!req.body.active;
  addAudit('', `${st.active ? 'Reactivated' : 'Deactivated'} staff ${st.name} (${hName(st.hostelId)})`, '', '', req.user.name, 'admin');
  saveDb();

  res.json(st);
});

// Admin: Add Hostel
app.post('/api/admin/hostels', requireRole('admin'), (req, res) => {
  const { name, group, days } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Hostel name is required.' });
  if (db.hostels.some(h => h.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Hostel already exists.' });
  }

  const newHostel = {
    id: `H_${Date.now()}`,
    name: name.trim(),
    group: group === 'Girls' ? 'Girls' : 'Boys',
    days: Array.isArray(days) && days.length === 2 ? days : [1, 5]
  };

  db.hostels.push(newHostel);
  addAudit('', `Added hostel ${newHostel.name}`, '', '', req.user.name, 'admin');
  saveDb();

  res.status(201).json(newHostel);
});

// Admin: Start Semester Rollover
app.post('/api/admin/semesters', requireRole('admin'), (req, res) => {
  const { name, start, end } = req.body;
  if (!name || !start || !end) return res.status(400).json({ error: 'Enter semester name, start and end date.' });
  if (end <= start) return res.status(400).json({ error: 'End date must be after start date.' });

  const old = curSem();
  old.current = false;

  const newSem = {
    id: `S_${Date.now()}`,
    name: name.trim(),
    start,
    end,
    current: true
  };

  db.semesters.unshift(newSem);
  let pendingCount = 0;

  db.students.filter(s => s.active).forEach(s => {
    const e = curEnr(s);
    if (!e) return;
    e.status = 'Ended';
    s.enrollments.push({ semesterId: newSem.id, hostelId: e.hostelId, status: 'Pending renewal' });
    pendingCount++;
  });

  addAudit('', `Started semester ${newSem.name}. ${pendingCount} students set to pending renewal`, old.name, newSem.name, req.user.name, 'admin');
  saveDb();

  res.json({ pending: pendingCount, semester: newSem });
});

// Admin: Bulk Approve Renewals
app.post('/api/admin/renewals/approve', requireRole('admin'), (req, res) => {
  let approved = 0;
  db.students.forEach(s => {
    s.enrollments?.forEach(e => {
      if (e.status === 'Pending renewal') {
        e.status = 'Active';
        approved++;
      }
    });
  });

  addAudit('', `Approved ${approved} semester renewals`, 'Pending renewal', 'Active', req.user.name, 'admin');
  saveDb();

  res.json({ approved });
});

// Admin: Add Clothing Category
app.post('/api/admin/categories', requireRole('admin'), (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required.' });
  if (db.categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Category already exists.' });
  }

  db.categories.push({ name: name.trim(), on: true });
  addAudit('', `Added clothing category ${name.trim()}`, '', '', req.user.name, 'admin');
  saveDb();

  res.status(201).json({ success: true, name: name.trim() });
});

// Admin: Toggle Category Active/Inactive
app.post('/api/admin/categories/:name/toggle', requireRole('admin'), (req, res) => {
  const cat = db.categories.find(c => c.name.toLowerCase() === req.params.name.toLowerCase());
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  cat.on = !cat.on;
  addAudit('', `${cat.on ? 'Restored' : 'Retired'} clothing category ${cat.name}`, '', '', req.user.name, 'admin');
  saveDb();

  res.json({ success: true, category: cat });
});

// Admin: Add Defect Condition
app.post('/api/admin/conditions', requireRole('admin'), (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Condition name is required.' });
  if (db.conditions.some(c => c.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Condition already exists.' });
  }

  db.conditions.push(name.trim());
  addAudit('', `Added condition defect option: ${name.trim()}`, '', '', req.user.name, 'admin');
  saveDb();

  res.status(201).json({ success: true, condition: name.trim() });
});

// Admin: Remove Defect Condition
app.delete('/api/admin/conditions/:name', requireRole('admin'), (req, res) => {
  const name = req.params.name;
  db.conditions = db.conditions.filter(c => c.toLowerCase() !== name.toLowerCase());
  addAudit('', `Removed condition defect option: ${name}`, '', '', req.user.name, 'admin');
  saveDb();

  res.json({ success: true });
});

// Admin: Audit Log
app.get('/api/admin/audit', requireRole('admin'), (req, res) => {
  const { search, role } = req.query;
  const qSearch = search ? search.trim().toLowerCase() : null;

  let results = db.audit.filter(e => {
    if (role && role !== 'All' && e.role?.toLowerCase() !== role.toLowerCase()) return false;
    if (qSearch) {
      return [e.batchId, e.who, e.action, e.from || '', e.to || '']
        .some(x => x.toLowerCase().includes(qSearch));
    }
    return true;
  });

  results.sort((a, b) => new Date(b.at) - new Date(a.at));
  res.json(results);
});

// Admin: Comprehensive Reports & Analytics
app.get('/api/admin/reports', requireRole('admin'), (req, res) => {
  // Volume by hostel
  const volumeByHostel = {};
  db.hostels.forEach(h => { volumeByHostel[h.id] = { name: h.name, batches: 0, pieces: 0 }; });
  db.batches.forEach(b => {
    if (volumeByHostel[b.hostelId]) {
      volumeByHostel[b.hostelId].batches++;
      const pcs = Object.values(b.items || {}).reduce((s, n) => s + n, 0);
      volumeByHostel[b.hostelId].pieces += pcs;
    }
  });

  // Garment category breakdown
  const categoryPieces = {};
  db.batches.forEach(b => {
    for (const [cat, qty] of Object.entries(b.items || {})) {
      categoryPieces[cat] = (categoryPieces[cat] || 0) + qty;
    }
  });

  // Status breakdown
  const statusCounts = {};
  db.batches.forEach(b => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  });

  // Complaint statistics
  const complaintStats = {
    total: db.complaints.length,
    open: db.complaints.filter(c => c.status === 'Open').length,
    underReview: db.complaints.filter(c => c.status === 'Under review').length,
    investigating: db.complaints.filter(c => c.status === 'Investigating').length,
    resolved: db.complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    escalated: db.complaints.filter(c => c.escalated).length,
    byType: {}
  };
  db.complaints.forEach(c => {
    complaintStats.byType[c.type] = (complaintStats.byType[c.type] || 0) + 1;
  });

  // Turnaround time average (in days)
  let tatSum = 0;
  let tatCount = 0;
  db.batches.forEach(b => {
    if (b.returnedAt && b.submittedAt) {
      const diffDays = (new Date(b.returnedAt) - new Date(b.submittedAt)) / (24 * 3600 * 1000);
      if (diffDays > 0) {
        tatSum += diffDays;
        tatCount++;
      }
    }
  });
  const avgTatDays = tatCount ? (tatSum / tatCount).toFixed(1) : 3.2;

  res.json({
    totalStudents: db.students.length,
    activeStudents: db.students.filter(s => s.active).length,
    totalBatches: db.batches.length,
    avgTatDays,
    statusCounts,
    volumeByHostel,
    categoryPieces,
    complaintStats
  });
});

// Demo Reset Endpoint
app.post('/api/demo/reset', (req, res) => {
  console.log('Resetting database to seed state...');
  db = generateSeedData();
  saveDb();
  res.json({ message: 'Database reset to initial demo state successfully', students: db.students.length });
});

// Serve frontend build if exists in production
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Hostel Laundry Backend API is running on port ${PORT}`);
  console.log(`Base URL: http://localhost:${PORT}/api`);
  console.log(`Loaded ${db.students.length} dummy students, ${db.staff.length} staff, ${db.hostels.length} hostels`);
  console.log(`=================================================`);
});
