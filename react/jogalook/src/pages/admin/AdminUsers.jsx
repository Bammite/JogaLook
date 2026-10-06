import { useState, useEffect, useCallback } from 'react';
import { SearchIcon, TrashIcon, UserIcon } from './AdminIcons';
import { AdminModal } from './AdminModal';

const API = '/api/users';

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

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

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      email: user.email || '', first_name: user.first_name || '', last_name: user.last_name || '',
      phone: user.phone || '', role: user.role || 'CUSTOMER', status: user.status || 'PENDING',
      avatar_url: user.avatar_url || '',
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API}/${editingUser.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Impossible de modifier cet utilisateur.');
      setEditingUser(null);
      await load();
    } catch (error) { window.alert(error.message); }
    finally { setSaving(false); }
  };

  const ROLE_COLOR = { ADMIN: 'red', SUPER_ADMIN: 'red', SHOP_OWNER: 'purple', CUSTOMER: 'blue', DELIVERER: 'amber' };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><UserIcon /> <span>Utilisateurs</span></h1>
          <p className="admin-page-subtitle">{items.length} utilisateur(s) enregistré(s)</p>
        </div>
      </div>

      {editingUser && <AdminModal open onClose={() => setEditingUser(null)} title="Modifier l’utilisateur" size="lg" loading={saving}>
        <form onSubmit={save} className="admin-form-grid">
          <div className="admin-form-group admin-form-group--full"><label className="admin-form-label">Identifiant</label><input className="admin-form-input" value={editingUser.id} readOnly /></div>
          <div className="admin-form-group"><label className="admin-form-label">Prénom</label><input className="admin-form-input" value={form.first_name} onChange={e => setForm({...form,first_name:e.target.value})} /></div>
          <div className="admin-form-group"><label className="admin-form-label">Nom</label><input className="admin-form-input" value={form.last_name} onChange={e => setForm({...form,last_name:e.target.value})} /></div>
          <div className="admin-form-group"><label className="admin-form-label">Email *</label><input className="admin-form-input" type="email" required value={form.email} onChange={e => setForm({...form,email:e.target.value})} /></div>
          <div className="admin-form-group"><label className="admin-form-label">Téléphone</label><input className="admin-form-input" type="tel" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} /></div>
          <div className="admin-form-group"><label className="admin-form-label">Rôle</label><select className="admin-form-input" value={form.role} onChange={e => setForm({...form,role:e.target.value})}><option value="CUSTOMER">Client</option><option value="SHOP_OWNER">Boutiquier</option><option value="DELIVERER">Livreur</option><option value="ADMIN">Administrateur</option><option value="SUPER_ADMIN">Super administrateur</option></select></div>
          <div className="admin-form-group"><label className="admin-form-label">Statut</label><select className="admin-form-input" value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option value="PENDING">En attente</option><option value="ACTIVE">Actif</option><option value="SUSPENDED">Suspendu</option><option value="BLOCKED">Bloqué</option></select></div>
          <div className="admin-form-group admin-form-group--full"><label className="admin-form-label">URL de l’avatar</label><input className="admin-form-input" type="url" value={form.avatar_url} onChange={e => setForm({...form,avatar_url:e.target.value})} placeholder="https://…" /></div>
          <div className="admin-form-group admin-form-group--full" style={{color:'var(--admin-text-muted)',fontSize:'.82rem'}}>Le mot de passe et les dates de création/modification ne sont pas modifiables ici.</div>
          <div className="admin-form-group admin-form-group--full" style={{display:'flex',justifyContent:'flex-end',gap:8}}><button className="admin-btn admin-btn--ghost" type="button" onClick={() => setEditingUser(null)}>Annuler</button><button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button></div>
        </form>
      </AdminModal>}

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-toolbar">
            <div className="admin-search">
              <SearchIcon />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, email…" />
            </div>
            <select className="admin-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">Tous les rôles</option>
              <option value="CUSTOMER">Client</option>
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
                  <th>Statut</th>
                  <th>Téléphone</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={7}><div className="admin-empty"><div className="admin-empty__icon"><UserIcon /></div><p>Aucun utilisateur trouvé</p></div></td></tr>
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
                      <td><span className={`admin-badge admin-badge--${u.status === 'ACTIVE' ? 'green' : u.status === 'BLOCKED' || u.status === 'SUSPENDED' ? 'red' : 'gray'}`}>{u.status || 'PENDING'}</span></td>
                      <td style={{ color:'var(--admin-text-muted)' }}>{u.phone ?? '—'}</td>
                      <td style={{ color:'var(--admin-text-muted)', fontSize:'0.82rem' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td>
                        <div style={{display:'flex',gap:6}}><button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => openEdit(u)}>Modifier</button><button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => softDelete(u.id)} title="Désactiver"><TrashIcon /></button></div>
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
  { id:'1', first_name:'Amadou', last_name:'Diallo', email:'amadou@example.com', role:'CUSTOMER', status:'ACTIVE', phone:'+221 77 000 0001', created_at: new Date().toISOString() },
  { id:'2', first_name:'Fatou', last_name:'Sarr', email:'fatou@example.com', role:'SHOP_OWNER', phone:'+221 76 000 0002', created_at: new Date().toISOString() },
  { id:'3', first_name:'Admin', last_name:'Root', email:'admin@jogalook.com', role:'ADMIN', phone:'+221 70 000 0000', created_at: new Date().toISOString() },
];
