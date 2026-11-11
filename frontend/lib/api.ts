import axios from 'axios';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Where to send the user after a 401. If the backend signed them out because their
 * PESU session expired, the login page shows a notice explaining why.
 */
export function signedOutPath(err: unknown): string {
  return axios.isAxiosError(err) && err.response?.data?.code === 'SESSION_EXPIRED' ? '/?expired=1' : '/';
}

export async function login(srn: string, password: string) {
  const res = await api.post('/api/auth/login', { srn, password });
  return res.data;
}

export async function logout() {
  const res = await api.post('/api/auth/logout');
  return res.data;
}

export async function getMe() {
  const res = await api.get('/api/auth/me');
  return res.data;
}

export async function getAttendance() {
  const res = await api.get('/api/attendance');
  return res.data;
}

export async function refreshAttendance() {
  const res = await api.post('/api/attendance/refresh');
  return res.data;
}

export async function refreshResults() {
  const res = await api.post('/api/results/refresh');
  return res.data;
}

export async function getPercentile() {
  const res = await api.get('/api/results/percentile');
  return res;
}
