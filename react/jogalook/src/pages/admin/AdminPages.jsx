import { useState, useEffect, useCallback } from 'react';
import { AdminModal } from './AdminModal';
import {
  AddIcon,
  CartIcon,
  CategoryIcon,
  ClockIcon,
  CloseIcon,
  CustomizationIcon,
  DeliveryIcon,
  EmptyIcon,
  LogIcon,
  LockIcon,
  OrderIcon,
  PaymentIcon,
  ProductIcon,
  SearchIcon,
  ShopIcon,
  SupplierIcon,
  TrashIcon,
  UserIcon,
  VariantIcon,
} from './AdminIcons';

// Generic CRUD table page — reused for Shops, Suppliers, Categories, Payments, Deliveries, Carts, Customizations, Variants, Logs

function useCrud(endpoint, mockData) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      setItems(json.data ?? mockData);
    } catch { setItems(mockData); }
    finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!confirm('Supprimer cet élément ?')) return;
    await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    await load();
  };

  return { items, loading, load, remove };
}

/* ══════════════════════════════ BOUTIQUES ══════════════════════════════ */
export function AdminShops() {
  const MOCK = [
    { id:'1', name:'JogaStyle Dakar', contact_email:'dakar@jogastyle.sn', is_active:true, created_at: new Date().toISOString() },
    { id:'2', name:'SportElite Abidjan', contact_email:'abidjan@sportelite.ci', is_active:true, created_at: new Date().toISOString() },
  ];
  const { items, loading, load, remove } = useCrud('/api/shops', MOCK);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', contact_email:'', description:'', is_active:true });
  const [saving, setSaving] = useState(false);
  const filtered = items.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await fetch('/api/shops', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) }); await load(); setShowForm(false); }
    catch {} finally { setSaving(false); }
  };

  return (
    <PageWrapper title="Boutiques" icon={<ShopIcon />} subtitle={`${items.length} boutique(s)`} onAdd={() => setShowForm(true)}>
      {showForm && (
        <InlineForm title="Nouvelle boutique" onClose={() => setShowForm(false)} onSubmit={save} saving={saving}>
          <Field label="Nom *" type="text" value={form.name} onChange={v => setForm({...form,name:v})} required />
          <Field label="Email de contact" type="email" value={form.contact_email} onChange={v => setForm({...form,contact_email:v})} />
          <Field label="Description" textarea value={form.description} onChange={v => setForm({...form,description:v})} full />
        </InlineForm>
      )}
      <SimpleTable
        search={search} onSearch={setSearch} placeholder="Rechercher une boutique…"
        columns={['Nom','Email','Statut','Date']} loading={loading} empty={{ icon:<ShopIcon />, text:'Aucune boutique' }}
        rows={filtered} renderRow={s => (
          <tr key={s.id}>
            <td style={{fontWeight:600}}>{s.name}</td>
            <td style={{color:'var(--admin-text-muted)'}}>{s.contact_email ?? '—'}</td>
            <td><span className={`admin-badge admin-badge--${s.is_active?'green':'red'}`}>{s.is_active?'Active':'Inactive'}</span></td>
            <td style={{color:'var(--admin-text-muted)',fontSize:'0.82rem'}}>{s.created_at?new Date(s.created_at).toLocaleDateString('fr-FR'):'—'}</td>
            <td><button className="admin-btn admin-btn--danger admin-btn--sm" onClick={()=>remove(s.id)}><TrashIcon /></button></td>
          </tr>
        )}
      />
    </PageWrapper>
  );
}

