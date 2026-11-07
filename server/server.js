import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import auth from './routes/auth.js';
import projects from './routes/projects.js';
import tasks from './routes/tasks.js';
import dashboard from './routes/dashboard.js';
import notifications from './routes/notifications.js';

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) { console.error('Set MONGO_URI and JWT_SECRET in .env'); process.exit(1); }

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { message: 'Too many attempts, try again later' } }), auth);
app.use('/api/projects', projects);
app.use('/api', tasks);
app.use('/api/dashboard', dashboard);
app.use('/api/notifications', notifications);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  let status = err.status || 500, message = err.message;
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  else if (err.name === 'CastError') { status = 400; message = `Invalid ${err.path || 'id'}`; }
  else if (err.code === 11000) { status = 409; message = 'Already exists'; }
  else if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON'; }
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Server error' : message });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('API ready')))
  .catch((e) => { console.error('DB connection failed', e.message); process.exit(1); });
