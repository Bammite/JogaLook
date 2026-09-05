import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logoImg from '../assets/Logo.png';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SettingsIcon, LogOutIcon } from './icons/AppIcons';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showCart = ['/', '/catalogue', '/accueil'].includes(location.pathname);
  const dropRef = useRef(null);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user
    ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '') || user.email?.[0] || '?').toUpperCase()
    : '';

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src={logoImg} alt="JogaLook" className="logo-img" />
        </Link>

        <ul className={`navbar-links ${menuOpen ? 'active' : ''}`}>
          <li>
            <NavLink
              to="/catalogue"
              className={({ isActive }) => (isActive || location.pathname === '/' ? 'active' : '')}
              onClick={() => setMenuOpen(false)}
            >
              Catalogue
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/accueil"
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setMenuOpen(false)}
            >
              Accueil
            </NavLink>
          </li>
          <li><NavLink to="/custom" onClick={() => setMenuOpen(false)}>Customiser</NavLink></li>
          <li><NavLink to="/actualites" onClick={() => setMenuOpen(false)}>Actus</NavLink></li>
          <li><a href="/accueil#contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
          {user && (
            <li className="navbar-mobile-account">
              <div className="navbar-mobile-account__identity">
                <span className="navbar-avatar navbar-mobile-account__avatar">{initials}</span>
                <span>
                  <strong>{user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}</strong>
                  <small>{user.email}</small>
                </span>
              </div>
              {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                <Link to="/admin" className="navbar-dropdown__item" onClick={() => setMenuOpen(false)}>
                  <SettingsIcon size={16} /> Administration
                </Link>
              )}
              <Link to="/mes-commandes" className="navbar-dropdown__item" onClick={() => setMenuOpen(false)}>
                📦 Mes commandes
              </Link>
              <Link to="/profil" className="navbar-dropdown__item" onClick={() => setMenuOpen(false)}>
                🎨 Mes créations & profil
              </Link>
              <button className="navbar-dropdown__item navbar-dropdown__logout" onClick={() => { handleLogout(); setMenuOpen(false); }}>
                <LogOutIcon size={16} /> Se déconnecter
              </button>
            </li>
          )}
        </ul>

        <div className="navbar-actions">
          <Link to="/recherche" className="icon-btn" aria-label="Rechercher">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </Link>

          {/* ── Compte utilisateur ── */}
          {user ? (
            <div className="navbar-user navbar-user--desktop" ref={dropRef}>
              <button
                className="navbar-avatar"
                onClick={() => setDropOpen(o => !o)}
                aria-label="Mon compte"
                aria-expanded={dropOpen}
              >
                {initials}
              </button>
              {dropOpen && (
                <div className="navbar-dropdown">
                  <div className="navbar-dropdown__header">
                    <span className="navbar-dropdown__name">
                      {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
                    </span>
                    <span className="navbar-dropdown__email">{user.email}</span>
                  </div>
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <Link to="/admin" className="navbar-dropdown__item" onClick={() => setDropOpen(false)}>
                      <SettingsIcon size={16} /> Administration
                    </Link>
                  )}
                  <Link to="/mes-commandes" className="navbar-dropdown__item" onClick={() => setDropOpen(false)}>
                    📦 Mes commandes
                  </Link>
                  <Link to="/profil" className="navbar-dropdown__item" onClick={() => setDropOpen(false)}>
                    🎨 Mes créations & profil
                  </Link>
                  <button className="navbar-dropdown__item navbar-dropdown__logout" onClick={handleLogout}>
                    <LogOutIcon size={16} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="navbar-login-btn" aria-label="Connexion">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="navbar-login-text">Connexion</span>
            </Link>
          )}

          <Link
            to="/panier"
            aria-label="Mon Panier"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'transparent',
              color: '#000',
              textDecoration: 'none',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                display: 'block',
                width: '20px',
                height: '20px',
                stroke: '#000',
                visibility: 'visible',
              }}
            >
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  minWidth: '18px',
                  height: '18px',
                  background: '#000',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          <button
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span/><span/><span/>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;