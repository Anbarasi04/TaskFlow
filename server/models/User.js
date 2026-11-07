import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const s = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [50, 'Name too long'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters'], select: false },
}, { timestamps: true });
s.pre('save', async function () { if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10); });
s.methods.matches = function (p) { return bcrypt.compare(p, this.password); };
export default mongoose.model('User', s);
