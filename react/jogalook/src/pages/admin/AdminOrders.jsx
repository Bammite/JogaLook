import { useState, useEffect, useCallback } from 'react';
import { EyeIcon, CloseIcon, OrderIcon, EmptyIcon } from './AdminIcons';

const API = '/api/orders';

const STATUS_OPTIONS = ['EN_ATTENTE','CONFIRMEE','EN_PREPARATION','EXPEDIEE','LIVREE','ANNULEE','REMBOURSEE'];
const STATUS_COLOR = { EN_ATTENTE:'amber', CONFIRMEE:'blue', EN_PREPARATION:'purple', EXPEDIEE:'blue', LIVREE:'green', ANNULEE:'red', REMBOURSEE:'gray' };

export default function AdminOrders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const json = await res.json();
      setItems(json.data ?? MOCK_ORDERS);
    } catch { setItems(MOCK_ORDERS); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.id?.includes(q) || o.users?.first_name?.toLowerCase().includes(q) || o.users?.last_name?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await fetch(`${API}/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      await load();
      setSelected(prev => prev ? { ...prev, status } : null);
    } catch { } finally { setUpdating(false); }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><OrderIcon /> <span>Commandes</span></h1>
          <p className="admin-page-subtitle">{items.length} commande(s) au total</p>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card__header">
            <h2 className="admin-card__title">Détail commande <span style={{ fontFamily:'monospace', fontSize:'0.85rem' }}>#{selected.id?.slice(0,8)}</span></h2>
            <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(null)}><CloseIcon /> Fermer</button>
          </div>
          <div className="admin-card__body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              {[
                { l: 'Client', v: `${selected.users?.first_name ?? '—'} ${selected.users?.last_name ?? ''}` },
                { l: 'Total', v: `${selected.total_price ?? '—'} €` },
                { l: 'Statut actuel', v: selected.status },
                { l: 'Date', v: selected.created_at ? new Date(selected.created_at).toLocaleString('fr-FR') : '—' },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: 'var(--admin-bg)', borderRadius: '10px', padding: '12px 14px' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--admin-text-muted)', margin: '0 0 4px' }}>{l}</p>
                  <p style={{ fontWeight: 600, color: 'var(--secondary)', margin: 0 }}>{v}</p>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>Changer le statut :</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={`admin-btn admin-btn--sm ${selected.status === s ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
                    onClick={() => updateStatus(selected.id, s)}
                    disabled={updating || selected.status === s}
                  >
                    {s.replace(/_/g,' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-toolbar">
            <div className="admin-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ID, client…" />
            </div>
            <select className="admin-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tous les statuts</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="admin-table-wrap">
          {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={6}><div className="admin-empty"><div className="admin-empty__icon"><OrderIcon /></div><p>Aucune commande</p></div></td></tr>
                  : filtered.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontFamily:'monospace', fontSize:'0.78rem' }}>#{o.id?.slice(0,8) ?? '—'}</td>
                      <td>{o.users?.first_name ?? '—'} {o.users?.last_name ?? ''}</td>
                      <td style={{ fontWeight:600 }}>{o.total_price != null ? `${o.total_price} €` : '—'}</td>
                      <td><span className={`admin-badge admin-badge--${STATUS_COLOR[o.status] ?? 'gray'}`}>{o.status?.replace(/_/g,' ') ?? '—'}</span></td>
                      <td style={{ color:'var(--admin-text-muted)', fontSize:'0.82rem' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td>
                        <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(o)}><EyeIcon /> Détail</button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const MOCK_ORDERS = [
  { id: 'a1b2c3d4-0001-0000-0000-000000000001', users:{ first_name:'Amadou', last_name:'Diallo' }, total_price:89.99, status:'EN_ATTENTE', created_at: new Date().toISOString() },
  { id: 'a1b2c3d4-0002-0000-0000-000000000002', users:{ first_name:'Fatou', last_name:'Sarr' }, total_price:145.00, status:'CONFIRMEE', created_at: new Date().toISOString() },
  { id: 'a1b2c3d4-0003-0000-0000-000000000003', users:{ first_name:'Oumar', last_name:'Ba' }, total_price:67.50, status:'LIVREE', created_at: new Date().toISOString() },
  { id: 'a1b2c3d4-0004-0000-0000-000000000004', users:{ first_name:'Aissatou', last_name:'Camara' }, total_price:212.00, status:'EN_PREPARATION', created_at: new Date().toISOString() },
];
