import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const NAV = [
  { to: '/',             label: 'Dashboard',       icon: '📊' },
  { to: '/products',     label: 'สินค้า',           icon: '📦' },
  { to: '/inventory',    label: 'คลังสินค้า',       icon: '🏭' },
  { to: '/transactions', label: 'Transaction Log',  icon: '📋' },
];

const NAV_ADMIN = [
  { to: '/transfer', label: 'โอนย้าย / ส่งออก',  icon: '🔄' },
  { to: '/users',    label: 'จัดการผู้ใช้',       icon: '👥' },
];

const NavItem = ({ to, label, icon, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
    title={label}
  >
    <span className="nav-icon">{icon}</span>
    <span className="nav-label">{label}</span>
  </NavLink>
);

const Navbar = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">ERP</span>
            <span className="logo-text">Mini ERP</span>
          </div>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'ขยาย' : 'ย่อ'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} end={item.to === '/'} />
          ))}

          {isAdmin && (
            <>
              <div className="nav-divider">
                <span className="nav-divider-text">Admin</span>
              </div>
              {NAV_ADMIN.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-icon">↩</span>
            <span className="logout-text">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      <div className="layout-body">
        <header className="topbar">
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="เปิด/ปิด menu"
          >
            ☰
          </button>
          <span className="topbar-brand">
            <span className="logo-icon topbar-logo-icon">ERP</span>
            Mini ERP
          </span>
          <div className="topbar-right">
            <div className="user-avatar topbar-avatar">{user?.name?.[0]}</div>
          </div>
        </header>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default Navbar;
