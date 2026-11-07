import mongoose from 'mongoose';
const { Schema } = mongoose;
export const STATUSES = ['todo', 'in_progress', 'done'];
export const PRIORITIES = ['low', 'medium', 'high'];
const s = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: [120, 'Title too long'] },
  description: { type: String, trim: true, maxlength: [2000, 'Description too long'], default: '' },
  status: { type: String, enum: STATUSES, default: 'todo' },
  priority: { type: String, enum: PRIORITIES, default: 'medium' },
  assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, default: null },
  comments: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, text: { type: String, required: true, trim: true, maxlength: 1000 }, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true });
s.index({ project: 1, status: 1 });
export default mongoose.model('Task', s);
