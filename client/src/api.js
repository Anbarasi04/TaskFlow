
const API_URL = import.meta.env.VITE_API_URL;

export const api = async (path, { method = 'GET', body } = {}) => {
  const token = localStorage.getItem('token');

  let res;

  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('logout'));
  }

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const qs = (o) =>
  new URLSearchParams(
    Object.entries(o).filter(([, v]) => v !== '' && v != null && v !== false)
  ).toString();

export const isOverdue = (t) =>
  t.status !== 'done' &&
  t.dueDate &&
  new Date(t.dueDate) < new Date(new Date().toDateString());

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      })
    : '';
