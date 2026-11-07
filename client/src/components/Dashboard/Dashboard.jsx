import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate } from '../../api';
import './Dashboard.css';

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/dashboard')
      .then(setD)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) {
    return (
      <div className="dashboard-error">
        <span className="dashboard-error-icon">!</span>
        <div>
          <strong>Unable to load dashboard</strong>
          <p>{err}</p>
        </div>
      </div>
    );
  }

  if (!d) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (d.projects === 0) {
    return (
      <div className="dashboard-empty">
        <div className="dashboard-empty-icon">◈</div>
        <h2>Welcome to TaskFlow!</h2>
        <p>
          You don't have any projects yet. Create your first project
          and start organizing your work.
        </p>
        <Link className="dashboard-primary-btn" to="/projects">
          + Create your first project
        </Link>
      </div>
    );
  }

  const stats = [
    {
      label: 'To do',
      value: d.counts.todo,
      icon: '○',
      tone: 'purple',
    },
    {
      label: 'In progress',
      value: d.counts.in_progress,
      icon: '◷',
      tone: 'blue',
    },
    {
      label: 'Completed',
      value: d.counts.done,
      icon: '✓',
      tone: 'green',
    },
    {
      label: 'Assigned to me',
      value: d.mine,
      icon: '♙',
      tone: 'orange',
    },
    {
      label: 'Due in 7 days',
      value: d.dueSoon,
      icon: '▦',
      tone: 'blue',
    },
    {
      label: 'Overdue',
      value: d.overdue.length,
      icon: '!',
      tone: d.overdue.length ? 'red' : 'green',
    },
  ];

  const progress = Math.min(100, Math.max(0, Number(d.progress) || 0));

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">WORKSPACE OVERVIEW</span>
          <h1>Dashboard</h1>
          <p>Track your projects, monitor progress, and stay on top of your tasks.</p>
        </div>

        <Link to="/projects" className="dashboard-primary-btn">
          + View projects
        </Link>
      </header>

      <section className="dashboard-stats">
        {stats.map((stat) => (
          <div className="dashboard-stat-card" key={stat.label}>
            <div className={`dashboard-stat-icon ${stat.tone}`}>
              {stat.icon}
            </div>

            <div className="dashboard-stat-content">
              <span>{stat.label}</span>
              <strong>{stat.value ?? 0}</strong>
            </div>
          </div>
        ))}
      </section>

      <section className="dashboard-progress-card">
        <div className="dashboard-progress-header">
          <div>
            <span className="dashboard-section-label">PROJECT SUMMARY</span>
            <h2>Overall progress</h2>
            <p>Keep moving forward, one task at a time.</p>
          </div>

          <div className="dashboard-progress-value">
            <strong>{progress}%</strong>
            <span>completed</span>
          </div>
        </div>

        <div
          className="dashboard-progress-track"
          role="progressbar"
          aria-label="Overall task completion"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="dashboard-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <section className="dashboard-overdue-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Overdue tasks</h2>
            <p>Tasks that need your attention</p>
          </div>

          <span
            className={`dashboard-overdue-count ${
              d.overdue.length ? 'has-overdue' : ''
            }`}
          >
            {d.overdue.length} {d.overdue.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {d.overdue.length === 0 ? (
          <div className="dashboard-no-overdue">
            <div className="dashboard-success-icon">✓</div>
            <div>
              <strong>You're all caught up!</strong>
              <p>No overdue tasks. Keep up the great work.</p>
            </div>
          </div>
        ) : (
          <div className="dashboard-overdue-list">
            {d.overdue.map((t) => (
              <Link
                key={t._id}
                to={`/projects/${t.project._id}`}
                className="dashboard-overdue-item"
              >
                <div className="dashboard-task-indicator" />

                <div className="dashboard-task-details">
                  <strong>{t.title}</strong>
                  <span>
                    {t.project.name}
                    {t.assignee ? ` · Assigned to ${t.assignee.name}` : ''}
                  </span>
                </div>

                <span className="dashboard-due-date">
                  <span aria-hidden="true">◷ </span>
                  Due {fmtDate(t.dueDate)}
                </span>

                <span className="dashboard-task-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}