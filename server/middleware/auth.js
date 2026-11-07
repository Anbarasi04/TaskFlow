import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { wrap, fail } from '../utils.js';

export const protect = wrap(async (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) fail(401, 'Not authenticated');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { fail(401, 'Session expired, please log in again'); }
  const user = await User.findById(payload.id);
  if (!user) fail(401, 'User no longer exists');
  req.user = user;
  next();
});

const rank = { viewer: 1, member: 2, admin: 3 };
// Loads a project and verifies the user has at least the given role in it.
export const loadProject = async (projectId, user, min = 'viewer') => {
  const project = await Project.findById(projectId);
  if (!project) fail(404, 'Project not found');
  const m = project.members.find((x) => x.user.equals(user._id));
  if (!m) fail(403, 'You are not a member of this project');
  if (rank[m.role] < rank[min]) fail(403, `This action needs the ${min} role`);
  return { project, role: m.role };
};
