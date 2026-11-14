import { Router } from 'express';
import Project, { ROLES } from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect, loadProject } from '../middleware/auth.js';
import { wrap, fail, notify } from '../utils.js';
const r = Router();
r.use(protect);

r.get('/', wrap(async (req, res) => {
  const projects = await Project.find({ 'members.user': req.user._id }).sort('-updatedAt').populate('members.user', 'name email');
  res.json({ projects });
}));

r.post('/', wrap(async (req, res) => {
  const { name, description } = req.body || {};
  const p = await Project.create({ name, description, owner: req.user._id, members: [{ user: req.user._id, role: 'admin' }] });
  res.status(201).json({ project: p });
}));

r.get('/:id', wrap(async (req, res) => {
  const { project, role } = await loadProject(req.params.id, req.user);
  await project.populate('members.user', 'name email');
  res.json({ project, role });
}));

r.put('/:id', wrap(async (req, res) => {
  const { project } = await loadProject(req.params.id, req.user, 'admin');
  if (req.body.name !== undefined) project.name = req.body.name;
  if (req.body.description !== undefined) project.description = req.body.description;
  await project.save();
  res.json({ project });
}));

r.delete('/:id', wrap(async (req, res) => {
  const { project } = await loadProject(req.params.id, req.user, 'admin');
  if (!project.owner.equals(req.user._id)) fail(403, 'Only the project owner can delete it');
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();
  res.json({ message: 'Project deleted' });
}));

r.post('/:id/members', wrap(async (req, res) => {
  const { project } = await loadProject(req.params.id, req.user, 'admin');
  const { email, role = 'member' } = req.body || {};
  if (!ROLES.includes(role)) fail(400, 'Invalid role');
  const u = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!u) fail(404, 'No registered user with that email');
  if (project.members.some((m) => m.user.equals(u._id))) fail(409, 'Already a member');
  project.members.push({ user: u._id, role });
  await project.save();
  notify(u._id, `${req.user.name} added you to "${project.name}"`, `/projects/${project._id}`);
  await project.populate('members.user', 'name email');
  res.status(201).json({ project });
}));

r.patch('/:id/members/:userId', wrap(async (req, res) => {
  const { project } = await loadProject(req.params.id, req.user, 'admin');
  if (!ROLES.includes(req.body.role)) fail(400, 'Invalid role');
  if (project.owner.equals(req.params.userId)) fail(400, "The owner's role can't be changed");
  const m = project.members.find((x) => x.user.equals(req.params.userId));
  if (!m) fail(404, 'Member not found');
  m.role = req.body.role;
  await project.save();
  await project.populate('members.user', 'name email');
  res.json({ project });
}));

r.delete('/:id/members/:userId', wrap(async (req, res) => {
  const { project, role } = await loadProject(req.params.id, req.user);
  const self = req.user._id.equals(req.params.userId);
  if (!self && role !== 'admin') fail(403, 'Only admins can remove members');
  if (project.owner.equals(req.params.userId)) fail(400, 'The owner cannot be removed');
  const before = project.members.length;
  project.members = project.members.filter((m) => !m.user.equals(req.params.userId));
  if (project.members.length === before) fail(404, 'Member not found');
  await project.save();
  await Task.updateMany({ project: project._id, assignee: req.params.userId }, { assignee: null });
  res.json({ message: 'Member removed' });
}));
export default r;
