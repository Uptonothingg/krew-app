import { useAuth } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Krew</div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Schedule</NavLink>
          <NavLink to="/staff" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Staff</NavLink>
          <NavLink to="/clock" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Clock in/out</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.full_name}</div>
          <button onClick={handleLogout} className="logout-btn">Sign out</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
