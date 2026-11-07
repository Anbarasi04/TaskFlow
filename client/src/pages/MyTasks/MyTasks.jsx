
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  FolderKanban,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

import { api } from '../../api';
import './MyTasks.css';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Completed',
};

const formatDate = (date) => {
  if (!date) return 'No due date';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return 'No due date';

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const isOverdue = (task) => {
  if (!task.dueDate || task.status === 'done') return false;

  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due < today;
};

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [project, setProject] = useState('all');
  const [sort, setSort] = useState('asc');

  const fetchTasks = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api('/getMyTasks');
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err) {
      setError(err.message || 'Unable to load your tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const projects = useMemo(() => {
    const uniqueProjects = new Map();

    tasks.forEach((task) => {
      const p = task.project;

      if (p?._id) {
        uniqueProjects.set(p._id, p.name || 'Untitled project');
      }
    });

    return Array.from(uniqueProjects, ([id, name]) => ({
      id,
      name,
    }));
  }, [tasks]);

  const counts = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((task) =>
        `${task.title || ''} ${task.description || ''} ${task.project?.name || ''}`
          .toLowerCase()
          .includes(query)
      );
    }

    if (status !== 'all') {
      result = result.filter((task) => task.status === status);
    }

    if (priority !== 'all') {
      result = result.filter((task) => task.priority === priority);
    }

    if (project !== 'all') {
      result = result.filter((task) => task.project?._id === project);
    }

    result.sort((a, b) => {
      const dateA = a.dueDate
        ? new Date(a.dueDate).getTime()
        : Number.MAX_SAFE_INTEGER;

      const dateB = b.dueDate
        ? new Date(b.dueDate).getTime()
        : Number.MAX_SAFE_INTEGER;

      return sort === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [tasks, search, status, priority, project, sort]);

  return (
    <main className="mytasks-page">
      <div className="mytasks-container">

        <header className="mytasks-header">
          <div>
            <span className="mytasks-eyebrow">WORKSPACE</span>
            <h1>My Tasks</h1>
            <p>Stay organized and keep track of your work.</p>
          </div>

          <button
            className="mytasks-refresh"
            onClick={fetchTasks}
            disabled={loading}
            type="button"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {/* Summary cards */}
        <section className="mytasks-stats">
          <StatCard
            label="Total Tasks"
            value={counts.total}
            icon={<ListTodo />}
            color="purple"
          />
          <StatCard
            label="To Do"
            value={counts.todo}
            icon={<Clock />}
            color="blue"
          />
          <StatCard
            label="In Progress"
            value={counts.inProgress}
            icon={<AlertCircle />}
            color="orange"
          />
          <StatCard
            label="Completed"
            value={counts.completed}
            icon={<CheckCircle2 />}
            color="green"
          />
          <StatCard
            label="Overdue"
            value={counts.overdue}
            icon={<CalendarDays />}
            color="red"
          />
        </section>

        {/* Filters */}
        <section className="mytasks-toolbar">
          <div className="mytasks-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search tasks or projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label="Filter by priority"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            aria-label="Filter by project"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            className="mytasks-sort"
            type="button"
            onClick={() => setSort((s) => s === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown size={16} />
            Due date {sort === 'asc' ? '↑' : '↓'}
          </button>
        </section>

        {/* Task list */}
        <section className="mytasks-list-section">
          <div className="mytasks-list-header">
            <div>
              <h2>Your tasks</h2>
              <p>{filteredTasks.length} tasks found</p>
            </div>
          </div>

          {loading ? (
            <div className="mytasks-state">
              <div className="mytasks-spinner" />
              <p>Loading your tasks...</p>
            </div>
          ) : error ? (
            <div className="mytasks-state mytasks-error">
              <AlertCircle size={30} />
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button onClick={fetchTasks} type="button">
                Try again
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="mytasks-state">
              <div className="mytasks-empty-icon">
                <ListTodo size={30} />
              </div>
              <h3>No tasks found</h3>
              <p>
                {tasks.length === 0
                  ? 'Tasks assigned to you will appear here.'
                  : 'Try changing your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="mytasks-grid">
              {filteredTasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="mytasks-stat-card">
      <div className={`mytasks-stat-icon ${color}`}>
        {icon}
      </div>
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

function TaskCard({ task }) {
  const overdue = isOverdue(task);

  return (
    <article className="mytasks-task-card">
      <div className="mytasks-task-top">
        <span className={`mytasks-status ${task.status}`}>
          {statusLabels[task.status] || task.status}
        </span>

        <span className={`mytasks-priority ${task.priority}`}>
          {task.priority || 'Medium'} priority
        </span>
      </div>

      <h3>{task.title}</h3>

      <p className="mytasks-description">
        {task.description || 'No description provided.'}
      </p>

      <div className="mytasks-project">
        <FolderKanban size={15} />
        <span>{task.project?.name || 'Project'}</span>
      </div>

      <div className="mytasks-task-footer">
        <span className={overdue ? 'mytasks-overdue' : ''}>
          <CalendarDays size={15} />
          {overdue ? 'Overdue · ' : 'Due · '}
          {formatDate(task.dueDate)}
        </span>

        {task.project?._id && (
          <Link to={`/projects/${task.project._id}`}>
            View project
          </Link>
        )}
      </div>
    </article>
  );
}
