import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'db.json');

const SCH = {
  B: [1, 5], H: [1, 5], O: [1, 5], F: [1, 5], I: [1, 5], Q: [1, 5],
  A: [2, 6], D: [2, 6], J: [2, 6], E: [2, 6], G: [2, 6], N: [2, 6],
  C: [3, 6], K: [3, 6], L: [3, 6], M: [3, 6], PG: [3, 6], PG2: [3, 6],
};

const BOYS_HOSTELS = ['A', 'B', 'C', 'D', 'H', 'J', 'K', 'L', 'M', 'O'];
const GIRLS_HOSTELS = ['E', 'F', 'G', 'I', 'N', 'Q', 'PG', 'PG2'];

const hostelName = (id) => (id === 'O' ? 'Hostel O (Vyom Hall)' : id.startsWith('PG') ? id : `Hostel ${id}`);

const DEFAULT_CATEGORIES = [
  'Shirts', 'T-Shirts', 'Jeans / Pants', 'Shorts', 'Pyjama',
  'Kurta / Salwar', 'Bedsheet', 'Pillow Cover', 'Towel', 'Turban / Dupatta'
];

const DEFAULT_CONDITIONS = ['Small tear', 'Faded color', 'Stain', 'Missing button', 'Other damage'];

const FIRST_NAMES_MALE = [
  'Aarav', 'Devansh', 'Kabir', 'Rohan', 'Aditya', 'Vikram', 'Nikhil', 'Karan', 'Yash', 'Rahul',
  'Aryan', 'Siddharth', 'Harsh', 'Kunal', 'Manish', 'Ayush', 'Dhruv', 'Tushar', 'Pranav', 'Gaurav',
  'Arjun', 'Varun', 'Shivam', 'Akash', 'Ritwik', 'Samarth', 'Ankit', 'Vivek', 'Kartik', 'Rishabh',
  'Deepak', 'Mayank', 'Sachin', 'Abhishek', 'Himanshu', 'Udit', 'Tanmay', 'Chirag', 'Mohit', 'Saurabh'
];

const FIRST_NAMES_FEMALE = [
  'Ishita', 'Meera', 'Tanya', 'Sneha', 'Priya', 'Simran', 'Ananya', 'Diya', 'Riya', 'Pooja',
  'Divya', 'Kavya', 'Shreya', 'Muskan', 'Khushi', 'Bhavna', 'Neha', 'Nandini', 'Aashi', 'Bhumika',
  'Avani', 'Tarini', 'Radhika', 'Kritika', 'Tanvi', 'Isha', 'Palak', 'Anushka', 'Vidhi', 'Garima',
  'Prachi', 'Sonal', 'Mansha', 'Vanshika', 'Disha', 'Jaspreet', 'Harleen', 'Navya', 'Ritika', 'Saumya'
];

const LAST_NAMES = [
  'Dhawan', 'Sharma', 'Mehta', 'Singh', 'Gupta', 'Verma', 'Nair', 'Arora', 'Bansal', 'Kapoor',
  'Malhotra', 'Joshi', 'Kaur', 'Chawla', 'Rao', 'Patel', 'Iyer', 'Bhatia', 'Chopra', 'Saxena',
  'Aggarwal', 'Mittal', 'Jain', 'Reddy', 'Bhatt', 'Pandey', 'Mishra', 'Tiwari', 'Goyal', 'Garg',
  'Sood', 'Khurana', 'Bhasin', 'Thakur', 'Chauhan', 'Narang', 'Kohli', 'Sethi', 'Bhardwaj', 'Talwar'
];

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const ago = (h) => new Date(Date.now() - h * HOUR).toISOString();

