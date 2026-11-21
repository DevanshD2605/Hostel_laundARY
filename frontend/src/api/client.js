const BASE = '/api';

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

let authToken = localStorage.getItem('hl_auth_token') || null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('hl_auth_token', token);
  } else {
    localStorage.removeItem('hl_auth_token');
  }
};

export const getAuthToken = () => authToken;

async function request(method, path, body = undefined, query = undefined) {
  let url = `${BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, String(v));
      }
    }
    const qStr = params.toString();
    if (qStr) url += `?${qStr}`;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  };

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    throw new ApiError('Unable to connect to the backend server. Please verify it is running on port 5000.', 0);
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError(data?.error || data?.message || `Request failed with status ${res.status}`, res.status);
  }

  return data;
}

export const api = {
  auth: {
    sendOtp: (email) => request('POST', '/auth/send-otp', { email }),
    verifyOtp: async (email, otp) => {
      const res = await request('POST', '/auth/verify-otp', { email, otp, token: otp });
      const t = res.token || res.access_token || res.session?.access_token;
      if (t) setAuthToken(t);
      return res;
    }
  },

  me: () => request('GET', '/me'),
  saveProfile: (p) => request('PUT', '/me/profile', p),
  renewEnrollment: () => request('POST', '/me/renew'),
  config: () => request('GET', '/config'),

  // Batches
  listBatches: (q) => request('GET', '/batches', undefined, q),
  getBatch: (id) => request('GET', `/batches/${encodeURIComponent(id)}`),
  submitRequest: (items, remark) => request('POST', '/batches', { items, remark }),
  verifyRequest: (rid, data) => request('POST', `/batches/${encodeURIComponent(rid)}/verify`, data),
  rejectRequest: (rid, reason) => request('POST', `/batches/${encodeURIComponent(rid)}/reject`, { reason }),
  generateBatchId: (rid) => request('POST', `/batches/${encodeURIComponent(rid)}/batch-id`),
  transition: (ids, to) => request('POST', '/batches/transition', { ids, to }),
  sendDelayNotice: (rid) => request('POST', `/batches/${encodeURIComponent(rid)}/delay-notice`),
  getPickup: (rid) => request('GET', `/batches/${encodeURIComponent(rid)}/pickup`),
  lookupPickup: (code) => request('POST', '/pickup/lookup', { code }),
  confirmCollection: (rid) => request('POST', '/pickup/confirm', { rid }),

  // Complaints
  listComplaints: () => request('GET', '/complaints'),
  getComplaint: (id) => request('GET', `/complaints/${encodeURIComponent(id)}`),
  createComplaint: (data) => request('POST', '/complaints', data),
  addComplaintNote: (id, text) => request('POST', `/complaints/${encodeURIComponent(id)}/notes`, { text }),
  advanceComplaint: (id, note) => request('POST', `/complaints/${encodeURIComponent(id)}/advance`, { note }),
  escalateComplaint: (id) => request('POST', `/complaints/${encodeURIComponent(id)}/escalate`),
  sendBackComplaint: (id) => request('POST', `/complaints/${encodeURIComponent(id)}/send-back`),

  // Notifications
  listNotifications: () => request('GET', '/notifications'),
  markAllRead: () => request('POST', '/notifications/read-all'),

  // Admin
  listStudents: (q) => request('GET', '/admin/students', undefined, q),
  getStudent: (id) => request('GET', `/admin/students/${encodeURIComponent(id)}`),
  changeHostel: (id, hostelId) => request('POST', `/admin/students/${encodeURIComponent(id)}/change-hostel`, { hostelId }),
  setStudentActive: (id, active) => request('PATCH', `/admin/students/${encodeURIComponent(id)}`, { active }),
  listStaff: () => request('GET', '/admin/staff'),
  addStaff: (data) => request('POST', '/admin/staff', data),
  setStaffActive: (id, active) => request('PATCH', `/admin/staff/${encodeURIComponent(id)}`, { active }),
  addHostel: (data) => request('POST', '/admin/hostels', data),
  startSemester: (data) => request('POST', '/admin/semesters', data),
  approveRenewals: () => request('POST', '/admin/renewals/approve'),
  addCategory: (name) => request('POST', '/admin/categories', { name }),
  toggleCategory: (name) => request('POST', `/admin/categories/${encodeURIComponent(name)}/toggle`),
  addCondition: (name) => request('POST', '/admin/conditions', { name }),
  removeCondition: (name) => request('DELETE', `/admin/conditions/${encodeURIComponent(name)}`),
  listAudit: (q) => request('GET', '/admin/audit', undefined, q),
  getReports: () => request('GET', '/admin/reports'),

  // Demo helpers
  getDemoUsers: () => request('GET', '/demo/users'),
  resetDemo: () => request('POST', '/demo/reset')
};
