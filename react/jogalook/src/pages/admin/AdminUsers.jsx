import { useState, useEffect, useCallback } from 'react';
import { SearchIcon, TrashIcon, UserIcon } from './AdminIcons';

const API = '/api/users';

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const json = await res.json();
      setItems(json.data ?? MOCK_USERS);
    } catch { setItems(MOCK_USERS); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.email?.toLowerCase().includes(q) || u.first_name?.toLowerCase().includes(q) || u.last_name?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const softDelete = async (id) => {
    if (!confirm('Désactiver cet utilisateur ?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    await load();
  };

  const ROLE_COLOR = { ADMIN: 'red', SHOP_OWNER: 'purple', CLIENT: 'blue' };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><UserIcon /> <span>Utilisateurs</span></h1>
          <p className="admin-page-subtitle">{items.length} utilisateur(s) enregistré(s)</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-toolbar">
            <div className="admin-search">
              <SearchIcon />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, email…" />
            </div>
            <select className="admin-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">Tous les rôles</option>
              <option value="CLIENT">Client</option>
              <option value="SHOP_OWNER">Propriétaire boutique</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <div className="admin-table-wrap">
          {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Téléphone</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={6}><div className="admin-empty"><div className="admin-empty__icon"><UserIcon /></div><p>Aucun utilisateur trouvé</p></div></td></tr>
                  : filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'linear-gradient(135deg,var(--primary),var(--primary-dark))', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.82rem', flexShrink:0 }}>
                            {(u.first_name?.[0] ?? '?').toUpperCase()}
                          </div>
                          <span style={{ fontWeight:600 }}>{u.first_name} {u.last_name}</span>
                        </div>
                      </td>
                      <td style={{ color:'var(--admin-text-muted)' }}>{u.email}</td>
                      <td><span className={`admin-badge admin-badge--${ROLE_COLOR[u.role] ?? 'gray'}`}>{u.role ?? '—'}</span></td>
                      <td style={{ color:'var(--admin-text-muted)' }}>{u.phone ?? '—'}</td>
                      <td style={{ color:'var(--admin-text-muted)', fontSize:'0.82rem' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td>
                        <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => softDelete(u.id)} title="Désactiver"><TrashIcon /></button>
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

const MOCK_USERS = [
  { id:'1', first_name:'Amadou', last_name:'Diallo', email:'amadou@example.com', role:'CLIENT', phone:'+221 77 000 0001', created_at: new Date().toISOString() },
  { id:'2', first_name:'Fatou', last_name:'Sarr', email:'fatou@example.com', role:'SHOP_OWNER', phone:'+221 76 000 0002', created_at: new Date().toISOString() },
  { id:'3', first_name:'Admin', last_name:'Root', email:'admin@jogalook.com', role:'ADMIN', phone:'+221 70 000 0000', created_at: new Date().toISOString() },
];
