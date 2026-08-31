import { useState, useEffect, useCallback } from 'react';
import { AddIcon, CloseIcon, EditIcon, SearchIcon, EmptyIcon, ProductIcon, TrashIcon } from './AdminIcons';
import { AdminModal } from './AdminModal';

const API = '/api/products';

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  base_price: '',
  image_url: '',
  category_id: '',
  shop_id: '',
  supplier_id: '',
  template_id: '',
  is_customizable: false,
  is_active: true,
};

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [templates, setTemplates] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, shopsRes, suppliersRes, templatesRes] = await Promise.all([
        fetch(API),
        fetch('/api/categories'),
        fetch('/api/shops'),
        fetch('/api/suppliers'),
        fetch('/api/templates'),
      ]);

      const productsJson = await productsRes.json();
      const categoriesJson = await categoriesRes.json();
      const shopsJson = await shopsRes.json();
      const suppliersJson = await suppliersRes.json();
      const templatesJson = await templatesRes.json();

      setItems(productsJson.data ?? MOCK_PRODUCTS);
      setCategories(categoriesJson.data ?? []);
      setShops(shopsJson.data ?? []);
      setSuppliers(suppliersJson.data ?? []);
      setTemplates(templatesJson.data ?? []);
    } catch {
      setItems(MOCK_PRODUCTS);
      setCategories([]);
      setShops([]);
      setSuppliers([]);
      setTemplates([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      ...EMPTY,
      ...p,
      base_price: p.base_price ?? '',
      category_id: p.category_id ?? '',
      shop_id: p.shop_id ?? '',
      supplier_id: p.supplier_id ?? '',
      is_customizable: !!p.is_customizable,
      is_active: p.is_active !== false,
    });
    setShowForm(true);
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'products');
      fd.append('folder', 'products');

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok || !json.success || !json.data?.publicUrl) {
        throw new Error(json.message || 'Erreur lors de l\'upload de l\'image');
      }

      setForm(prev => ({ ...prev, image_url: json.data.publicUrl }));
    } catch (error) {
      alert(error.message || 'Impossible de téléverser l\'image');
    }
  };

  const save = async (e) => {
    e.preventDefault();

    if (!form.name || !form.base_price || !form.category_id || !form.image_url) {
      alert('Les champs nom, image, prix de base et catégorie sont obligatoires.');
      return;
    }

    if (form.is_customizable && !form.template_id) {
      alert('Un produit personnalisable doit être lié à un template.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        image_url: form.image_url,
        base_price: Number(form.base_price),
        slug: form.slug?.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        shop_id: form.shop_id || null,
        supplier_id: form.supplier_id || null,
        template_id: form.is_customizable ? form.template_id : null,
        category_id: form.category_id,
      };

      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API}/${editing.id}` : API;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Erreur lors de l\'enregistrement du produit');
      }

      await load();
      setShowForm(false);
    } catch (error) {
      alert(error.message || 'Impossible d\'enregistrer le produit');
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><ProductIcon /> <span>Produits</span></h1>
          <p className="admin-page-subtitle">{items.length} produit(s) au catalogue</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>
          <AddIcon />
          Nouveau produit
        </button>
      </div>

      <AdminModal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Modifier le produit' : 'Nouveau produit'} size="lg" loading={saving}>
        <form onSubmit={save} className="admin-form-grid">
          <div className="admin-form-group">
            <label className="admin-form-label">Nom *</label>
            <input className="admin-form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ex: Maillot Premium" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Slug</label>
            <input className="admin-form-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="ex: maillot-premium" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Catégorie *</label>
            <select className="admin-form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Boutique</label>
            <select className="admin-form-select" value={form.shop_id} onChange={e => setForm({ ...form, shop_id: e.target.value })}>
              <option value="">Aucune boutique</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Fournisseur</label>
            <select className="admin-form-select" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">Aucun fournisseur</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Prix de base (€) *</label>
            <input className="admin-form-input" type="number" step="0.01" required value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} placeholder="ex: 49.99" />
          </div>

          <div className="admin-form-group admin-form-group--full">
            <label className="admin-form-label">Image du produit *</label>
            <input className="admin-form-input" type="file" accept="image/*" onChange={uploadImage} />
            {form.image_url && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={form.image_url} alt="Aperçu produit" style={{ width:'72px', height:'72px', objectFit:'cover', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.12)' }} />
                <span style={{ color:'var(--admin-text-muted)', fontSize:'0.82rem' }}>Image chargée</span>
              </div>
            )}
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Personnalisable</label>
            <select className="admin-form-select" value={String(form.is_customizable)} onChange={e => setForm({ ...form, is_customizable: e.target.value === 'true', template_id: e.target.value === 'true' ? form.template_id : '' })}>
              <option value="false">Non</option>
              <option value="true">Oui</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Template</label>
            <select className="admin-form-select" value={form.template_id} onChange={e => setForm({ ...form, template_id: e.target.value })} disabled={!form.is_customizable}>
              <option value="">Sélectionner un template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Statut</label>
            <select className="admin-form-select" value={String(form.is_active)} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>

          <div className="admin-form-group admin-form-group--full">
            <label className="admin-form-label">Description</label>
            <textarea className="admin-form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description du produit…" />
          </div>

          <div className="admin-form-group admin-form-group--full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : (editing ? <><EditIcon /> Mettre à jour</> : <><AddIcon /> Créer</>)}
            </button>
          </div>
        </form>
      </AdminModal>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-toolbar">
            <div className="admin-search">
              <SearchIcon />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit…" />
            </div>
          </div>
        </div>
        <div className="admin-table-wrap">
          {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prix</th>
                  <th>Catégorie</th>
                  <th>Personnalisable</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={7}><div className="admin-empty"><div className="admin-empty__icon"><ProductIcon /></div><p>Aucun produit trouvé</p></div></td></tr>
                  : filtered.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.base_price != null ? `${p.base_price} €` : '—'}</td>
                      <td>{p.category_id ? (categories.find(c => c.id === p.category_id)?.name ?? '—') : '—'}</td>
                      <td><span className={`admin-badge admin-badge--${p.is_customizable ? 'purple' : 'gray'}`}>{p.is_customizable ? 'Oui' : 'Non'}</span></td>
                      <td><span className={`admin-badge admin-badge--${p.is_active ? 'green' : 'red'}`}>{p.is_active ? 'Actif' : 'Inactif'}</span></td>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="admin-btn admin-btn--icon admin-btn--sm" onClick={() => openEdit(p)} title="Modifier"><EditIcon /></button>
                          <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => remove(p.id)} title="Supprimer"><TrashIcon /></button>
                        </div>
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

const MOCK_PRODUCTS = [
  { id: '1', name: 'Maillot Premium', base_price: 49.99, is_customizable: true, is_active: true, created_at: new Date().toISOString() },
  { id: '2', name: 'Short Entraînement', base_price: 29.99, is_customizable: false, is_active: true, created_at: new Date().toISOString() },
  { id: '3', name: 'Survêtement Club', base_price: 89.99, is_customizable: true, is_active: false, created_at: new Date().toISOString() },
];