function generate500Students(hostels) {
  const students = [];
  let index = 1;

  const branches = [
    { code: 'COE', count: 250 },
    { code: 'CSBS', count: 80 },
    { code: 'ENC', count: 100 },
    { code: 'ME', count: 70 }
  ];

  for (const b of branches) {
    for (let i = 1; i <= b.count; i++) {
      const padNum = String(i).padStart(3, '0');
      const roll = `24${b.code}${padNum}`;
      const isFemale = index % 3 === 0; // ~33% female
      const firstPool = isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;

      // Ensure Devansh Dhawan is at 24COE123 for consistency with repo owner
      let first, last;
      let gender = isFemale ? 'Girls' : 'Boys';
      let chosenHostel = 'O';
      let roomNum = '';

      if (roll === '24COE123') {
        first = 'Devansh';
        last = 'Dhawan';
        gender = 'Boys';
        chosenHostel = 'O';
        roomNum = 'O-418';
      } else {
        first = firstPool[(index * 7 + i) % firstPool.length];
        last = LAST_NAMES[(index * 11 + i) % LAST_NAMES.length];
        const eligibleHostels = hostels.filter(h => h.group === gender);
        chosenHostel = eligibleHostels[(index * 13) % eligibleHostels.length].id;
        const floor = 1 + (index % 4);
        roomNum = `${chosenHostel}-${floor}${String(10 + (index % 40)).padStart(2, '0')}`;
      }

      const name = `${first} ${last}`;
      const email = `${roll.toLowerCase()}@thapar.edu`;
      const phone = `98${String(10000000 + ((index * 98765) % 89999999))}`;
      const active = index <= 495; // 5 inactive for edge testing

      const enrollments = [
        { semesterId: 'S1-2526', hostelId: chosenHostel, status: 'Ended' },
        { semesterId: 'S2-2526', hostelId: chosenHostel, status: 'Ended' },
        { semesterId: 'S1-2627', hostelId: chosenHostel, status: active ? 'Active' : 'Ended' }
      ];

      students.push({
        id: roll,
        name,
        phone,
        email,
        active,
        enrollments,
        room: roomNum,
        gender,
        hasProfile: true
      });

      index++;
    }
  }

  return students;
}