/* ══════════════════════════════ FOURNISSEURS ══════════════════════════════ */
export function AdminSuppliers() {
  const MOCK = [
    { id:'1', name:'SportTex International', contact_email:'contact@sportex.com', country:'France', created_at: new Date().toISOString() },
    { id:'2', name:'AfriFab', contact_email:'info@afrifab.sn', country:'Sénégal', created_at: new Date().toISOString() },
  ];
  const { items, loading, load, remove } = useCrud('/api/suppliers', MOCK);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', contact_email:'', phone:'', country:'' });
  const [saving, setSaving] = useState(false);
  const filtered = items.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await fetch('/api/suppliers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) }); await load(); setShowForm(false); }
    catch {} finally { setSaving(false); }
  };

  return (
    <PageWrapper title="Fournisseurs" icon={<SupplierIcon />} subtitle={`${items.length} fournisseur(s)`} onAdd={() => setShowForm(true)}>
      {showForm && (
        <InlineForm title="Nouveau fournisseur" onClose={() => setShowForm(false)} onSubmit={save} saving={saving}>
          <Field label="Nom *" type="text" value={form.name} onChange={v => setForm({...form,name:v})} required />
          <Field label="Email" type="email" value={form.contact_email} onChange={v => setForm({...form,contact_email:v})} />
          <Field label="Pays" type="text" value={form.country} onChange={v => setForm({...form,country:v})} />
        </InlineForm>
      )}
      <SimpleTable
        search={search} onSearch={setSearch} placeholder="Rechercher un fournisseur…"
        columns={['Nom','Email','Pays','Date']} loading={loading} empty={{ icon:<SupplierIcon />, text:'Aucun fournisseur' }}
        rows={filtered} renderRow={s => (
          <tr key={s.id}>
            <td style={{fontWeight:600}}>{s.name}</td>
            <td style={{color:'var(--admin-text-muted)'}}>{s.contact_email ?? '—'}</td>
            <td>{s.country ?? '—'}</td>
            <td style={{color:'var(--admin-text-muted)',fontSize:'0.82rem'}}>{s.created_at?new Date(s.created_at).toLocaleDateString('fr-FR'):'—'}</td>
            <td><button className="admin-btn admin-btn--danger admin-btn--sm" onClick={()=>remove(s.id)}><TrashIcon /></button></td>
          </tr>
        )}
      />
    </PageWrapper>
  );
}

