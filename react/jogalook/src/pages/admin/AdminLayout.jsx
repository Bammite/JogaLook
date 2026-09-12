import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';
import logoImg from '../../assets/Logo.png';
import {
  OverviewIcon,
  ProductIcon,
  VariantIcon,
  CategoryIcon,
  TemplateIcon,
  CustomizationIcon,
  OrderIcon,
  CartIcon,
  PaymentIcon,
  DeliveryIcon,
  UserIcon,
  ShopIcon,
  SupplierIcon,
  LogIcon,
  NewsIcon,
} from './AdminIcons';

const NAV_SECTIONS = [
  {
    label: "Vue d'ensemble",
    items: [
      { to: '/admin', icon: <OverviewIcon />, label: 'Dashboard', end: true },
    ]
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/produits', icon: <ProductIcon />, label: 'Produits' },
      { to: '/admin/variantes', icon: <VariantIcon />, label: 'Variantes & Stock' },
      { to: '/admin/categories', icon: <CategoryIcon />, label: 'Catégories' },
      { to: '/admin/groupes-categories', icon: <CategoryIcon />, label: 'Groupes de catégories' },
      { to: '/admin/templates', icon: <TemplateIcon />, label: 'Templates SVG' },
      { to: '/admin/personnalisations', icon: <CustomizationIcon />, label: 'Personnalisations' },
      { to: '/admin/mots-cles', icon: <ProductIcon />, label: 'Mots-clés produits' },
    ]
  },
  {
    label: 'Commerce',
    items: [
      { to: '/admin/commandes', icon: <OrderIcon />, label: 'Commandes' },
      { to: '/admin/paniers', icon: <CartIcon />, label: 'Paniers' },
      { to: '/admin/paiements', icon: <PaymentIcon />, label: 'Paiements' },
      { to: '/admin/livraisons', icon: <DeliveryIcon />, label: 'Livraisons' },
    ]
  },
  {
    label: 'Acteurs',
    items: [
      { to: '/admin/utilisateurs', icon: <UserIcon />, label: 'Utilisateurs' },
      { to: '/admin/boutiques', icon: <ShopIcon />, label: 'Boutiques' },
      { to: '/admin/fournisseurs', icon: <SupplierIcon />, label: 'Fournisseurs' },
    ]
  },
  {
    label: 'Éditorial',
    items: [
      { to: '/admin/actualites', icon: <NewsIcon />, label: 'Actualités sportives' },
    ]
  },
  {
    label: 'Système',
    items: [
      { to: '/admin/logs', icon: <LogIcon />, label: 'Logs' },
    ]
  },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Auto-collapse on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    setCollapsed(mq.matches);
    const handler = (e) => setCollapsed(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const adminInitials = user
    ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '') || user.email?.[0] || 'AD').toUpperCase()
    : 'AD';

  const displayName = user
    ? (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email)
    : 'Administrateur';

  return (
    <div className={`admin-root${collapsed ? ' admin-root--collapsed' : ''}${mobileOpen ? ' admin-root--mobile-open' : ''}`}>

      {/* ── OVERLAY mobile ── */}
      {mobileOpen && <div className="admin-overlay" onClick={closeMobile} />}

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside className={`admin-sidebar${mobileOpen ? ' admin-sidebar--mobile-open' : ''}`}>

        {/* Logo */}
        <div className="admin-sidebar__logo">
          <img src={logoImg} alt="JogaLook" />
          {!collapsed && <span className="admin-sidebar__logo-label">Admin</span>}
        </div>

        {/* Nav */}
        <nav className="admin-sidebar__nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="admin-sidebar__section">
              {!collapsed && (
                <p className="admin-sidebar__section-label">{section.label}</p>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
                  }
                  onClick={closeMobile}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="admin-sidebar__link-icon">{item.icon}</span>
                  {!collapsed && <span className="admin-sidebar__link-label">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          className="admin-sidebar__toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Agrandir' : 'Réduire'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {collapsed
              ? <><polyline points="9 18 15 12 9 6"/></>
              : <><polyline points="15 18 9 12 15 6"/></>
            }
          </svg>
          {!collapsed && <span>Réduire</span>}
        </button>
      </aside>

      {/* ══════════════ MAIN ══════════════ */}
      <div className="admin-main">

        {/* Topbar */}
        <header className="admin-topbar">
          {/* Mobile hamburger */}
          <button
            className="admin-topbar__hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>

          <div className="admin-topbar__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Rechercher dans l'administration..." />
          </div>

          <div className="admin-topbar__actions">
            <button className="admin-topbar__btn admin-topbar__btn--outline" onClick={() => navigate('/')} title="Voir le site public">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Site
            </button>

            <button className="admin-topbar__btn admin-topbar__btn--outline" onClick={handleLogout} title="Se déconnecter de l'administration">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Déconnexion
            </button>

            <div className="admin-topbar__avatar" title={`${displayName} (${user?.role || 'ADMIN'})`}>
              <span>{adminInitials}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
