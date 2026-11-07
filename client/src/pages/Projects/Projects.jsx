import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import './Projects.css';

export default function Projects() {
  const [list, setList] = useState(null);
  const [f, setF] = useState({ name: '', description: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    api('/projects')
      .then((d) => {
        setList(d.projects);
        setErr('');
      })
      .catch((e) => setErr(e.message));

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setErr('');

    if (!f.name.trim()) {
      setErr('Give the project a name');
      return;
    }

    setBusy(true);

    try {
      await api('/projects', {
        method: 'POST',
        body: {
          name: f.name.trim(),
          description: f.description.trim(),
        },
      });

      setF({ name: '', description: '' });
      await load();
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="projects-page">
      <header className="projects-page-header">
        <div>
          <span className="projects-page-eyebrow">YOUR WORKSPACE</span>
          <h1>Projects</h1>
          <p>
            Organize your work, collaborate with your team, and track progress
            in one place.
          </p>
        </div>

        {list && list.length > 0 && (
          <div className="projects-page-total">
            <span className="projects-page-total-icon">▦</span>
            <div>
              <strong>{list.length}</strong>
              <span>{list.length === 1 ? 'Project' : 'Projects'}</span>
            </div>
          </div>
        )}
      </header>

      <section className="projects-page-create">
        <div className="projects-page-create-heading">
          <div className="projects-page-create-icon">＋</div>
          <div>
            <h2>Create a project</h2>
            <p>Start a new workspace for your next idea.</p>
          </div>
        </div>

        <form className="projects-page-form" onSubmit={create}>
          <div className="projects-page-field projects-page-name-field">
            <label htmlFor="project-name">Project name</label>
            <input
              id="project-name"
              placeholder="e.g. Website redesign"
              value={f.name}
              maxLength={80}
              onChange={(e) =>
                setF((current) => ({ ...current, name: e.target.value }))
              }
              disabled={busy}
            />
          </div>

          <div className="projects-page-field projects-page-description-field">
            <label htmlFor="project-description">
              Description <span>(optional)</span>
            </label>
            <input
              id="project-description"
              placeholder="What is this project about?"
              value={f.description}
              maxLength={500}
              onChange={(e) =>
                setF((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
              disabled={busy}
            />
          </div>

          <button
            className="projects-page-create-btn"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Creating...' : '＋ Create project'}
          </button>
        </form>

        {err && (
          <div className="projects-page-error" role="alert">
            <span>{err}</span>
            <button
              type="button"
              onClick={() => setErr('')}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}
      </section>

      <section className="projects-page-list-section">
        <div className="projects-page-section-header">
          <div>
            <h2>Your projects</h2>
            <p>All your projects in one place.</p>
          </div>
        </div>

        {!list ? (
          <div className="projects-page-loading">
            <div className="projects-page-spinner" />
            <p>Loading your projects...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="projects-page-empty">
            <div className="projects-page-empty-icon">▦</div>
            <h3>Your workspace is ready</h3>
            <p>
              You haven't created any projects yet. Use the form above to
              create your first project and get started.
            </p>
          </div>
        ) : (
          <div className="projects-page-grid">
            {list.map((p) => (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="projects-page-card"
              >
                <div className="projects-page-card-top">
                  <div className="projects-page-card-icon">
                    {p.name?.charAt(0).toUpperCase() || 'P'}
                  </div>

                  <span className="projects-page-card-arrow" aria-hidden="true">
                    ↗
                  </span>
                </div>

                <h3>{p.name}</h3>

                <p className="projects-page-card-description">
                  {p.description || 'No description added yet.'}
                </p>

                <div className="projects-page-card-footer">
                  <span className="projects-page-members">
                    <span aria-hidden="true">♙</span>
                    {p.members.length}{' '}
                    {p.members.length === 1 ? 'member' : 'members'}
                  </span>

                  <span className="projects-page-open-label">
                    Open project <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}