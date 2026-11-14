import { Router } from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';
import { wrap, startOfToday } from '../utils.js';
const r = Router();
r.get('/', protect, wrap(async (req, res) => {
  const ids = (await Project.find({ 'members.user': req.user._id }).select('_id')).map((p) => p._id);
  const base = { project: { $in: ids } };
  const today = startOfToday();
  const week = new Date(+today + 7 * 864e5);
  const open = { $ne: 'done' };
  const [grouped, overdue, mine, dueSoon] = await Promise.all([
    Task.aggregate([{ $match: base }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Task.find({ ...base, status: open, dueDate: { $lt: today } }).select('-comments').sort('dueDate').limit(10).populate('project', 'name').populate('assignee', 'name'),
    Task.countDocuments({ ...base, assignee: req.user._id, status: open }),
    Task.countDocuments({ ...base, status: open, dueDate: { $gte: today, $lt: week } }),
  ]);
  const counts = { todo: 0, in_progress: 0, done: 0 };
  grouped.forEach((g) => { counts[g._id] = g.n; });
  const total = counts.todo + counts.in_progress + counts.done;
  res.json({ projects: ids.length, counts, total, progress: total ? Math.round((counts.done / total) * 100) : 0, mine, dueSoon, overdue });
}));
export default r;
