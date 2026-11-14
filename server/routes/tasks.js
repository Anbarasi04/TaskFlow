import { Router } from 'express';
import Task, { STATUSES, PRIORITIES } from '../models/Task.js';
import { protect, loadProject } from '../middleware/auth.js';
import { wrap, fail, notify, escapeRegex, startOfToday } from '../utils.js';
const r = Router();
r.use(protect);

const populate = [{ path: 'assignee', select: 'name email' }, { path: 'comments.user', select: 'name' }];
const parseDate = (v) => {
  if (v === null || v === '') return null;
  const d = new Date(v);
  if (isNaN(d)) fail(400, 'Invalid due date');
  return d;
};
const checkAssignee = (project, id) => {
  if (id && !project.members.some((m) => m.user.equals(id))) fail(400, 'Assignee must be a project member');
};
const taskAndProject = async (id, user, min) => {
  const task = await Task.findById(id);
  if (!task) fail(404, 'Task not found');
  const ctx = await loadProject(task.project, user, min);
  return { task, ...ctx };
};

r.get('/projects/:projectId/tasks', wrap(async (req, res) => {
  const { project } = await loadProject(req.params.projectId, req.user);
  const { search, status, priority, assignee, overdue, page, limit } = req.query;
  const q = { project: project._id };
  if (status) { if (!STATUSES.includes(status)) fail(400, 'Invalid status'); q.status = status; }
  if (priority) { if (!PRIORITIES.includes(priority)) fail(400, 'Invalid priority'); q.priority = priority; }
  if (assignee) q.assignee = assignee === 'me' ? req.user._id : assignee === 'none' ? null : assignee;
  if (search) { const rx = new RegExp(escapeRegex(String(search).slice(0, 60)), 'i'); q.$or = [{ title: rx }, { description: rx }]; }
  if (overdue === 'true') { q.dueDate = { $lt: startOfToday() }; q.status = q.status && q.status !== 'done' ? q.status : { $ne: 'done' }; }
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(200, Math.max(1, parseInt(limit) || 20));
  const [tasks, total] = await Promise.all([
    Task.find(q).select('-comments').sort('-createdAt').skip((p - 1) * l).limit(l).populate('assignee', 'name email'),
    Task.countDocuments(q),
  ]);
  res.json({ tasks, total, page: p, pages: Math.max(1, Math.ceil(total / l)) });
}));

r.get('/getMyTasks', async (req, res) => {
  try {
    const tasks = await Task.find({
      assignee: req.user._id,
    })
      .populate('project', 'name')
      .sort({ dueDate: 1 });

    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch your tasks',
    });
  }
});

r.post('/projects/:projectId/tasks', wrap(async (req, res) => {
  const { project } = await loadProject(req.params.projectId, req.user, 'member');
  const { title, description, priority, status, assignee, dueDate } = req.body || {};
  checkAssignee(project, assignee);
  const task = await Task.create({ project: project._id, title, description, priority, status, assignee: assignee || null, dueDate: dueDate ? parseDate(dueDate) : null, createdBy: req.user._id });
  if (assignee && !req.user._id.equals(assignee)) notify(assignee, `${req.user.name} assigned you "${task.title}"`, `/projects/${project._id}`);
  await task.populate(populate);
  res.status(201).json({ task });
}));

r.get('/tasks/:id', wrap(async (req, res) => {
  const { task } = await taskAndProject(req.params.id, req.user, 'viewer');
  await task.populate(populate);
  res.json({ task });
}));

r.put('/tasks/:id', wrap(async (req, res) => {
  const { task, project } = await taskAndProject(req.params.id, req.user, 'member');
  const b = req.body || {};
  const prevAssignee = task.assignee?.toString();
  for (const k of ['title', 'description', 'priority', 'status']) if (b[k] !== undefined) task[k] = b[k];
  if (b.assignee !== undefined) { checkAssignee(project, b.assignee); task.assignee = b.assignee || null; }
  if (b.dueDate !== undefined) task.dueDate = parseDate(b.dueDate);
  await task.save();
  if (task.assignee && task.assignee.toString() !== prevAssignee && !req.user._id.equals(task.assignee))
    notify(task.assignee, `${req.user.name} assigned you "${task.title}"`, `/projects/${project._id}`);
  await task.populate(populate);
  res.json({ task });
}));

r.patch('/tasks/:id/status', wrap(async (req, res) => {
  const { task } = await taskAndProject(req.params.id, req.user, 'member');
  if (!STATUSES.includes(req.body?.status)) fail(400, 'Invalid status');
  task.status = req.body.status;
  await task.save();
  res.json({ task });
}));

r.delete('/tasks/:id', wrap(async (req, res) => {
  const { task, role } = await taskAndProject(req.params.id, req.user, 'member');
  if (role !== 'admin' && !task.createdBy.equals(req.user._id)) fail(403, 'Only admins or the creator can delete this task');
  await task.deleteOne();
  res.json({ message: 'Task deleted' });
}));

r.post('/tasks/:id/comments', wrap(async (req, res) => {
  const { task, project } = await taskAndProject(req.params.id, req.user, 'member');
  const text = String(req.body?.text || '').trim();
  if (!text) fail(400, 'Comment cannot be empty');
  task.comments.push({ user: req.user._id, text });
  await task.save();
  if (task.assignee && !req.user._id.equals(task.assignee)) notify(task.assignee, `${req.user.name} commented on "${task.title}"`, `/projects/${project._id}`);
  await task.populate(populate);
  res.status(201).json({ task });
}));
export default r;
