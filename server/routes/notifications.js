import { Router } from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { wrap } from '../utils.js';
const r = Router();
r.use(protect);
r.get('/', wrap(async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(30),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ items, unread });
}));
r.patch('/read-all', wrap(async (req, res) => { await Notification.updateMany({ user: req.user._id, read: false }, { read: true }); res.json({ ok: true }); }));
r.patch('/:id/read', wrap(async (req, res) => { await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true }); res.json({ ok: true }); }));
export default r;
