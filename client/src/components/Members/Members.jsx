import { useState } from 'react';
import { api } from '../../api';
import './Members.css';

export default function Members({
    project,
    role,
    userId,
    onUpdate,
    onLeft,
}) {
    const [email, setEmail] = useState('');
    const [newRole, setNewRole] = useState('member');
    const [err, setErr] = useState('');
    const [adding, setAdding] = useState(false);

    const isAdmin = role === 'admin';

    const run = async (fn) => {
        setErr('');

        try {
            await fn();
        } catch (x) {
            setErr(x.message || 'Something went wrong');
        }
    };

    const add = (e) => {
        e.preventDefault();

        if (!email.trim()) {
            setErr('Please enter a teammate\'s email.');
            return;
        }

        run(async () => {
            setAdding(true);

            try {
                const d = await api(
                    `/projects/${project._id}/members`,
                    {
                        method: 'POST',
                        body: { email: email.trim(), role: newRole },
                    }
                );

                onUpdate(d.project);
                setEmail('');
                setNewRole('member');
            } finally {
                setAdding(false);
            }
        });
    };

    const change = (uid, r) =>
        run(async () => {
            const d = await api(
                `/projects/${project._id}/members/${uid}`,
                {
                    method: 'PATCH',
                    body: { role: r },
                }
            );

            onUpdate(d.project);
        });

    const remove = (uid) => {
        if (!window.confirm('Remove this member? Their tasks will become unassigned.')) {
            return;
        }

        run(async () => {
            await api(`/projects/${project._id}/members/${uid}`, {
                method: 'DELETE',
            });

            if (uid === userId) {
                onLeft();
            } else {
                onUpdate({
                    ...project,
                    members: project.members.filter(
                        (m) => m.user._id !== uid
                    ),
                });
            }
        });
    };

    return (
        <section className="card members-card">
            <div className="members-header">
                <div>
                    <h3>Team Members</h3>
                    <p>Manage your project team and permissions.</p>
                </div>

                <span className="members-count">
                    {project.members.length} members
                </span>
            </div>

            {err && (
                <div className="members-error" role="alert">
                    {err}
                    <button
                        type="button"
                        onClick={() => setErr('')}
                        aria-label="Dismiss error"
                    >
                        &times;
                    </button>
                </div>
            )}

            <div className="members-list">
                {project.members.map((m) => {
                    const owner = project.owner === m.user._id;
                    const isSelf = m.user._id === userId;

                    return (
                        <div key={m.user._id} className="members-item">
                            <div className="members-info">
                                <div className="members-avatar">
                                    {m.user.name?.charAt(0).toUpperCase() || '?'}
                                </div>

                                <div className="members-details">
                                    <div className="members-name">
                                        {m.user.name}

                                        {owner && (
                                            <span className="members-badge owner">
                                                Owner
                                            </span>
                                        )}
                                    </div>

                                    <small>{m.user.email}</small>
                                </div>
                            </div>

                            <div className="members-actions">
                                {isAdmin && !owner ? (
                                    <select
                                        className="members-role-select"
                                        value={m.role}
                                        onChange={(e) =>
                                            change(m.user._id, e.target.value)
                                        }
                                        aria-label={`Change role for ${m.user.name}`}
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="member">Member</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                ) : (
                                    <span
                                        className={`members-badge ${m.role}`}
                                    >
                                        {m.role}
                                    </span>
                                )}

                                {((isAdmin && !owner) || (isSelf && !owner)) && (
                                    <button
                                        type="button"
                                        className={`members-action-btn ${isSelf ? 'leave' : 'remove'
                                            }`}
                                        onClick={() => remove(m.user._id)}
                                    >
                                        {isSelf ? 'Leave' : 'Remove'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {project.members.length === 0 && (
                    <div className="members-empty">
                        No team members yet.
                    </div>
                )}
            </div>

            {isAdmin && (
                <form className="members-form" onSubmit={add}>
                    <div className="members-form-heading">
                        <h4>Add a teammate</h4>
                        <p>Invite someone to collaborate on this project.</p>
                    </div>

                    <div className="members-form-fields">
                        <input
                            type="email"
                            placeholder="Teammate's email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-label="Teammate's email address"
                            required
                        />

                        <select value={role} onChange={(e) => setNewRole(e.target.value)}>
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>

                        <button type="submit">
                            + Add member
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}