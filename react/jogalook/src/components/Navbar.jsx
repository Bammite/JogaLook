import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logoImg from '../assets/Logo.png';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SettingsIcon, LogOutIcon } from './icons/AppIcons';

// Groupes par défaut en attendant ou en cas de secours
const DEFAULT_GROUPS = [
  { id: '1', name: 'Vêtements', slug: 'vetements', categories: [] },
  { id: '2', name: 'Sport', slug: 'sport', categories: [] },
  { id: '3', name: 'Électronique', slug: 'electronique', categories: [] },
];

function ChevronDown({ className = '' }) {
  return (
    <svg
      className={`navbar-chevron ${className}`}
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // slug du groupe ou 'all-categories'
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState(null);
  const [groups, setGroups] = useState(DEFAULT_GROUPS);

  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userDropRef = useRef(null);
  const navRef = useRef(null);
  const timeoutRef = useRef(null);

  // Charger les groupes de catégories depuis l'API
  useEffect(() => {
    let isMounted = true;
    fetch('/api/category-groups')
      .then(res => res.json())
      .then(json => {
        if (isMounted && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setGroups(json.data);
        }
      })
      .catch(() => {
        // Garde les groupes par défaut
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fermer les dropdowns lors des changements de page
  useEffect(() => {
    setMenuOpen(false);
    setUserDropOpen(false);
    setActiveDropdown(null);
    setMobileExpandedGroup(null);
  }, [location.pathname, location.search]);

  // Fermer le menu compte au clic extérieur
  useEffect(() => {
    function handler(e) {
      if (userDropRef.current && !userDropRef.current.contains(e.target)) {
        setUserDropOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Gestion hover avec petit délai pour confort utilisateur (évite fermeture intempestive)
  const handleMouseEnter = (key) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(key);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 160);
  };

  const initials = user
    ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '') || user.email?.[0] || '?').toUpperCase()
    : '';

  const handleLogout = () => {
    logout();
    setUserDropOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar" ref={navRef}>
      <div className="container navbar-inner">
        {/* ── Logo ── */}
        <Link to="/" className="navbar-logo">
          <img src={logoImg} alt="JogaLook" className="logo-img" />
        </Link>

        {/* ── Navigation Principale E-commerce ── */}
        <ul className={`navbar-links ${menuOpen ? 'active' : ''}`}>
          {/* 1. Catalogue direct */}
          <li className="navbar-item">
            <NavLink
              to="/catalogue"
              className={({ isActive }) => (isActive && !location.search ? 'active' : '')}
              onClick={() => setMenuOpen(false)}
            >
              Catalogue
            </NavLink>
          </li>

          {/* 2. Groupes dynamiques (Vêtements, Sport, Électronique...) */}
          {groups.map((group) => {
            const isOpen = activeDropdown === group.slug;
            const isMobileExpanded = mobileExpandedGroup === group.slug;
            const hasCategories = Array.isArray(group.categories) && group.categories.length > 0;

            return (
              <li
                key={group.id || group.slug}
                className={`navbar-item navbar-item--has-dropdown ${isOpen ? 'is-open' : ''}`}
                onMouseEnter={() => handleMouseEnter(group.slug)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Desktop trigger link */}
                <div className="navbar-dropdown-trigger-wrapper">
                  <NavLink
                    to={`/groupe/${group.slug}`}
                    className={`navbar-dropdown-trigger ${isOpen ? 'active' : ''}`}
                    onClick={(e) => {
                      // Sur mobile, ouvrir l'accordéon plutôt que naviguer immédiatement
                      if (window.innerWidth <= 768) {
                        e.preventDefault();
                        setMobileExpandedGroup(isMobileExpanded ? null : group.slug);
                      } else {
                        setActiveDropdown(null);
                      }
                    }}
                  >
                    <span>{group.name}</span>
                    <ChevronDown className={isOpen || isMobileExpanded ? 'is-rotated' : ''} />
                  </NavLink>
                </div>

                {/* Dropdown Menu Desktop & Mobile */}
                <div className={`navbar-dropdown-menu ${isOpen ? 'is-visible' : ''} ${isMobileExpanded ? 'is-mobile-expanded' : ''}`}>
                  <div className="navbar-dropdown-menu__header">
                    <span className="navbar-dropdown-menu__title">{group.name}</span>
                  </div>

                  <div className="navbar-dropdown-menu__list">
                    {hasCategories ? (
                      group.categories.map((cat) => (
                        <Link
                          key={cat.id || cat.slug}
                          to={`/catalogue?category=${encodeURIComponent(cat.name)}`}
                          className="navbar-dropdown-menu__link"
                          onClick={() => {
                            setActiveDropdown(null);
                            setMenuOpen(false);
                          }}
                        >
                          {cat.name}
                        </Link>
                      ))
                    ) : (
                      <span className="navbar-dropdown-menu__empty">
                        Catégories bientôt disponibles
                      </span>
                    )}
                  </div>

                  <div className="navbar-dropdown-menu__footer">
                    <Link
                      to={`/groupe/${group.slug}`}
                      className="navbar-dropdown-menu__see-all"
                      onClick={() => {
                        setActiveDropdown(null);
                        setMenuOpen(false);
                      }}
                    >
                      <span>Tout voir dans {group.name}</span>
                      <span className="navbar-dropdown-arrow">→</span>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}

          {/* 3. Toutes les catégories (mega-menu groupé) */}
          <li
            className={`navbar-item navbar-item--has-dropdown navbar-item--mega ${activeDropdown === 'all-categories' ? 'is-open' : ''}`}
            onMouseEnter={() => handleMouseEnter('all-categories')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="navbar-dropdown-trigger-wrapper">
              <button
                type="button"
                className={`navbar-dropdown-trigger navbar-dropdown-trigger--all ${activeDropdown === 'all-categories' ? 'active' : ''}`}
                onClick={(e) => {
                  if (window.innerWidth <= 768) {
                    e.preventDefault();
                    setMobileExpandedGroup(mobileExpandedGroup === 'all-categories' ? null : 'all-categories');
                  } else {
                    setActiveDropdown(activeDropdown === 'all-categories' ? null : 'all-categories');
                  }
                }}
              >
                <span>Toutes les catégories</span>
                <ChevronDown className={activeDropdown === 'all-categories' || mobileExpandedGroup === 'all-categories' ? 'is-rotated' : ''} />
              </button>
            </div>

            {/* Mega Dropdown */}
            <div className={`navbar-mega-dropdown ${activeDropdown === 'all-categories' ? 'is-visible' : ''} ${mobileExpandedGroup === 'all-categories' ? 'is-mobile-expanded' : ''}`}>
              <div className="navbar-mega-grid">
                {groups.map((group) => (
                  <div key={group.id || group.slug} className="navbar-mega-column">
                    <Link
                      to={`/groupe/${group.slug}`}
                      className="navbar-mega-column__title"
                      onClick={() => {
                        setActiveDropdown(null);
                        setMenuOpen(false);
                      }}
                    >
                      {group.name}
                    </Link>
                    <ul className="navbar-mega-column__list">
                      {(group.categories || []).slice(0, 6).map((cat) => (
                        <li key={cat.id || cat.slug}>
                          <Link
                            to={`/catalogue?category=${encodeURIComponent(cat.name)}`}
                            className="navbar-mega-column__link"
                            onClick={() => {
                              setActiveDropdown(null);
                              setMenuOpen(false);
                            }}
                          >
                            {cat.name}
                          </Link>
                        </li>
                      ))}
                      {(group.categories || []).length === 0 && (
                        <li className="navbar-mega-column__empty">Aucune catégorie</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Pied du menu : redirection vers le catalogue global */}
              <div className="navbar-mega-footer">
                <Link
                  to="/catalogue"
                  className="navbar-mega-footer__btn"
                  onClick={() => {
                    setActiveDropdown(null);
                    setMenuOpen(false);
                  }}
                >
                  <span>Tout voir dans le catalogue</span>
                  <span className="navbar-dropdown-arrow">→</span>
                </Link>
              </div>
            </div>
          </li>

          {/* ── Compte utilisateur Mobile (accordéon, même style que les groupes) ── */}
          {user ? (
            <li className={`navbar-mobile-account navbar-item navbar-item--has-dropdown ${mobileExpandedGroup === 'user-account' ? 'is-open' : ''}`}>
              {/* Trigger : avatar + nom + chevron */}
              <div className="navbar-dropdown-trigger-wrapper">
                <button
                  type="button"
                  className={`navbar-dropdown-trigger navbar-dropdown-trigger--user ${mobileExpandedGroup === 'user-account' ? 'active' : ''}`}
                  onClick={() => setMobileExpandedGroup(mobileExpandedGroup === 'user-account' ? null : 'user-account')}
                >
                  <span className="navbar-mobile-account__trigger-inner">
                    <span className="navbar-avatar navbar-avatar--sm">{initials}</span>
                    <span className="navbar-mobile-account__name">
                      {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
                    </span>
                  </span>
                  <ChevronDown className={mobileExpandedGroup === 'user-account' ? 'is-rotated' : ''} />
                </button>
              </div>

              {/* Options déroulantes */}
              <div className={`navbar-dropdown-menu navbar-dropdown-menu--user ${mobileExpandedGroup === 'user-account' ? 'is-mobile-expanded' : ''}`}>
                <div className="navbar-dropdown-menu__header">
                  <span className="navbar-dropdown__email">{user.email}</span>
                </div>
                <div className="navbar-dropdown-menu__list">
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <Link to="/admin" className="navbar-dropdown-menu__link" onClick={() => { setMobileExpandedGroup(null); setMenuOpen(false); }}>
                      <SettingsIcon size={15} /> Administration
                    </Link>
                  )}
                  <Link to="/mes-commandes" className="navbar-dropdown-menu__link" onClick={() => { setMobileExpandedGroup(null); setMenuOpen(false); }}>
                    📦 Mes commandes
                  </Link>
                  <Link to="/profil" className="navbar-dropdown-menu__link" onClick={() => { setMobileExpandedGroup(null); setMenuOpen(false); }}>
                    🎨 Mes créations & profil
                  </Link>
                </div>
                <div className="navbar-dropdown-menu__footer navbar-dropdown-menu__footer--logout">
                  <button
                    className="navbar-dropdown-menu__see-all navbar-dropdown-menu__see-all--logout"
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                  >
                    <LogOutIcon size={15} />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              </div>
            </li>
          ) : (
            <li className="navbar-mobile-auth">
              <Link
                to="/login"
                state={{ from: location.pathname + location.search }}
                className="navbar-mobile-login-link"
                onClick={() => setMenuOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Se connecter</span>
              </Link>
            </li>
          )}
        </ul>

        {/* ── Actions droite (Recherche, Compte Desktop, Panier) ── */}
        <div className="navbar-actions">
          <Link to="/recherche" className="icon-btn" aria-label="Rechercher">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>

          {/* Compte utilisateur Desktop */}
          {user ? (
            <div className="navbar-user navbar-user--desktop" ref={userDropRef}>
              <button
                className="navbar-avatar"
                onClick={() => setUserDropOpen(o => !o)}
                aria-label="Mon compte"
                aria-expanded={userDropOpen}
              >
                {initials}
              </button>
              {userDropOpen && (
                <div className="navbar-dropdown">
                  <div className="navbar-dropdown__header">
                    <span className="navbar-dropdown__name">
                      {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
                    </span>
                    <span className="navbar-dropdown__email">{user.email}</span>
                  </div>
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <Link to="/admin" className="navbar-dropdown__item" onClick={() => setUserDropOpen(false)}>
                      <SettingsIcon size={16} /> Administration
                    </Link>
                  )}
                  <Link to="/mes-commandes" className="navbar-dropdown__item" onClick={() => setUserDropOpen(false)}>
                    📦 Mes commandes
                  </Link>
                  <Link to="/profil" className="navbar-dropdown__item" onClick={() => setUserDropOpen(false)}>
                    🎨 Mes créations & profil
                  </Link>
                  <button className="navbar-dropdown__item navbar-dropdown__logout" onClick={handleLogout}>
                    <LogOutIcon size={16} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" state={{ from: location.pathname + location.search }} className="navbar-login-btn navbar-login-btn--desktop" aria-label="Connexion">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="navbar-login-text">Connexion</span>
            </Link>
          )}

          {/* Panier */}
          <Link to="/panier" className="icon-btn navbar-cart-btn" aria-label="Mon Panier">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="navbar-cart-badge">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Bouton Hamburger Mobile */}
          <button
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;