import Notification from './models/Notification.js';
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
export const notify = (user, message, link = '') =>
  Notification.create({ user, message, link }).catch(() => {}); // never block a request on a notification
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
