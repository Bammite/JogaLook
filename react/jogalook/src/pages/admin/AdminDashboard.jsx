import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  OrderIcon,
  ProductIcon,
  UserIcon,
  PaymentIcon,
  ShopIcon,
  TemplateIcon,
  AddIcon,
  EyeIcon,
  ClockIcon,
  DeliveryIcon,
  LogIcon,
  LogsIcon,
} from './AdminIcons';

const API = '/api';

const STAT_CONFIG = [
  { label: 'Commandes', key: 'orders', icon: <OrderIcon />, color: 'primary', path: '/admin/commandes' },
  { label: 'Produits', key: 'products', icon: <ProductIcon />, color: 'blue', path: '/admin/produits' },
  { label: 'Utilisateurs', key: 'users', icon: <UserIcon />, color: 'green', path: '/admin/utilisateurs' },
  { label: 'Paiements', key: 'payments', icon: <PaymentIcon />, color: 'purple', path: '/admin/paiements' },
  { label: 'Boutiques', key: 'shops', icon: <ShopIcon />, color: 'amber', path: '/admin/boutiques' },
  { label: 'Templates SVG', key: 'templates', icon: <TemplateIcon />, color: 'blue', path: '/admin/templates' },
];

const STATUS_COLOR = {
  EN_ATTENTE: 'amber',
  CONFIRMEE: 'blue',
  EN_PREPARATION: 'purple',
  EXPEDIEE: 'blue',
  LIVREE: 'green',
  ANNULEE: 'red',
  REMBOURSEE: 'gray',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, productsRes, usersRes, paymentsRes, shopsRes, templatesRes] = await Promise.all([
          fetch(`${API}/orders?limit=5`),
          fetch(`${API}/products?limit=1`),
          fetch(`${API}/users?limit=1`),
          fetch(`${API}/payments?limit=1`),
          fetch(`${API}/shops?limit=1`),
          fetch(`${API}/templates?limit=1`),
        ]);
        const [od, pd, ud, pay, sh, tp] = await Promise.all([
          ordersRes.json(), productsRes.json(), usersRes.json(),
          paymentsRes.json(), shopsRes.json(), templatesRes.json(),
        ]);
        setStats({
          orders: od.count ?? od.data?.length ?? '—',
          products: pd.count ?? '—',
          users: ud.count ?? '—',
          payments: pay.count ?? '—',
          shops: sh.count ?? '—',
          templates: tp.count ?? '—',
        });
        setRecentOrders(od.data?.slice(0, 5) ?? []);
      } catch {
        /* API pas encore connectée — données factices */
        setStats({ orders: 142, products: 87, users: 1240, payments: 138, shops: 12, templates: 34 });
        setRecentOrders(MOCK_ORDERS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard <span>JogaLook</span></h1>
          <p className="admin-page-subtitle">Vue d'ensemble de votre activité</p>
        </div>
        <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        {STAT_CONFIG.map((s) => (
          <Link to={s.path} key={s.key} style={{ textDecoration: 'none' }}>
            <div className="admin-stat-card">
              <div className={`admin-stat-icon admin-stat-icon--${s.color}`}>{s.icon}</div>
              <div className="admin-stat-info">
                <p className="admin-stat-label">{s.label}</p>
                <p className="admin-stat-value">{loading ? '…' : stats[s.key]}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick-access grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent orders */}
        <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
          <div className="admin-card__header">
            <h2 className="admin-card__title"><OrderIcon /> Commandes récentes</h2>
            <Link to="/admin/commandes" className="admin-btn admin-btn--ghost admin-btn--sm">Voir tout</Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Chargement…</td></tr>
                  : recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>#{o.id?.slice(0,8) ?? '—'}</td>
                      <td>{o.users?.first_name ?? '—'} {o.users?.last_name ?? ''}</td>
                      <td style={{ fontWeight: 600 }}>{o.total_price != null ? `${o.total_price} €` : '—'}</td>
                      <td>
                        <span className={`admin-badge admin-badge--${STATUS_COLOR[o.status] ?? 'gray'}`}>
                          {o.status?.replace(/_/g, ' ') ?? '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick links */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h2 className="admin-card__title">Accès rapide</h2>
          </div>
          <div className="admin-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { to: '/admin/produits', label: 'Ajouter un produit', icon: <AddIcon /> },
              { to: '/admin/templates', label: 'Nouveau template SVG', icon: <TemplateIcon /> },
              { to: '/admin/utilisateurs', label: 'Gérer les utilisateurs', icon: <UserIcon /> },
              { to: '/admin/logs', label: 'Voir les logs', icon: <LogIcon /> },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="admin-btn admin-btn--ghost" style={{ justifyContent: 'flex-start' }}>
                {l.icon} {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h2 className="admin-card__title">Activité récente</h2>
          </div>
          <div className="admin-card__body">
            {MOCK_ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: i < MOCK_ACTIVITY.length - 1 ? '16px' : 0 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--admin-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: 0 }}>{a.text}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '2px 0 0' }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_ORDERS = [
  { id: 'a1b2c3d4-0000-0000-0000-000000000001', users: { first_name: 'Amadou', last_name: 'Diallo' }, total_price: 89.99, status: 'EN_ATTENTE', created_at: new Date().toISOString() },
  { id: 'a1b2c3d4-0000-0000-0000-000000000002', users: { first_name: 'Fatou', last_name: 'Sarr' }, total_price: 145.00, status: 'CONFIRMEE', created_at: new Date().toISOString() },
  { id: 'a1b2c3d4-0000-0000-0000-000000000003', users: { first_name: 'Oumar', last_name: 'Ba' }, total_price: 67.50, status: 'LIVREE', created_at: new Date().toISOString() },
  { id: 'a1b2c3d4-0000-0000-0000-000000000004', users: { first_name: 'Aissatou', last_name: 'Camara' }, total_price: 212.00, status: 'EN_PREPARATION', created_at: new Date().toISOString() },
];

const MOCK_ACTIVITY = [
  { icon: <OrderIcon />, text: 'Nouvelle commande reçue de Amadou Diallo', time: 'Il y a 5 min' },
  { icon: <UserIcon />, text: 'Nouvel utilisateur inscrit : Fatou Sarr', time: 'Il y a 23 min' },
  { icon: <PaymentIcon />, text: 'Paiement confirmé — 145,00 €', time: 'Il y a 1 h' },
  { icon: <TemplateIcon />, text: 'Nouveau template SVG ajouté', time: 'Il y a 2 h' },
  { icon: <DeliveryIcon />, text: 'Livraison expédiée — commande #a1b2c3', time: 'Il y a 3 h' },
];
