import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
import './TaskModal.css';

export default function TaskModal({
  taskId,
  projectId,
  members,
  role,
  onClose,
  onChanged,
}) {
  const { user } = useAuth();

  const isNew = !taskId;
  const canEdit = role !== 'viewer';

  const [f, setF] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assignee: '',
    dueDate: '',
  });

  const [task, setTask] = useState(null);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [deleting, setDeleting] = useState(false);
  const [posting, setPosting] = useState(false);

  // Load task details
  useEffect(() => {
    if (isNew) return;

    setLoading(true);

    api(`/tasks/${taskId}`)
      .then(({ task: t }) => {
        setTask(t);

        setF({
          title: t.title || '',
          description: t.description || '',
          priority: t.priority || 'medium',
          status: t.status || 'todo',
          assignee: t.assignee?._id || '',
          dueDate: t.dueDate
            ? t.dueDate.slice(0, 10)
            : '',
        });
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [taskId, isNew]);

  // Close modal using Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Form field handler
  const set = (key) => (e) => {
    setF((previous) => ({
      ...previous,
      [key]: e.target.value,
    }));
  };

  // Create or update task
  const save = async (e) => {
    e.preventDefault();
    setErr('');

    if (!f.title.trim()) {
      setErr('Task title is required.');
      return;
    }

    setBusy(true);

    try {
      const body = {
        ...f,
        title: f.title.trim(),
        description: f.description.trim(),
        assignee: f.assignee || null,
        dueDate: f.dueDate || null,
      };

      await api(
        isNew
          ? `/projects/${projectId}/tasks`
          : `/tasks/${taskId}`,
        {
          method: isNew ? 'POST' : 'PUT',
          body,
        }
      );

      onChanged();
      onClose();
    } catch (x) {
      setErr(x.message || 'Unable to save task.');
    } finally {
      setBusy(false);
    }
  };

  // Delete task
  const remove = async () => {
    if (
      !window.confirm(
        'Delete this task? This cannot be undone.'
      )
    ) {
      return;
    }

    setErr('');
    setDeleting(true);

    try {
      await api(`/tasks/${taskId}`, {
        method: 'DELETE',
      });

      onChanged();
      onClose();
    } catch (x) {
      setErr(x.message || 'Unable to delete task.');
    } finally {
      setDeleting(false);
    }
  };

  // Add comment
  const addComment = async (e) => {
    e.preventDefault();

    if (!comment.trim()) return;

    setErr('');
    setPosting(true);

    try {
      const d = await api(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: { text: comment.trim() },
      });

      setTask(d.task);
      setComment('');
    } catch (x) {
      setErr(x.message || 'Unable to post comment.');
    } finally {
      setPosting(false);
    }
  };

  const mayDelete =
    !isNew &&
    (role === 'admin' ||
      task?.createdBy === (user?.id || user?._id));

  return (
    <div
      className="task-modal-overlay"
      onMouseDown={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div
        className="task-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        {/* Modal Header */}
        <div className="task-modal-header">
          <div>
            <span className="task-modal-eyebrow">
              {isNew ? 'TASK MANAGEMENT' : 'TASK DETAILS'}
            </span>

            <h2 id="task-modal-title">
              {isNew
                ? 'Create a new task'
                : canEdit
                  ? 'Edit task'
                  : 'Task details'}
            </h2>

            <p>
              {isNew
                ? 'Add a task and organize your workflow.'
                : 'Manage task information and collaboration.'}
            </p>
          </div>

          <button
            type="button"
            className="task-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Modal Content */}
        <div className="task-modal-body">
          {err && (
            <div className="task-modal-error" role="alert">
              <span>{err}</span>

              <button
                type="button"
                onClick={() => setErr('')}
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          {loading ? (
            <div className="task-modal-loading">
              <div className="task-modal-spinner" />
              <p>Loading task details...</p>
            </div>
          ) : (
            <>
              {/* Task Form */}
              <form onSubmit={save} noValidate>
                <fieldset
                  className="task-modal-fieldset"
                  disabled={!canEdit || busy || deleting}
                >
                  <div className="task-modal-form-group">
                    <label htmlFor="task-title">
                      Task title <span>*</span>
                    </label>

                    <input
                      id="task-title"
                      type="text"
                      placeholder="Enter task title"
                      value={f.title}
                      onChange={set('title')}
                      maxLength={120}
                      autoFocus
                    />
                  </div>

                  <div className="task-modal-form-group">
                    <label htmlFor="task-description">
                      Description
                    </label>

                    <textarea
                      id="task-description"
                      rows={3}
                      placeholder="Describe what needs to be done..."
                      value={f.description}
                      onChange={set('description')}
                      maxLength={2000}
                    />

                    <small className="task-modal-hint">
                      {f.description.length}/2000 characters
                    </small>
                  </div>

                  <div className="task-modal-grid">
                    <div className="task-modal-form-group">
                      <label htmlFor="task-status">
                        Status
                      </label>

                      <select
                        id="task-status"
                        value={f.status}
                        onChange={set('status')}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">
                          In Progress
                        </option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div className="task-modal-form-group">
                      <label htmlFor="task-priority">
                        Priority
                      </label>

                      <select
                        id="task-priority"
                        value={f.priority}
                        onChange={set('priority')}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="task-modal-form-group">
                      <label htmlFor="task-assignee">
                        Assignee
                      </label>

                      <select
                        id="task-assignee"
                        value={f.assignee}
                        onChange={set('assignee')}
                      >
                        <option value="">Unassigned</option>

                        {members.map((m) => (
                          <option
                            key={m.user._id}
                            value={m.user._id}
                          >
                            {m.user.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="task-modal-form-group">
                      <label htmlFor="task-due-date">
                        Due date
                      </label>

                      <input
                        id="task-due-date"
                        type="date"
                        value={f.dueDate}
                        onChange={set('dueDate')}
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Form Actions */}
                {canEdit && (
                  <div className="task-modal-actions">
                    <div>
                      {mayDelete && (
                        <button
                          type="button"
                          className="task-modal-delete"
                          onClick={remove}
                          disabled={busy || deleting}
                        >
                          {deleting ? 'Deleting...' : 'Delete task'}
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="task-modal-save"
                      disabled={busy || deleting}
                    >
                      {busy
                        ? 'Saving...'
                        : isNew
                          ? '+ Create task'
                          : 'Save changes'}
                    </button>
                  </div>
                )}
              </form>

              {/* Comments Section */}
              {!isNew && task && (
                <section className="task-comments">
                  <div className="task-comments-header">
                    <div>
                      <h3>Discussion</h3>
                      <p>
                        {task.comments.length} comments
                      </p>
                    </div>
                  </div>

                  <div className="task-comments-list">
                    {task.comments.length === 0 ? (
                      <div className="task-comments-empty">
                        No comments yet. Start the conversation!
                      </div>
                    ) : (
                      task.comments.map((c) => (
                        <div
                          key={c._id}
                          className="task-comment-item"
                        >
                          <div className="task-comment-avatar">
                            {c.user?.name
                              ?.charAt(0)
                              .toUpperCase() || '?'}
                          </div>

                          <div className="task-comment-content">
                            <div className="task-comment-meta">
                              <b>
                                {c.user?.name || 'Removed user'}
                              </b>

                              <small>
                                {new Date(
                                  c.createdAt
                                ).toLocaleString()}
                              </small>
                            </div>

                            <p>{c.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {canEdit && (
                    <form
                      className="task-comment-form"
                      onSubmit={addComment}
                    >
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={comment}
                        maxLength={1000}
                        onChange={(e) =>
                          setComment(e.target.value)
                        }
                      />

                      <button
                        type="submit"
                        disabled={!comment.trim() || posting}
                      >
                        {posting ? 'Posting...' : 'Post'}
                      </button>
                    </form>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}