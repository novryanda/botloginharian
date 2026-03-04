import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h1>Bot Login</h1>
                    <span>Harian Panel</span>
                </div>
                <ul className="sidebar-nav">
                    <li>
                        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">📊</span>
                            Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/accounts" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">👥</span>
                            Akun
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/logs" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">📋</span>
                            Log Aktivitas
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">⚙️</span>
                            Pengaturan
                        </NavLink>
                    </li>
                </ul>
                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>
                    <a
                        href="http://localhost:3000/admin/queues"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}
                    >
                        📊 Bull Board →
                    </a>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