export function generateSeedData() {
  const hostels = [
    ...BOYS_HOSTELS.map(id => ({ id, name: hostelName(id), group: 'Boys', days: SCH[id] })),
    ...GIRLS_HOSTELS.map(id => ({ id, name: hostelName(id), group: 'Girls', days: SCH[id] }))
  ];

  const semesters = [
    { id: 'S1-2627', name: '2026-27 Sem 1', start: '2026-07-20', end: '2026-12-20', current: true },
    { id: 'S2-2526', name: '2025-26 Sem 2', start: '2026-01-12', end: '2026-06-20', current: false },
    { id: 'S1-2526', name: '2025-26 Sem 1', start: '2025-07-21', end: '2025-12-20', current: false }
  ];

  const categories = DEFAULT_CATEGORIES.map(name => ({ name, on: true }));
  const conditions = [...DEFAULT_CONDITIONS];

  const staff = [
    { id: 'ST1', name: 'Ramesh Kumar', email: 'ramesh.kumar@thapar.edu', hostelId: 'O', active: true },
    { id: 'ST2', name: 'Suresh Yadav', email: 'suresh.yadav@thapar.edu', hostelId: 'O', active: true },
    { id: 'ST3', name: 'Sunita Devi', email: 'sunita.devi@thapar.edu', hostelId: 'A', active: true },
    { id: 'ST4', name: 'Mohan Lal', email: 'mohan.lal@thapar.edu', hostelId: 'B', active: true },
    { id: 'ST5', name: 'Pradeep Singh', email: 'pradeep.singh@thapar.edu', hostelId: 'H', active: true },
    { id: 'ST6', name: 'Kavita Rani', email: 'kavita.rani@thapar.edu', hostelId: 'J', active: true },
    { id: 'ST7', name: 'Anita Sharma', email: 'anita.sharma@thapar.edu', hostelId: 'E', active: true },
    { id: 'ST8', name: 'Rajesh Verma', email: 'rajesh.verma@thapar.edu', hostelId: 'Q', active: true },
    { id: 'ST9', name: 'Meenakshi Sen', email: 'meenakshi.sen@thapar.edu', hostelId: 'PG', active: true }
  ];

  const admin = { id: 'AD1', name: 'Anjali Sharma', email: 'anjali.sharma@thapar.edu', role: 'admin' };

  const students = generate500Students(hostels);

  // Generate realistic batches
  const batches = [];
  const pickups = {};
  const notifications = {};
  const complaints = [];
  const audit = [];

  const statuses = [
    'WAITING_FOR_VERIFICATION',
    'AWAITING_TAGGING',
    'TAGGED',
    'IN_LAUNDRY',
    'RETURNED',
    'READY_FOR_PICKUP',
    'COLLECTED',
    'CANCELLED'
  ];

  const STATUS_LABELS = {
    WAITING_FOR_VERIFICATION: 'Waiting for verification',
    AWAITING_TAGGING: 'Awaiting tagging',
    TAGGED: 'Tagged',
    IN_LAUNDRY: 'In laundry',
    RETURNED: 'Returned',
    READY_FOR_PICKUP: 'Ready for pickup',
    COLLECTED: 'Collected',
    CANCELLED: 'Rejected'
  };

  let bNum = 1001;

  // Specific initial batches for Devansh Dhawan (24COE123)
  const devanshBatches = [
    { st: 'WAITING_FOR_VERIFICATION', count: 6, dAgo: 0.1, remark: 'Please handle the blue linen shirt with care' },
    { st: 'IN_LAUNDRY', count: 8, dAgo: 1.5, remark: '' },
    { st: 'READY_FOR_PICKUP', count: 5, dAgo: 4, code: '482915', remark: '' },
    { st: 'COLLECTED', count: 7, dAgo: 12, code: '109823', remark: '', complaint: { type: 'Missing', desc: '1 T-shirt missing from the batch. Submitted 7, received 6.' } },
    { st: 'COLLECTED', count: 6, dAgo: 24, code: '874621', remark: '', complaint: { type: 'Damaged', desc: 'Towel came back with a tear along the border.' } }
  ];

  for (const item of devanshBatches) {
    const s = students.find(x => x.id === '24COE123');
    const rid = `LR-${bNum}`;
    const hasBid = ['TAGGED', 'IN_LAUNDRY', 'RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(item.st);
    const bid = hasBid ? `L-${bNum}` : null;
    const t0 = Date.now() - item.dAgo * DAY;
    const submittedAt = new Date(t0).toISOString();
    const expectedOn = new Date(t0 + 4 * DAY).toISOString().split('T')[0];

    const items = { Shirts: 2, 'T-Shirts': 2, 'Jeans / Pants': 1, Towel: 1 };
    const original = { ...items };

    const batch = {
      rid,
      bid,
      studentId: s.id,
      studentName: s.name,
      hostelId: s.enrollments[2].hostelId,
      room: s.room,
      semesterId: 'S1-2627',
      status: item.st,
      late: false,
      submittedAt,
      expectedOn,
      returnedAt: ['RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(item.st) ? new Date(t0 + 3 * DAY).toISOString() : null,
      items,
      original,
      conditions: item.st === 'IN_LAUNDRY' ? [{ c: 'Shirts', k: 'Small tear' }] : [],
      remark: item.remark || '',
      log: [],
      complaintId: null
    };

    // Add log entries
    batch.log.push({ t: submittedAt, who: s.name, role: 'student', a: 'Submitted request', to: STATUS_LABELS.WAITING_FOR_VERIFICATION });
    if (['AWAITING_TAGGING', 'TAGGED', 'IN_LAUNDRY', 'RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(item.st)) {
      batch.log.push({ t: new Date(t0 + 2 * HOUR).toISOString(), who: 'Ramesh Kumar', role: 'staff', a: 'Verified physical count, no changes', from: STATUS_LABELS.WAITING_FOR_VERIFICATION, to: STATUS_LABELS.AWAITING_TAGGING });
      if (bid) {
        batch.log.push({ t: new Date(t0 + 2.5 * HOUR).toISOString(), who: 'Ramesh Kumar', role: 'staff', a: `Generated batch ID ${bid}` });
      }
    }
    if (['TAGGED', 'IN_LAUNDRY', 'RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(item.st)) {
      batch.log.push({ t: new Date(t0 + 3 * HOUR).toISOString(), who: 'Ramesh Kumar', role: 'staff', a: 'Tag applied', from: STATUS_LABELS.AWAITING_TAGGING, to: STATUS_LABELS.TAGGED });
    }
    if (['IN_LAUNDRY', 'RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(item.st)) {
      batch.log.push({ t: new Date(t0 + 6 * HOUR).toISOString(), who: 'Ramesh Kumar', role: 'staff', a: 'Sent to laundry', from: STATUS_LABELS.TAGGED, to: STATUS_LABELS.IN_LAUNDRY });
    }
    if (['RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(item.st)) {
      batch.log.push({ t: new Date(t0 + 72 * HOUR).toISOString(), who: 'Ramesh Kumar', role: 'staff', a: 'Marked returned', from: STATUS_LABELS.IN_LAUNDRY, to: STATUS_LABELS.RETURNED });
    }
    if (['READY_FOR_PICKUP', 'COLLECTED'].includes(item.st)) {
      batch.log.push({ t: new Date(t0 + 74 * HOUR).toISOString(), who: 'Ramesh Kumar', role: 'staff', a: 'Marked ready for pickup. QR activated', from: STATUS_LABELS.RETURNED, to: STATUS_LABELS.READY_FOR_PICKUP });
      const pToken = `hlp_${Math.random().toString(36).substring(2)}${Date.now()}`;
      pickups[rid] = { token: pToken, code: item.code || '482915', used: item.st === 'COLLECTED' };
      batch.tokenActive = item.st === 'READY_FOR_PICKUP';
      batch.tokenUsed = item.st === 'COLLECTED';
    }
    if (item.st === 'COLLECTED') {
      batch.log.push({ t: new Date(t0 + 76 * HOUR).toISOString(), who: 'Ramesh Kumar', role: 'staff', a: 'Collection confirmed. QR token used', from: STATUS_LABELS.READY_FOR_PICKUP, to: STATUS_LABELS.COLLECTED });
    }

    if (item.complaint) {
      const cId = `C-${complaints.length + 10}`;
      batch.complaintId = cId;
      complaints.push({
        id: cId,
        batchId: bid || rid,
        studentId: s.id,
        studentName: s.name,
        hostelId: batch.hostelId,
        type: item.complaint.type,
        status: 'Investigating',
        escalated: false,
        filedAt: new Date(t0 + 78 * HOUR).toISOString(),
        description: item.complaint.desc,
        notes: [
          { t: new Date(t0 + 79 * HOUR).toISOString(), who: 'Ramesh Kumar', role: 'staff', a: 'Noted complaint, inspecting laundry facility log' }
        ]
      });
    }

    batches.push(batch);
    bNum++;
  }

  // Generate 120 more batches across other students
  const sampleStudents = students.slice(1, 100);
  for (let idx = 0; idx < sampleStudents.length; idx++) {
    const s = sampleStudents[idx];
    const stIndex = idx % statuses.length;
    const st = statuses[stIndex];
    const rid = `LR-${bNum}`;
    const hasBid = ['TAGGED', 'IN_LAUNDRY', 'RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(st);
    const bid = hasBid ? `L-${bNum}` : null;
    const dAgo = (idx % 15) * 1.5 + 0.2;
    const t0 = Date.now() - dAgo * DAY;
    const submittedAt = new Date(t0).toISOString();
    const curHostel = s.enrollments[2].hostelId;
    const expectedOn = new Date(t0 + 4 * DAY).toISOString().split('T')[0];

    const pieces = 3 + (idx % 8);
    const items = {
      Shirts: Math.ceil(pieces / 2),
      ...(pieces > 2 ? { 'T-Shirts': Math.floor(pieces / 2) } : { Towel: 1 })
    };
    const original = { ...items };

    const batch = {
      rid,
      bid,
      studentId: s.id,
      studentName: s.name,
      hostelId: curHostel,
      room: s.room,
      semesterId: 'S1-2627',
      status: st,
      late: st === 'IN_LAUNDRY' && idx % 3 === 0,
      submittedAt,
      expectedOn,
      returnedAt: ['RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(st) ? new Date(t0 + 3 * DAY).toISOString() : null,
      items,
      original,
      conditions: (idx % 4 === 0) ? [{ c: 'Shirts', k: 'Faded color' }] : [],
      remark: (idx % 5 === 0) ? 'Handle carefully' : '',
      log: [],
      complaintId: null
    };

    batch.log.push({ t: submittedAt, who: s.name, role: 'student', a: 'Submitted request', to: STATUS_LABELS.WAITING_FOR_VERIFICATION });

    if (['AWAITING_TAGGING', 'TAGGED', 'IN_LAUNDRY', 'RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(st)) {
      batch.log.push({ t: new Date(t0 + 1.5 * HOUR).toISOString(), who: 'Counter staff', role: 'staff', a: 'Verified physical count', from: STATUS_LABELS.WAITING_FOR_VERIFICATION, to: STATUS_LABELS.AWAITING_TAGGING });
      if (bid) {
        batch.log.push({ t: new Date(t0 + 2 * HOUR).toISOString(), who: 'Counter staff', role: 'staff', a: `Generated batch ID ${bid}` });
      }
    }
    if (['TAGGED', 'IN_LAUNDRY', 'RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(st)) {
      batch.log.push({ t: new Date(t0 + 2.5 * HOUR).toISOString(), who: 'Counter staff', role: 'staff', a: 'Tag applied', from: STATUS_LABELS.AWAITING_TAGGING, to: STATUS_LABELS.TAGGED });
    }
    if (['IN_LAUNDRY', 'RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(st)) {
      batch.log.push({ t: new Date(t0 + 5 * HOUR).toISOString(), who: 'Counter staff', role: 'staff', a: 'Sent to laundry', from: STATUS_LABELS.TAGGED, to: STATUS_LABELS.IN_LAUNDRY });
    }
    if (['RETURNED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(st)) {
      batch.log.push({ t: new Date(t0 + 70 * HOUR).toISOString(), who: 'Counter staff', role: 'staff', a: 'Marked returned', from: STATUS_LABELS.IN_LAUNDRY, to: STATUS_LABELS.RETURNED });
    }
    if (['READY_FOR_PICKUP', 'COLLECTED'].includes(st)) {
      batch.log.push({ t: new Date(t0 + 72 * HOUR).toISOString(), who: 'Counter staff', role: 'staff', a: 'Marked ready for pickup. QR activated', from: STATUS_LABELS.RETURNED, to: STATUS_LABELS.READY_FOR_PICKUP });
      const code = String(100000 + ((idx * 8921) % 899999));
      pickups[rid] = { token: `hlp_${idx}_${Date.now()}`, code, used: st === 'COLLECTED' };
      batch.tokenActive = st === 'READY_FOR_PICKUP';
      batch.tokenUsed = st === 'COLLECTED';
    }
    if (st === 'COLLECTED') {
      batch.log.push({ t: new Date(t0 + 74 * HOUR).toISOString(), who: 'Counter staff', role: 'staff', a: 'Collection confirmed. QR token used', from: STATUS_LABELS.READY_FOR_PICKUP, to: STATUS_LABELS.COLLECTED });
    }
    if (st === 'CANCELLED') {
      batch.log.push({ t: new Date(t0 + 1 * HOUR).toISOString(), who: 'Counter staff', role: 'staff', a: 'Rejected at verification: Mud stained and unwashed prior', from: STATUS_LABELS.WAITING_FOR_VERIFICATION, to: STATUS_LABELS.CANCELLED });
    }

    if (idx % 4 === 0) {
      const cTypes = ['Missing', 'Damaged', 'Delay', 'Wrong item', 'Incorrect quantity'];
      const cStatuses = ['Open', 'Under review', 'Investigating', 'Resolved', 'Closed'];
      const cId = `C-${complaints.length + 10}`;
      batch.complaintId = cId;
      const cType = cTypes[idx % cTypes.length];
      const cStatus = cStatuses[idx % cStatuses.length];
      const isEscalated = idx % 6 === 0;

      complaints.push({
        id: cId,
        batchId: bid || rid,
        studentId: s.id,
        studentName: s.name,
        hostelId: batch.hostelId,
        type: cType,
        status: cStatus,
        escalated: isEscalated,
        filedAt: new Date(t0 + 20 * HOUR).toISOString(),
        description: `${cType} issue reported for laundry items in ${bid || rid}. Please investigate and provide an update.`,
        notes: [
          { t: new Date(t0 + 22 * HOUR).toISOString(), who: 'Counter Staff', role: 'staff', a: `Complaint logged as ${cStatus}. Initial inspection in progress.` },
          ...(isEscalated ? [{ t: new Date(t0 + 24 * HOUR).toISOString(), who: 'Counter Staff', role: 'staff', a: 'Escalated to central admin for policy decision' }] : []),
          ...(cStatus === 'Resolved' || cStatus === 'Closed' ? [{ t: new Date(t0 + 30 * HOUR).toISOString(), who: 'Anjali Sharma', role: 'admin', a: 'Issue resolved with student confirmation' }] : [])
        ]
      });
    }

    batches.push(batch);
    bNum++;
  }

  // Notifications for Devansh
  notifications['24COE123'] = [
    { id: 'n1', title: 'Laundry ready for pickup', body: 'Batch L-1003 is ready at the Hostel O counter', at: ago(2), read: false },
    { id: 'n2', title: 'Laundry processing started', body: 'Batch L-1002 entered the wash cycle', at: ago(36), read: false },
    { id: 'n3', title: 'Complaint update', body: 'Your complaint on L-1004 is being investigated', at: ago(72), read: true },
    { id: 'n4', title: 'Laundry schedule notice', body: 'Hostel O drop-off timings today are 12:30 PM - 3:00 PM and 4:00 PM - 7:00 PM', at: ago(120), read: true }
  ];

  // Build audit logs from batch logs, complaints, and admin actions
  for (const b of batches) {
    for (const l of b.log) {
      audit.push({
        id: `aud_${Math.random().toString(36).substring(2)}`,
        at: l.t,
        batchId: b.bid || b.rid,
        who: l.who,
        role: l.role || 'staff',
        action: l.a,
        from: l.from,
        to: l.to
      });
    }
  }

  for (const c of complaints) {
    audit.push({
      id: `aud_${Math.random().toString(36).substring(2)}`,
      at: c.filedAt,
      batchId: c.batchId,
      who: c.studentName,
      role: 'student',
      action: `Complaint ${c.id} filed: ${c.type}`
    });
    for (const n of c.notes) {
      audit.push({
        id: `aud_${Math.random().toString(36).substring(2)}`,
        at: n.t,
        batchId: c.batchId,
        who: n.who,
        role: n.role || 'staff',
        action: `Complaint ${c.id}: ${n.a.substring(0, 50)}`
      });
    }
  }

  audit.push(
    { id: 'aud_adm_1', at: ago(24 * 3), batchId: '', who: 'Anjali Sharma', role: 'admin', action: 'Approved 25 semester enrollment renewals' },
    { id: 'aud_adm_2', at: ago(24 * 5), batchId: '', who: 'Anjali Sharma', role: 'admin', action: 'Added staff Rajesh Verma (Hostel Q)' },
    { id: 'aud_adm_3', at: ago(24 * 8), batchId: '', who: 'Anjali Sharma', role: 'admin', action: 'Added clothing category Turban / Dupatta' }
  );

  audit.sort((a, b) => new Date(b.at) - new Date(a.at));

  // Sort batches by submittedAt newest first
  batches.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return {
    hostels,
    semesters,
    categories,
    conditions,
    students,
    staff,
    admin,
    batches,
    pickups,
    complaints,
    notifications,
    audit
  };
}

export function runSeed() {
  const data = generateSeedData();
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Database seeded successfully!`);
  console.log(`Total Students: ${data.students.length}`);
  console.log(`Total Staff: ${data.staff.length}`);
  console.log(`Total Hostels: ${data.hostels.length}`);
  console.log(`Total Batches: ${data.batches.length}`);
  console.log(`Total Complaints: ${data.complaints.length}`);
  console.log(`Total Audit entries: ${data.audit.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed();
}
