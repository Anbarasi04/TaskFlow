import mongoose from 'mongoose';
const { Schema } = mongoose;
export const ROLES = ['admin', 'member', 'viewer'];
export default mongoose.model('Project', new Schema({
  name: { type: String, required: [true, 'Project name is required'], trim: true, maxlength: [80, 'Name too long'] },
  description: { type: String, trim: true, maxlength: [500, 'Description too long'], default: '' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ _id: false, user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, role: { type: String, enum: ROLES, default: 'member' } }],
}, { timestamps: true }));