/* ══════════════════════════════ CATÉGORIES ══════════════════════════════ */
export function AdminCategories() {
  const MOCK = [
    { id:'1', name:'Maillots', slug:'maillots', description:'Maillots premium', image_url:'', created_at: new Date().toISOString() },
    { id:'2', name:'Shorts', slug:'shorts', description:'Shorts de sport', image_url:'', created_at: new Date().toISOString() },
    { id:'3', name:'Survêtements', slug:'survetements', description:'Survêtements confortables', image_url:'', created_at: new Date().toISOString() },
  ];
  const { items, loading, load, remove } = useCrud('/api/categories', MOCK);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [parents, setParents] = useState([]);
  const [form, setForm] = useState({ name:'', slug:'', description:'', parent_id:'', image_url:'' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetch('/api/categories/parents')
      .then(res => res.json())
      .then(json => setParents(json.data ?? []))
      .catch(() => setParents([]));
  }, []);

  const filtered = items.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.slug?.toLowerCase().includes(search.toLowerCase()));

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'categories');
      fd.append('folder', 'categories');

      const res = await fetch('/api/upload', { method:'POST', body: fd });
      const json = await res.json();

      if (!res.ok || !json.success || !json.data?.publicUrl) {
        throw new Error(json.message || 'Erreur lors de l\'upload de l\'image');
      }

      setForm(prev => ({ ...prev, image_url: json.data.publicUrl }));
      setImagePreview(json.data.publicUrl);
    } catch (error) {
      alert(error.message || 'Impossible de téléverser l\'image');
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();

    if (!form.name || !form.slug || !form.description || !form.image_url) {
      alert('Tous les champs obligatoires doivent être remplis : nom, slug, description et image.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        parent_id: form.parent_id || null,
        slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };

      const res = await fetch('/api/categories', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Erreur lors de la création de la catégorie');
      }

      await load();
      setShowForm(false);
      setForm({ name:'', slug:'', description:'', parent_id:'', image_url:'' });
      setImagePreview('');
    }
    catch (error) {
      alert(error.message || 'Impossible de créer la catégorie');
    }
    finally { setSaving(false); }
  };

  return (
    <PageWrapper title="Catégories" icon={<CategoryIcon />} subtitle={`${items.length} catégorie(s)`} onAdd={() => setShowForm(true)}>
      {showForm && (
        <InlineForm title="Nouvelle catégorie" onClose={() => setShowForm(false)} onSubmit={save} saving={saving}>
          <Field label="Nom *" type="text" value={form.name} onChange={v => setForm({...form,name:v})} required />
          <Field label="Slug *" type="text" value={form.slug} onChange={v => setForm({...form,slug:v})} required />
          <div className="admin-form-group">
            <label className="admin-form-label">Catégorie parente</label>
            <select className="admin-form-input" value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}>
              <option value="">Aucune catégorie parente</option>
              {parents.filter(parent => parent.id !== form.parent_id).map(parent => (
                <option key={parent.id} value={parent.id}>{parent.name}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-group admin-form-group--full">
            <label className="admin-form-label">Image de catégorie *</label>
            <input className="admin-form-input" type="file" accept="image/*" onChange={uploadImage} disabled={uploading} />
            {uploading && <small style={{ display:'block', marginTop:'8px', color:'var(--admin-text-muted)' }}>Téléversement en cours…</small>}
            {imagePreview && (
              <div style={{ marginTop:'12px', display:'flex', alignItems:'center', gap:'12px' }}>
                <img src={imagePreview} alt="Aperçu catégorie" style={{ width:'72px', height:'72px', objectFit:'cover', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.12)' }} />
                <span style={{ color:'var(--admin-text-muted)', fontSize:'0.82rem' }}>Image sélectionnée</span>
              </div>
            )}
          </div>
          <div className="admin-form-group admin-form-group--full">
            <label className="admin-form-label">Description *</label>
            <textarea className="admin-form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
          </div>
        </InlineForm>
      )}
      <SimpleTable
        search={search} onSearch={setSearch} placeholder="Rechercher une catégorie…"
        columns={['Image','Nom','Parent','Slug','Date']} loading={loading} empty={{ icon:<CategoryIcon />, text:'Aucune catégorie' }}
        rows={filtered} renderRow={c => {
          const parent = parents.find(p => p.id === c.parent_id);
          return (
            <tr key={c.id}>
              <td>
                {c.image_url ? <img src={c.image_url} alt={c.name} style={{ width:'42px', height:'42px', objectFit:'cover', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.12)' }} /> : <span style={{ color:'var(--admin-text-muted)' }}>—</span>}
              </td>
              <td style={{fontWeight:600}}>{c.name}</td>
              <td>{parent ? parent.name : <span style={{color:'var(--admin-text-muted)'}}>Racine</span>}</td>
              <td><code style={{fontSize:'0.82rem',background:'var(--admin-bg)',padding:'2px 8px',borderRadius:'6px'}}>{c.slug ?? '—'}</code></td>
              <td style={{color:'var(--admin-text-muted)',fontSize:'0.82rem'}}>{c.created_at?new Date(c.created_at).toLocaleDateString('fr-FR'):'—'}</td>
              <td><button className="admin-btn admin-btn--danger admin-btn--sm" onClick={()=>remove(c.id)}><TrashIcon /></button></td>
            </tr>
          );
        }}
      />
    </PageWrapper>
  );
}

/* ══════════════════════════════ VARIANTES ══════════════════════════════ */
export function AdminVariants() {
  const MOCK = [
    { id:'1', product_id:'p1', sku:'MAI-BLU-L', size:'L', color_name:'Bleu', stock_quantity:14, price_override:null },
    { id:'2', product_id:'p1', sku:'MAI-RED-M', size:'M', color_name:'Rouge', stock_quantity:5, price_override:55.00 },
  ];
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ product_id:'', sku:'', size:'', color_name:'', color_hex:'#000000', stock_quantity:0, price_override:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [variantsRes, productsRes] = await Promise.all([
        fetch('/api/variants'),
        fetch('/api/products'),
      ]);

      const variantsJson = await variantsRes.json();
      const productsJson = await productsRes.json();

      setItems(variantsJson.data ?? MOCK);
      setProducts(productsJson.data ?? []);
    } catch {
      setItems(MOCK);
      setProducts([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(v => {
    const productLabel = products.find(p => p.id === v.product_id)?.name ?? '';
    return (v.sku?.toLowerCase().includes(search.toLowerCase()) || v.color_name?.toLowerCase().includes(search.toLowerCase()) || productLabel.toLowerCase().includes(search.toLowerCase()));
  });

  const save = async (e) => {
    e.preventDefault();
    if (!form.product_id) {
      alert('Le produit est obligatoire.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        product_id: form.product_id,
        stock_quantity: Number(form.stock_quantity || 0),
        price_override: form.price_override === '' ? null : Number(form.price_override),
      };

      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Impossible d\'enregistrer la variante');

      setShowForm(false);
      setForm({ product_id:'', sku:'', size:'', color_name:'', color_hex:'#000000', stock_quantity:0, price_override:'' });
      await load();
    } catch (error) {
      alert(error.message || 'Erreur lors de la création de la variante');
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette variante ?')) return;
    await fetch(`/api/variants/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <PageWrapper title="Variantes & Stock" icon={<VariantIcon />} subtitle={`${items.length} variante(s)`} onAdd={() => setShowForm(true)}>
      {showForm && (
        <InlineForm title="Nouvelle variante" onClose={() => setShowForm(false)} onSubmit={save} saving={saving}>
          <div className="admin-form-group">
            <label className="admin-form-label">Produit *</label>
            <select className="admin-form-select" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} required>
              <option value="">Sélectionner un produit</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">SKU</label>
            <input className="admin-form-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="MAI-BLU-L" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Taille</label>
            <input className="admin-form-input" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="S, M, L, XL" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Couleur</label>
            <input className="admin-form-input" value={form.color_name} onChange={e => setForm({ ...form, color_name: e.target.value })} placeholder="Bleu" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Couleur hex</label>
            <input className="admin-form-input" type="color" value={form.color_hex} onChange={e => setForm({ ...form, color_hex: e.target.value })} />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Stock</label>
            <input className="admin-form-input" type="number" min="0" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: Number(e.target.value) })} />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Prix spécial (€)</label>
            <input className="admin-form-input" type="number" step="0.01" value={form.price_override} onChange={e => setForm({ ...form, price_override: e.target.value })} placeholder="55.00" />
          </div>
        </InlineForm>
      )}
      <SimpleTable
        search={search} onSearch={setSearch} placeholder="Produit, SKU, couleur…"
        columns={['Produit','SKU','Taille','Couleur','Stock','Prix spécial']} loading={loading} empty={{ icon:<VariantIcon />, text:'Aucune variante' }}
        rows={filtered} renderRow={v => {
          const product = products.find(p => p.id === v.product_id);
          return (
            <tr key={v.id}>
              <td style={{fontWeight:600}}>{product?.name ?? '—'}</td>
              <td><code style={{fontSize:'0.82rem'}}>{v.sku ?? '—'}</code></td>
              <td><span className="admin-badge admin-badge--blue">{v.size ?? '—'}</span></td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  {v.color_hex && <span style={{width:'14px',height:'14px',borderRadius:'50%',background:v.color_hex,border:'1px solid #ddd',flexShrink:0}} />}
                  {v.color_name ?? '—'}
                </div>
              </td>
              <td>
                <span className={`admin-badge admin-badge--${v.stock_quantity > 10 ? 'green' : v.stock_quantity > 0 ? 'amber' : 'red'}`}>
                  {v.stock_quantity ?? 0}
                </span>
              </td>
              <td>{v.price_override != null ? `${v.price_override} €` : <span style={{color:'var(--admin-text-muted)'}}>—</span>}</td>
              <td><button className="admin-btn admin-btn--danger admin-btn--sm" onClick={()=>remove(v.id)}><TrashIcon /></button></td>
            </tr>
          );
        }}
      />
    </PageWrapper>
  );
}

/* ══════════════════════════════ PAIEMENTS ══════════════════════════════ */
export function AdminPayments() {
  const MOCK = [
    { id:'1', order_id:'ord-1', amount:89.99, method:'WAVE', status:'COMPLETED', created_at: new Date().toISOString() },
    { id:'2', order_id:'ord-2', amount:145.00, method:'ORANGE_MONEY', status:'PENDING', created_at: new Date().toISOString() },
  ];
  const { items, loading } = useCrud('/api/payments', MOCK);
  const [search, setSearch] = useState('');
  const filtered = items.filter(p => p.order_id?.includes(search) || p.method?.toLowerCase().includes(search.toLowerCase()));
  const STATUS_COLOR = { COMPLETED:'green', PENDING:'amber', FAILED:'red', REFUNDED:'purple' };

  return (
    <PageWrapper title="Paiements" icon={<PaymentIcon />} subtitle={`${items.length} paiement(s)`}>
      <SimpleTable
        search={search} onSearch={setSearch} placeholder="ID commande, méthode…"
        columns={['Commande','Montant','Méthode','Statut','Date']} loading={loading} empty={{ icon:<PaymentIcon />, text:'Aucun paiement' }}
        rows={filtered} renderRow={p => (
          <tr key={p.id}>
            <td style={{fontFamily:'monospace',fontSize:'0.78rem'}}>{p.order_id?.slice(0,8) ?? '—'}</td>
            <td style={{fontWeight:600}}>{p.amount} €</td>
            <td><span className="admin-badge admin-badge--blue">{p.method}</span></td>
            <td><span className={`admin-badge admin-badge--${STATUS_COLOR[p.status]??'gray'}`}>{p.status}</span></td>
            <td style={{color:'var(--admin-text-muted)',fontSize:'0.82rem'}}>{p.created_at?new Date(p.created_at).toLocaleDateString('fr-FR'):'—'}</td>
          </tr>
        )}
      />
    </PageWrapper>
  );
}

/* ══════════════════════════════ LIVRAISONS ══════════════════════════════ */
export function AdminDeliveries() {
  const MOCK = [
    { id:'1', order_id:'ord-1', carrier:'DHL', tracking_number:'DHL123456', status:'IN_TRANSIT', estimated_at: new Date().toISOString() },
    { id:'2', order_id:'ord-2', carrier:'La Poste', tracking_number:'LP789012', status:'DELIVERED', estimated_at: new Date().toISOString() },
  ];
  const { items, loading } = useCrud('/api/deliveries', MOCK);
  const [search, setSearch] = useState('');
  const filtered = items.filter(d => d.tracking_number?.includes(search) || d.carrier?.toLowerCase().includes(search.toLowerCase()));
  const STATUS_COLOR = { DELIVERED:'green', IN_TRANSIT:'blue', PENDING:'amber', FAILED:'red' };

  return (
    <PageWrapper title="Livraisons" icon={<DeliveryIcon />} subtitle={`${items.length} livraison(s)`}>
      <SimpleTable
        search={search} onSearch={setSearch} placeholder="Numéro de suivi, transporteur…"
        columns={['Commande','Transporteur','Suivi','Statut','Estimée']} loading={loading} empty={{ icon:<DeliveryIcon />, text:'Aucune livraison' }}
        rows={filtered} renderRow={d => (
          <tr key={d.id}>
            <td style={{fontFamily:'monospace',fontSize:'0.78rem'}}>{d.order_id?.slice(0,8) ?? '—'}</td>
            <td style={{fontWeight:600}}>{d.carrier}</td>
            <td><code style={{fontSize:'0.8rem'}}>{d.tracking_number ?? '—'}</code></td>
            <td><span className={`admin-badge admin-badge--${STATUS_COLOR[d.status]??'gray'}`}>{d.status}</span></td>
            <td style={{color:'var(--admin-text-muted)',fontSize:'0.82rem'}}>{d.estimated_at?new Date(d.estimated_at).toLocaleDateString('fr-FR'):'—'}</td>
          </tr>
        )}
      />
    </PageWrapper>
  );
}

/* ══════════════════════════════ PANIERS ══════════════════════════════ */
export function AdminCarts() {
  const MOCK = [
    { id:'1', user_id:'u1', item_count:3, created_at: new Date().toISOString() },
    { id:'2', user_id:'u2', item_count:1, created_at: new Date().toISOString() },
  ];
  const { items, loading } = useCrud('/api/cart', MOCK);
  const [search, setSearch] = useState('');

  return (
    <PageWrapper title="Paniers actifs" icon={<CartIcon />} subtitle={`${items.length} panier(s)`}>
      <SimpleTable
        search={search} onSearch={setSearch} placeholder="ID utilisateur…"
        columns={['ID Panier','Utilisateur','Articles','Créé le']} loading={loading} empty={{ icon:<CartIcon />, text:'Aucun panier actif' }}
        rows={items} renderRow={c => (
          <tr key={c.id}>
            <td style={{fontFamily:'monospace',fontSize:'0.78rem'}}>{c.id?.slice(0,8) ?? '—'}</td>
            <td style={{fontFamily:'monospace',fontSize:'0.82rem'}}>{c.user_id?.slice(0,8) ?? '—'}</td>
            <td><span className="admin-badge admin-badge--blue">{c.item_count ?? '—'} article(s)</span></td>
            <td style={{color:'var(--admin-text-muted)',fontSize:'0.82rem'}}>{c.created_at?new Date(c.created_at).toLocaleDateString('fr-FR'):'—'}</td>
          </tr>
        )}
      />
    </PageWrapper>
  );
}

/* ══════════════════════════════ PERSONNALISATIONS ══════════════════════════════ */
export function AdminCustomizations() {
  const MOCK = [
    { id:'1', user_id:'u1', template_id:'t1', name:'Mon maillot perso', created_at: new Date().toISOString() },
  ];
  const { items, loading } = useCrud('/api/customizations', MOCK);
  const [search, setSearch] = useState('');

  return (
    <PageWrapper title="Personnalisations" icon={<CustomizationIcon />} subtitle={`${items.length} personnalisation(s)`}>
      <SimpleTable
        search={search} onSearch={setSearch} placeholder="Nom, utilisateur…"
        columns={['Nom','Utilisateur','Template','Date']} loading={loading} empty={{ icon:<CustomizationIcon />, text:'Aucune personnalisation' }}
        rows={items.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))}
        renderRow={c => (
          <tr key={c.id}>
            <td style={{fontWeight:600}}>{c.name ?? '—'}</td>
            <td style={{fontFamily:'monospace',fontSize:'0.82rem'}}>{c.user_id?.slice(0,8) ?? '—'}</td>
            <td style={{fontFamily:'monospace',fontSize:'0.82rem'}}>{c.template_id?.slice(0,8) ?? '—'}</td>
            <td style={{color:'var(--admin-text-muted)',fontSize:'0.82rem'}}>{c.created_at?new Date(c.created_at).toLocaleDateString('fr-FR'):'—'}</td>
          </tr>
        )}
      />
    </PageWrapper>
  );
}

/* ══════════════════════════════ LOGS ══════════════════════════════ */
export function AdminLogs() {
  const MOCK_LOGIN = [
    { id:'1', email_attempted:'amadou@example.com', ip_address:'192.168.1.1', status:'SUCCESS', created_at: new Date().toISOString() },
    { id:'2', email_attempted:'hacker@evil.com', ip_address:'45.12.90.3', status:'FAILURE', failure_reason:'Mot de passe incorrect', created_at: new Date().toISOString() },
  ];
  const [tab, setTab] = useState('login');
  const { items: loginLogs, loading } = useCrud('/api/logs/login', MOCK_LOGIN);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><LogIcon /> <span>Logs</span></h1>
          <p className="admin-page-subtitle">Traçabilité du système</p>
        </div>
      </div>
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[
          ['login', <><LockIcon /> Connexions</>],
          ['orders', <><OrderIcon /> Commandes</>],
          ['reservations', <><ClockIcon /> Réservations</>],
        ].map(([k,l]) => (
          <button key={k} className={`admin-btn ${tab===k?'admin-btn--primary':'admin-btn--ghost'} admin-btn--sm`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'login' && (
        <div className="admin-card">
          <div className="admin-table-wrap">
            {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
              <table className="admin-table">
                <thead><tr><th>Email tenté</th><th>IP</th><th>Statut</th><th>Raison</th><th>Date</th></tr></thead>
                <tbody>
                  {loginLogs.map(l => (
                    <tr key={l.id}>
                      <td>{l.email_attempted}</td>
                      <td style={{fontFamily:'monospace',fontSize:'0.82rem'}}>{l.ip_address ?? '—'}</td>
                      <td><span className={`admin-badge admin-badge--${l.status==='SUCCESS'?'green':'red'}`}>{l.status}</span></td>
                      <td style={{color:'var(--admin-text-muted)',fontSize:'0.82rem'}}>{l.failure_reason ?? '—'}</td>
                      <td style={{color:'var(--admin-text-muted)',fontSize:'0.82rem'}}>{l.created_at?new Date(l.created_at).toLocaleString('fr-FR'):'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab !== 'login' && (
        <div className="admin-card">
          <div className="admin-empty" style={{padding:'60px'}}><div className="admin-empty__icon"><SearchIcon /></div><p>Sélectionnez une commande spécifique dans l'onglet Commandes pour voir son historique.</p></div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════ SHARED SUB-COMPONENTS ══════════════════════════════ */

function PageWrapper({ title, subtitle, icon, onAdd, children }) {
  const renderTitle = typeof title === 'string'
    ? icon
      ? <><span className="admin-page-title__icon">{icon}</span><span>{title}</span></>
      : title.split(' ').map((w,i) => i === 0 ? w + ' ' : null)
    : title;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{renderTitle}</h1>
          <p className="admin-page-subtitle">{subtitle}</p>
        </div>
        {onAdd && (
          <button className="admin-btn admin-btn--primary" onClick={onAdd}>
            <AddIcon />
            Nouveau
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function InlineForm({ title, onClose, onSubmit, saving, children }) {
  return (
    <AdminModal open={true} onClose={onClose} title={title} size="lg" loading={saving}>
      <form onSubmit={onSubmit} className="admin-form-grid">
        {children}
        <div className="admin-form-group admin-form-group--full" style={{ display:'flex', justifyContent:'flex-end' }}>
          <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : <><AddIcon /> Créer</>}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

function Field({ label, type='text', value, onChange, required=false, textarea=false, full=false }) {
  return (
    <div className={`admin-form-group${full?' admin-form-group--full':''}`}>
      <label className="admin-form-label">{label}</label>
      {textarea
        ? <textarea className="admin-form-textarea" value={value} onChange={e => onChange(e.target.value)} />
        : <input className="admin-form-input" type={type} value={value} required={required} onChange={e => onChange(e.target.value)} />
      }
    </div>
  );
}

function SimpleTable({ search, onSearch, placeholder, columns, rows, renderRow, loading, empty }) {
  return (
    <div className="admin-card">
      <div className="admin-card__header">
        <div className="admin-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder} />
        </div>
      </div>
      <div className="admin-table-wrap">
        {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
          <table className="admin-table">
            <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}<th></th></tr></thead>
            <tbody>
              {rows.length === 0
                ? <tr><td colSpan={columns.length+1}><div className="admin-empty"><div className="admin-empty__icon">{empty.icon}</div><p>{empty.text}</p></div></td></tr>
                : rows.map(renderRow)
              }
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
