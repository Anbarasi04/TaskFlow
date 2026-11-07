import {
    useEffect,
    useState,
    useCallback,
    useRef,
} from 'react';

import {
    NavLink,
    Outlet,
    useNavigate,
} from 'react-router-dom';

import { LayoutDashboard, FolderKanban, BellIcon, LogOut, Menu, X, Check, ChevronRight, ListTodo } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { api } from '../../api';
import './Layout.css';

function Icon({ name, size = 20 }) {
    const icons = {
        dashboard: LayoutDashboard,
        projects: FolderKanban,
        bell: BellIcon,
        logout: LogOut,
        menu: Menu,
        close: X,
        check: Check,
        arrow: ChevronRight,
        myTasks: ListTodo,
    };

    const LucideIcon = icons[name];

    if (!LucideIcon) return null;

    return (
        <LucideIcon
            size={size}
            strokeWidth={1.8}
            aria-hidden="true"
        />
    );
}

function NotificationBell() {
    const [data, setData] = useState({
        items: [],
        unread: 0,
    });

    const [open, setOpen] = useState(false);

    const bellRef = useRef(null);
    const nav = useNavigate();

    const load = useCallback(() => {
        return api('/notifications')
            .then((result) => {
                setData({
                    items: result.items ?? [],
                    unread: result.unread ?? 0,
                });
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        load();

        const timer = setInterval(load, 30000);

        return () => clearInterval(timer);
    }, [load]);

    // Close the dropdown when clicking outside.
    useEffect(() => {
        function handleOutsideClick(event) {
            if (
                bellRef.current &&
                !bellRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener(
                'mousedown',
                handleOutsideClick
            );

            document.removeEventListener(
                'keydown',
                handleEscape
            );
        };
    }, []);

    const click = async (notification) => {
        setOpen(false);

        if (!notification.read) {
            await api(`/notifications/${notification._id}/read`, {
                method: 'PATCH',
            }).catch(() => { });

            load();
        }

        if (notification.link) {
            nav(notification.link);
        }
    };

    const readAll = async () => {
        await api('/notifications/read-all', {
            method: 'PATCH',
        }).catch(() => { });

        load();
    };

    return (
        <div className="notification-wrapper" ref={bellRef}>
            <button
                className={`notification-trigger ${open ? 'is-open' : ''}`}
                onClick={() => setOpen((previous) => !previous)}
                aria-label="Notifications"
                aria-expanded={open}
                aria-haspopup="true"
            >
                <Icon name="bell" size={21} />

                <span className="notification-label">
                    Notifications
                </span>

                {data.unread > 0 && (
                    <span className="notification-badge">
                        {data.unread > 99 ? '99+' : data.unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="notification-popover">
                    <div className="notification-header">
                        <div>
                            <h3>Notifications</h3>
                            <p>
                                {data.unread > 0
                                    ? `${data.unread} unread notification${data.unread === 1 ? '' : 's'}`
                                    : "You're all caught up!"}
                            </p>
                        </div>

                        {data.unread > 0 && (
                            <button
                                className="mark-read-button"
                                onClick={readAll}
                            >
                                <Icon name="check" size={15} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {data.items.length === 0 ? (
                            <div className="notification-empty">
                                <div className="empty-icon">
                                    <Icon name="bell" size={26} />
                                </div>

                                <strong>All caught up!</strong>

                                <p>
                                    New notifications will appear here.
                                </p>
                            </div>
                        ) : (
                            data.items.map((notification) => (
                                <button
                                    key={notification._id}
                                    className={`notification-item ${notification.read ? '' : 'unread'
                                        }`}
                                    onClick={() => click(notification)}
                                >
                                    <span className="notification-dot" />

                                    <span className="notification-content">
                                        <span className="notification-message">
                                            {notification.message}
                                        </span>

                                        <small>
                                            {new Date(
                                                notification.createdAt
                                            ).toLocaleString()}
                                        </small>
                                    </span>

                                    <Icon name="arrow" size={16} />
                                </button>
                            ))
                        )}
                    </div>

                    {data.items.length > 0 && (
                        <div className="notification-footer">
                            <span>
                                Showing {data.items.length} notification
                                {data.items.length === 1 ? '' : 's'}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Layout() {
    const { user, logout } = useAuth();

    const [mobileOpen, setMobileOpen] = useState(false);

    const closeMobileMenu = () => {
        setMobileOpen(false);
    };

    const displayName = user?.name || 'User';

    const initial = displayName
        .trim()
        .charAt(0)
        .toUpperCase() || 'U';

    return (
        <div className="app-layout">
            <header className="app-navbar">
                <div className="navbar-inner">
                    <NavLink
                        to="/"
                        className="brand"
                        onClick={closeMobileMenu}
                    >
                        <span className="brand-icon">
                            <svg
                                width="25"
                                height="25"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="m4 12 5 5L20 6" />
                                <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
                            </svg>
                        </span>

                        <span className="brand-text">
                            Task<span>Flow</span>
                        </span>
                    </NavLink>

                    {/* Desktop navigation */}
                    <nav className="main-navigation">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <Icon name="dashboard" size={18} />
                            <span>Dashboard</span>
                        </NavLink>

                        <NavLink to="/my-tasks" className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }>
                            <ListTodo size={19} />
                            <span>My Tasks</span>
                        </NavLink>

                        <NavLink    
                            to="/projects"
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <Icon name="projects" size={18} />
                            <span>Projects</span>
                        </NavLink>
                    </nav>

                    <div className="navbar-spacer" />

                    {/* Actions */}
                    <div className="navbar-actions">
                        <NotificationBell />

                        <div className="navbar-divider" />

                        <div className="user-profile">
                            <div className="user-avatar">
                                {initial}
                            </div>

                            <div className="user-details">
                                <span className="user-name">
                                    {displayName}
                                </span>

                                <span className="user-role">
                                    Workspace member
                                </span>
                            </div>
                        </div>

                        <button
                            className="logout-button"
                            onClick={logout}
                            title="Log out"
                        >
                            <Icon name="logout" size={18} />
                            <span>Log out</span>
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="mobile-menu-button"
                        onClick={() =>
                            setMobileOpen((previous) => !previous)
                        }
                        aria-label={
                            mobileOpen ? 'Close navigation' : 'Open navigation'
                        }
                        aria-expanded={mobileOpen}
                    >
                        <Icon
                            name={mobileOpen ? 'close' : 'menu'}
                            size={23}
                        />
                    </button>
                </div>

                {/* Mobile navigation */}
                <div
                    className={`mobile-navigation ${mobileOpen ? 'mobile-navigation-open' : ''
                        }`}
                >
                    <NavLink
                        to="/"
                        end
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `mobile-nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <Icon name="dashboard" size={19} />
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/projects"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `mobile-nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <Icon name="projects" size={19} />
                        Projects
                    </NavLink>

                    <div className="mobile-user">
                        <div className="user-avatar">
                            {initial}
                        </div>

                        <div className="user-details">
                            <span className="user-name">
                                {displayName}
                            </span>

                            <span className="user-role">
                                Workspace member
                            </span>
                        </div>
                    </div>

                    <button
                        className="mobile-logout-button"
                        onClick={logout}
                    >
                        <Icon name="logout" size={18} />
                        Log out
                    </button>
                </div>
            </header>

            <main className="page">
                <Outlet />
            </main>
        </div>
    );
}