import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, qs, isOverdue, fmtDate } from '../../api';
import { useAuth } from '../../AuthContext';
import TaskModal from '../../components/TaskModal/TaskModal';
import Members from '../../components/Members/Members';
import './ProjectPage.css';

const COLS = [
  ['todo', 'To Do'],
  ['in_progress', 'In Progress'],
  ['done', 'Done'],
];

const LIST_SIZE = 8;

function useDebounced(v, ms = 350) {
  const [d, setD] = useState(v);

  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);

  return d;
}

function Card({ t, canEdit, onOpen, onDragStart }) {
  const overdue = isOverdue(t);

  return (
    <article
      className={`project-page-task-card priority-${t.priority}`}
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e, t._id)}
      onClick={() => onOpen(t._id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(t._id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open task ${t.title}`}
    >
      <div className="project-page-task-top">
        <span className={`project-page-priority priority-${t.priority}`}>
          <span className="project-page-priority-dot" />
          {t.priority}
        </span>

        {canEdit && (
          <span className="project-page-drag-hint" aria-hidden="true">
            ⠿
          </span>
        )}
      </div>

      <h3>{t.title}</h3>

      <div className="project-page-task-footer">
        {t.dueDate ? (
          <span className={`project-page-due ${overdue ? 'is-overdue' : ''}`}>
            <span aria-hidden="true">◷</span>
            {overdue ? 'Overdue · ' : ''}
            {fmtDate(t.dueDate)}
          </span>
        ) : (
          <span className="project-page-no-date">No due date</span>
        )}

        {t.assignee && (
          <span
            className="project-page-assignee-avatar"
            title={t.assignee.name}
            aria-label={`Assigned to ${t.assignee.name}`}
          >
            {t.assignee.name?.charAt(0).toUpperCase() || '?'}
          </span>
        )}
      </div>
    </article>
  );
}

export default function ProjectPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [role, setRole] = useState('viewer');
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    assignee: '',
    overdue: false,
  });
  const [view, setView] = useState('board');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [modal, setModal] = useState(null);
  const [reload, setReload] = useState(0);
  const [over, setOver] = useState('');

  const search = useDebounced(filters.search);
  const canEdit = role !== 'viewer';

  useEffect(() => {
    let ignore = false;

    setProject(null);
    setErr('');

    api(`/projects/${id}`)
      .then((d) => {
        if (ignore) return;
        setProject(d.project);
        setRole(d.role);
      })
      .catch((e) => {
        if (!ignore) setErr(e.message);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    setPage(1);
  }, [search, filters.priority, filters.assignee, filters.overdue, view]);

  useEffect(() => {
    let ignore = false;

    setLoading(true);

    const q = qs({
      ...filters,
      search,
      page: view === 'list' ? page : 1,
      limit: view === 'list' ? LIST_SIZE : 200,
    });

    api(`/projects/${id}/tasks?${q}`)
      .then((d) => {
        if (ignore) return;

        setTasks(d.tasks);
        setMeta({ total: d.total, pages: d.pages });
        setErr('');
      })
      .catch((e) => {
        if (!ignore) setErr(e.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [
    id,
    search,
    filters.priority,
    filters.assignee,
    filters.overdue,
    view,
    page,
    reload,
  ]);

  const refresh = useCallback(() => {
    setReload((n) => n + 1);
  }, []);

  const move = async (taskId, status) => {
    const prev = tasks;
    const task = tasks.find((x) => x._id === taskId);

    if (!task || task.status === status || !canEdit) return;

    setTasks((current) =>
      current.map((x) => (x._id === taskId ? { ...x, status } : x))
    );

    try {
      await api(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: { status },
      });
    } catch (e) {
      setTasks(prev);
      setErr(e.message);
    }
  };

  const deleteProject = async () => {
    if (
      !window.confirm(
        `Delete "${project.name}" and all its tasks? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api(`/projects/${id}`, { method: 'DELETE' });
      nav('/projects');
    } catch (e) {
      setErr(e.message);
    }
  };

  const setF = (key) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;

    setFilters((current) => ({ ...current, [key]: value }));
  };

  const filtered = Boolean(
    filters.search ||
      filters.priority ||
      filters.assignee ||
      filters.overdue
  );

  if (!project) {
    return err ? (
      <div className="project-page-error" role="alert">
        <strong>Unable to open project</strong>
        <p>{err}</p>
        <button
          className="project-page-btn project-page-btn-secondary"
          onClick={() => nav('/projects')}
        >
          Back to projects
        </button>
      </div>
    ) : (
      <div className="project-page-loading">
        <div className="project-page-spinner" />
        <p>Loading project...</p>
      </div>
    );
  }

  return (
    <div className="project-page">
      <header className="project-page-header">
        <div className="project-page-heading">
          <button
            className="project-page-back"
            onClick={() => nav('/projects')}
          >
            ← All projects
          </button>

          <div className="project-page-title-row">
            <div className="project-page-project-icon">
              {project.name?.charAt(0).toUpperCase() || 'P'}
            </div>

            <div className="project-page-title-content">
              <h1>{project.name}</h1>

              {project.description && (
                <p>{project.description}</p>
              )}

              <div className="project-page-project-meta">
                <span>
                  {project.members.length}{' '}
                  {project.members.length === 1 ? 'member' : 'members'}
                </span>

                <span className="project-page-meta-dot">•</span>

                <span>
                  {tasks.length} task{tasks.length === 1 ? '' : 's'} loaded
                </span>

                {role === 'viewer' && (
                  <span className="project-page-viewer-badge">
                    View only
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="project-page-header-actions">
          {canEdit && (
            <button
              className="project-page-btn project-page-btn-primary"
              onClick={() => setModal('new')}
            >
              <span>＋</span> New task
            </button>
          )}

          {project.owner === user.id && (
            <button
              className="project-page-btn project-page-btn-danger"
              onClick={deleteProject}
            >
              Delete project
            </button>
          )}
        </div>
      </header>

      <section className="project-page-toolbar">
        <div className="project-page-search">
          <span aria-hidden="true">⌕</span>

          <input
            aria-label="Search tasks"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={setF('search')}
          />

          {filters.search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() =>
                setFilters((current) => ({ ...current, search: '' }))
              }
            >
              ×
            </button>
          )}
        </div>

        <div className="project-page-filter-group">
          <select
            aria-label="Filter by priority"
            value={filters.priority}
            onChange={setF('priority')}
          >
            <option value="">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>

          <select
            aria-label="Filter by assignee"
            value={filters.assignee}
            onChange={setF('assignee')}
          >
            <option value="">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="none">Unassigned</option>

            {project.members.map((m) => (
              <option key={m.user._id} value={m.user._id}>
                {m.user.name}
              </option>
            ))}
          </select>

          <label className="project-page-overdue-filter">
            <input
              type="checkbox"
              checked={filters.overdue}
              onChange={setF('overdue')}
            />
            <span>Overdue</span>
          </label>
        </div>

        <div className="project-page-view-toggle" aria-label="Task view">
          <button
            className={view === 'board' ? 'active' : ''}
            onClick={() => setView('board')}
            aria-pressed={view === 'board'}
          >
            ▦ Board
          </button>

          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
          >
            ☷ List
          </button>
        </div>
      </section>

      {err && (
        <div className="project-page-error-banner" role="alert">
          <span>{err}</span>

          <button onClick={() => setErr('')} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {loading && (
        <div className="project-page-update-status">
          <span className="project-page-small-spinner" />
          Updating tasks...
        </div>
      )}

      {view === 'board' ? (
        <section className="project-page-board">
          {COLS.map(([key, label]) => {
            const items = tasks.filter((t) => t.status === key);

            return (
              <div
                key={key}
                className={`project-page-column column-${key} ${
                  over === key ? 'drag-over' : ''
                }`}
                onDragOver={(e) => {
                  if (canEdit) {
                    e.preventDefault();
                    setOver(key);
                  }
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setOver('');
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver('');
                  move(e.dataTransfer.getData('text/plain'), key);
                }}
              >
                <div className="project-page-column-header">
                  <div className="project-page-column-title">
                    <span className="project-page-column-dot" />
                    <h2>{label}</h2>
                    <span className="project-page-column-count">
                      {items.length}
                    </span>
                  </div>

                  {canEdit && (
                    <button
                      className="project-page-add-task"
                      title={`Create task in ${label}`}
                      aria-label={`Create task in ${label}`}
                      onClick={() => setModal('new')}
                    >
                      +
                    </button>
                  )}
                </div>

                <div className="project-page-column-content">
                  {items.map((t) => (
                    <Card
                      key={t._id}
                      t={t}
                      canEdit={canEdit}
                      onOpen={setModal}
                      onDragStart={(e, tid) =>
                        e.dataTransfer.setData('text/plain', tid)
                      }
                    />
                  ))}

                  {!items.length && (
                    <div className="project-page-empty-column">
                      <span>＋</span>
                      <p>
                        {filtered
                          ? 'No matching tasks'
                          : canEdit
                            ? 'Drop tasks here'
                            : 'No tasks yet'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <section className="project-page-list">
          {tasks.length === 0 && !loading ? (
            <div className="project-page-list-empty">
              <span>▤</span>
              <strong>
                {filtered ? 'No matching tasks' : 'No tasks yet'}
              </strong>
              <p>
                {filtered
                  ? 'Try changing your search or filters.'
                  : 'Create a task to get your project moving.'}
              </p>

              {!filtered && canEdit && (
                <button
                  className="project-page-btn project-page-btn-primary"
                  onClick={() => setModal('new')}
                >
                  ＋ Create task
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="project-page-list-heading">
                <span>Task</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Assignee / Due date</span>
              </div>

              {tasks.map((t) => (
                <button
                  type="button"
                  key={t._id}
                  className="project-page-list-item"
                  onClick={() => setModal(t._id)}
                >
                  <span className="project-page-list-task">
                    <span className="project-page-list-task-icon">▤</span>
                    <span className="project-page-list-task-text">
                      <strong>{t.title}</strong>
                      <small>
                        {t.assignee
                          ? `Assigned to ${t.assignee.name}`
                          : 'Unassigned'}
                      </small>
                    </span>
                  </span>

                  <span>
                    <span
                      className={`project-page-status status-${t.status}`}
                    >
                      {COLS.find((c) => c[0] === t.status)?.[1] || t.status}
                    </span>
                  </span>

                  <span>
                    <span
                      className={`project-page-priority priority-${t.priority}`}
                    >
                      <span className="project-page-priority-dot" />
                      {t.priority}
                    </span>
                  </span>

                  <span className="project-page-list-due">
                    {t.dueDate ? (
                      <span className={isOverdue(t) ? 'is-overdue' : ''}>
                        {fmtDate(t.dueDate)}
                      </span>
                    ) : (
                      <span className="project-page-no-date">No due date</span>
                    )}
                  </span>
                </button>
              ))}
            </>
          )}

          <div className="project-page-pagination">
            <span>
              {meta.total} total task{meta.total === 1 ? '' : 's'}
            </span>

            <div>
              <button
                className="project-page-btn project-page-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Previous
              </button>

              <span className="project-page-page-number">
                Page {page} of {meta.pages}
              </span>

              <button
                className="project-page-btn project-page-btn-secondary"
                disabled={page >= meta.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="project-page-members-section">
        <Members
          project={project}
          role={role}
          userId={user.id}
          onUpdate={setProject}
          onLeft={() => nav('/projects')}
        />
      </section>

      {modal && (
        <TaskModal
          taskId={modal === 'new' ? null : modal}
          projectId={id}
          members={project.members}
          role={role}
          onClose={() => setModal(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}