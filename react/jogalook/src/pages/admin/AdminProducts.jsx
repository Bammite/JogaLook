import { useState, useEffect, useCallback } from 'react';
import { AddIcon, CloseIcon, EditIcon, SearchIcon, EmptyIcon, ProductIcon, TrashIcon } from './AdminIcons';
import { AdminModal } from './AdminModal';

const API = '/api/products';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  base_price: '',
  image_url: '',
  images: [], // Tableau [{ id, url, alt_text, position, is_primary }]
  variants: [], // Tableau [{ id?, size, color_name, color_hex, stock_quantity, price_override }]
  category_id: '',
  shop_id: '',
  supplier_id: '',
  template_id: '',
  is_customizable: false,
  is_active: true,
  display_order: '',
};

const normalizeVariant = (variant = {}) => ({
  id: variant.id ?? undefined,
  size: variant.size ?? '',
  color_name: variant.color_name ?? '',
  color_hex: variant.color_hex || '#000000',
  stock_quantity: Number(variant.stock_quantity) || 0,
  price_override: variant.price_override ?? '',
});

const deduplicateVariants = (variants = []) => {
  const seen = new Map();

  variants.forEach((variant) => {
    const normalized = normalizeVariant(variant);
    const key = `${(normalized.size || '').trim().toLowerCase()}::${(normalized.color_name || '').trim().toLowerCase()}::${normalized.color_hex || '#000000'}`;

    if (!seen.has(key)) {
      seen.set(key, normalized);
    }
  });

  return Array.from(seen.values());
};

const createEmptyForm = () => ({
  ...EMPTY,
  images: [],
  variants: [],
});

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [savingScoreId, setSavingScoreId] = useState(null);

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

  const openCreate = () => {
    setEditing(null);
    setForm(createEmptyForm());
    setCustomUrlInput('');
    setShowUrlInput(false);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setCustomUrlInput('');
    setShowUrlInput(false);

    let initialImages = [];
    if (p.product_images && p.product_images.length > 0) {
      initialImages = [...p.product_images]
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((img, idx) => ({
          id: img.id,
          url: img.url,
          is_primary: img.is_primary !== undefined ? Boolean(img.is_primary) : (idx === 0),
          position: img.position ?? idx,
          alt_text: img.alt_text || '',
        }));
    } else if (p.image_url) {
      initialImages = [{
        url: p.image_url,
        is_primary: true,
        position: 0,
        alt_text: p.name || '',
      }];
    }

    if (initialImages.length > 0 && !initialImages.some(img => img.is_primary)) {
      initialImages[0].is_primary = true;
    }

    const primaryImg = initialImages.find(img => img.is_primary)?.url || p.image_url || '';

    const initialVariants = deduplicateVariants((p.product_variants || []).filter(v => !v.deleted_at));

    setForm({
      name: p.name || '',
      slug: p.slug || '',
      description: p.description || '',
      base_price: p.base_price ?? '',
      image_url: primaryImg,
      images: initialImages,
      variants: initialVariants,
      category_id: p.category_id ?? '',
      shop_id: p.shop_id ?? '',
      supplier_id: p.supplier_id ?? '',
      template_id: p.template_id ?? '',
      is_customizable: Boolean(p.is_customizable),
      is_active: p.is_active !== false,
      display_order: p.display_order ?? '',
    });
    setShowForm(true);
  };

  // Upload de plusieurs images à la fois
  const handleUploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    setUploadProgress(`0 / ${files.length}`);

    const uploaded = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`${i + 1} / ${files.length} (${file.name})`);

      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('bucket', 'products');
        fd.append('folder', 'products');

        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();

        if (res.ok && json.success && json.data?.publicUrl) {
          uploaded.push({
            url: json.data.publicUrl,
            alt_text: file.name.replace(/\.[^/.]+$/, ''),
          });
        }
      } catch (err) {
        console.error('Erreur téléversement image:', err);
      }
    }

    if (uploaded.length > 0) {
      setForm(prev => {
        const currentImages = prev.images || [];
        const isFirstBatch = currentImages.length === 0;
        const newImages = [
          ...currentImages,
          ...uploaded.map((item, idx) => ({
            url: item.url,
            alt_text: item.alt_text || '',
            is_primary: isFirstBatch && idx === 0,
            position: currentImages.length + idx,
          }))
        ];

        const primaryUrl = newImages.find(img => img.is_primary)?.url || newImages[0]?.url || '';

        return {
          ...prev,
          images: newImages,
          image_url: primaryUrl,
        };
      });
    }

    setUploadingImages(false);
    setUploadProgress('');
    event.target.value = '';
  };

  // Définir une image comme principale
  const handleSetPrimary = (index) => {
    setForm(prev => {
      const updated = prev.images.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      }));
      return {
        ...prev,
        images: updated,
        image_url: updated[index]?.url || prev.image_url,
      };
    });
  };

  // Supprimer une image de la liste
  const handleRemoveImage = (index) => {
    setForm(prev => {
      const wasPrimary = prev.images[index]?.is_primary;
      const filtered = prev.images.filter((_, idx) => idx !== index);
      const reindexed = filtered.map((img, idx) => ({
        ...img,
        position: idx,
        is_primary: wasPrimary && idx === 0 ? true : img.is_primary,
      }));

      if (reindexed.length > 0 && !reindexed.some(img => img.is_primary)) {
        reindexed[0].is_primary = true;
      }

      const primaryUrl = reindexed.find(img => img.is_primary)?.url || '';

      return {
        ...prev,
        images: reindexed,
        image_url: primaryUrl,
      };
    });
  };

  // Déplacer l'ordre des images
  const handleMoveImage = (index, direction) => {
    setForm(prev => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;

      const newImages = [...prev.images];
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;

      const reindexed = newImages.map((img, idx) => ({
        ...img,
        position: idx,
      }));

      return {
        ...prev,
        images: reindexed,
      };
    });
  };

  // Ajouter par URL directe
  const handleAddDirectUrl = () => {
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    setForm(prev => {
      const currentImages = prev.images || [];
      const isFirst = currentImages.length === 0;
      const newImages = [
        ...currentImages,
        {
          url,
          alt_text: 'Image produit',
          is_primary: isFirst,
          position: currentImages.length,
        }
      ];
      const primaryUrl = newImages.find(img => img.is_primary)?.url || newImages[0]?.url || '';
      return {
        ...prev,
        images: newImages,
        image_url: primaryUrl,
      };
    });
    setCustomUrlInput('');
    setShowUrlInput(false);
  };

  const save = async (e) => {
    e.preventDefault();

    const imagesList = form.images || [];
    const primaryUrl = imagesList.find(img => img.is_primary)?.url || imagesList[0]?.url || form.image_url;

    if (!form.name || !form.base_price || !form.category_id || (!primaryUrl && imagesList.length === 0)) {
      alert('Les champs nom, catégorie, prix de base et au moins une image sont obligatoires.');
      return;
    }

    if (form.is_customizable && !form.template_id) {
      alert('Un produit personnalisable doit être lié à un template.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug?.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: form.description || null,
        base_price: Number(form.base_price),
        category_id: form.category_id,
        shop_id: form.shop_id || null,
        supplier_id: form.supplier_id || null,
        template_id: form.is_customizable ? form.template_id : null,
        is_customizable: Boolean(form.is_customizable),
        is_active: Boolean(form.is_active),
        image_url: primaryUrl,
        images: imagesList.map((img, idx) => ({
          url: img.url,
          alt_text: img.alt_text || `${form.name} - Vue ${idx + 1}`,
          position: idx,
          is_primary: !!img.is_primary,
        })),
        variants: (form.variants || []).map(v => ({
          ...(v.id ? { id: v.id } : {}),
          size: v.size || null,
          color_name: v.color_name || null,
          color_hex: v.color_hex || null,
          stock_quantity: Number(v.stock_quantity) || 0,
          price_override: v.price_override !== '' && v.price_override != null ? Number(v.price_override) : null,
        })),
        display_order: form.display_order !== '' && form.display_order != null ? Number(form.display_order) : null,
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

  const handleInlineScoreChange = async (productId, val) => {
    const rawVal = val.trim();
    const parsed = rawVal === '' ? null : Number(rawVal);
    if (rawVal !== '' && isNaN(parsed)) return;

    setSavingScoreId(productId);
    try {
      const res = await fetch(`${API}/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: parsed }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      await load();
    } catch (err) {
      alert('Erreur lors de la modification du score : ' + err.message);
    } finally {
      setSavingScoreId(null);
    }
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
            <input className="admin-form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ex: Maillot Domicile 2025" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Slug</label>
            <input className="admin-form-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="ex: maillot-domicile-2025" />
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
            <label className="admin-form-label">Prix de base (€ / FCFA) *</label>
            <input className="admin-form-input" type="number" step="0.01" required value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} placeholder="ex: 49.99" />
          </div>

          {/* ── GESTION MULTI-IMAGES DU PRODUIT ── */}
          <div className="admin-form-group admin-form-group--full" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--admin-border)',
            borderRadius: '14px',
            padding: '16px',
            marginTop: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <label className="admin-form-label" style={{ marginBottom: '2px', fontWeight: '600' }}>
                  Galerie & Photos du produit *
                </label>
                <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem', display: 'block' }}>
                  {form.images?.length || 0} photo(s) ajoutée(s). La photo marquée ★ sera la couverture principale du catalogue.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: uploadingImages ? 'not-allowed' : 'pointer',
                  opacity: uploadingImages ? 0.7 : 1,
                  userSelect: 'none'
                }}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadImages}
                    disabled={uploadingImages}
                    style={{ display: 'none' }}
                  />
                  <span>📁 {uploadingImages ? 'Téléversement...' : 'Ajouter des photos'}</span>
                </label>

                <button
                  type="button"
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  style={{ fontSize: '0.82rem' }}
                >
                  🔗 Par URL
                </button>
              </div>
            </div>

            {/* Téléversement en cours */}
            {uploadingImages && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: 'rgba(241, 90, 36, 0.1)',
                border: '1px solid rgba(241, 90, 36, 0.3)',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '0.85rem',
                color: 'var(--primary)'
              }}>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(241,90,36,0.3)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                <span>Téléversement en cours : {uploadProgress}…</span>
              </div>
            )}

            {/* Champ ajout URL direct */}
            {showUrlInput && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                <input
                  type="url"
                  className="admin-form-input"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '0.85rem' }}
                  placeholder="https://exemple.com/image.jpg"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDirectUrl(); } }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn--primary admin-btn--sm"
                  onClick={handleAddDirectUrl}
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--icon admin-btn--sm"
                  onClick={() => setShowUrlInput(false)}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Grille des photos */}
            {(!form.images || form.images.length === 0) ? (
              <div style={{
                border: '2px dashed var(--admin-border)',
                borderRadius: '10px',
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--admin-text-muted)'
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>🖼️</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>Aucune photo pour ce produit</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  Cliquez sur <strong>« Ajouter des photos »</strong> pour importer plusieurs images en une seule fois.
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '12px',
                marginTop: '10px'
              }}>
                {form.images.map((img, idx) => (
                  <div
                    key={img.id || img.url || idx}
                    style={{
                      position: 'relative',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: img.is_primary ? '2px solid var(--primary)' : '1px solid var(--admin-border)',
                      background: '#111',
                      boxShadow: img.is_primary ? '0 0 10px rgba(241, 90, 36, 0.35)' : 'none',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Badge Principale */}
                    {img.is_primary ? (
                      <div style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background: 'var(--primary)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        zIndex: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        ★ Principale
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        title="Définir comme image principale"
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          zIndex: 2,
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        ☆ Choisir
                      </button>
                    )}

                    {/* Bouton Supprimer */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      title="Supprimer cette image"
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'rgba(220, 38, 38, 0.85)',
                        color: '#fff',
                        border: 'none',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 2,
                        fontSize: '0.75rem'
                      }}
                    >
                      ✕
                    </button>

                    {/* Image Preview */}
                    <div style={{ width: '100%', height: '110px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={img.url}
                        alt={`Photo ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=400&h=400&fit=crop'; }}
                      />
                    </div>

                    {/* Barre d'actions & réordonnancement */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 6px',
                      background: 'rgba(0,0,0,0.4)',
                      borderTop: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                        #{idx + 1}
                      </span>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, -1)}
                          title="Déplacer vers la gauche"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: idx === 0 ? '#555' : '#fff',
                            cursor: idx === 0 ? 'default' : 'pointer',
                            fontSize: '0.8rem',
                            padding: '1px 4px'
                          }}
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          disabled={idx === form.images.length - 1}
                          onClick={() => handleMoveImage(idx, 1)}
                          title="Déplacer vers la droite"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: idx === form.images.length - 1 ? '#555' : '#fff',
                            cursor: idx === form.images.length - 1 ? 'default' : 'pointer',
                            fontSize: '0.8rem',
                            padding: '1px 4px'
                          }}
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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

          <div className="admin-form-group">
            <label className="admin-form-label">Score de mise en avant</label>
            <input
              type="number"
              min="0"
              step="1"
              className="admin-form-input"
              value={form.display_order}
              onChange={e => setForm({ ...form, display_order: e.target.value })}
              placeholder="ex: 100, 50, 10... (0 = standard)"
            />
            <small style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              Plus le score est élevé, plus le produit apparaît en tête. Si score égal ou absent (0), tri par prix croissant (les moins chers d'abord).
            </small>
          </div>

          <div className="admin-form-group admin-form-group--full">
            <label className="admin-form-label">Description</label>
            <textarea className="admin-form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description du produit…" />
          </div>

          {/* ── TAILLES & STOCK ── */}
          <div className="admin-form-group admin-form-group--full" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--admin-border)',
            borderRadius: '14px',
            padding: '16px',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <label className="admin-form-label" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                📐 Tailles &amp; Stock
              </label>
              <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem', display: 'block', marginTop: '2px' }}>
                Cochez les tailles disponibles, renseignez le stock. Laissez vide si taille unique.
              </span>
            </div>

            {/* Sélection rapide des tailles standard */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--admin-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Tailles standard
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {STANDARD_SIZES.map(size => {
                  const hasVariant = form.variants.some(v => v.size === size);
                  return (
                    <label
                      key={size}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: hasVariant ? '2px solid var(--primary)' : '1.5px solid var(--admin-border)',
                        background: hasVariant ? 'rgba(241,90,36,0.12)' : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontSize: '0.88rem',
                        fontWeight: hasVariant ? '700' : '500',
                        color: hasVariant ? 'var(--primary)' : 'var(--admin-text)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={hasVariant}
                        style={{ display: 'none' }}
                        onChange={e => {
                          const isChecked = e.target.checked;

                          setForm(prev => {
                            if (isChecked) {
                              const alreadyExists = prev.variants.some(v => (v.size || '').trim().toLowerCase() === size.toLowerCase());
                              if (alreadyExists) return prev;

                              return {
                                ...prev,
                                variants: deduplicateVariants([
                                  ...prev.variants,
                                  normalizeVariant({
                                    size,
                                    color_name: '',
                                    color_hex: '#000000',
                                    stock_quantity: 0,
                                    price_override: '',
                                  }),
                                ]),
                              };
                            }

                            return {
                              ...prev,
                              variants: prev.variants.filter(v => (v.size || '').trim().toLowerCase() !== size.toLowerCase()),
                            };
                          });
                        }}
                      />
                      {hasVariant ? '✓ ' : ''}{size}
                    </label>
                  );
                })}
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  onClick={() => setForm(prev => ({
                    ...prev,
                    variants: deduplicateVariants([
                      ...prev.variants,
                      normalizeVariant({
                        size: '',
                        color_name: '',
                        color_hex: '#000000',
                        stock_quantity: 0,
                        price_override: '',
                      }),
                    ]),
                  }))}
                  title="Ajouter une taille personnalisée"
                >
                  + Taille custom
                </button>
              </div>
            </div>

            {/* Tableau des variantes */}
            {form.variants.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                      {['Taille', 'Couleur', 'Code couleur', 'Stock *', 'Prix spécifique', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--admin-text-muted)', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.variants.map((v, idx) => (
                      <tr key={v.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* Taille */}
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            list="size-list"
                            className="admin-form-input"
                            style={{ padding: '5px 8px', fontSize: '0.85rem', width: '80px' }}
                            value={v.size}
                            placeholder="ex: M"
                            onChange={e => {
                              const updated = [...form.variants];
                              updated[idx] = { ...updated[idx], size: e.target.value };
                              setForm(prev => ({ ...prev, variants: updated }));
                            }}
                          />
                          <datalist id="size-list">
                            {STANDARD_SIZES.map(s => <option key={s} value={s} />)}
                          </datalist>
                        </td>
                        {/* Nom couleur */}
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            className="admin-form-input"
                            style={{ padding: '5px 8px', fontSize: '0.85rem', width: '100px' }}
                            value={v.color_name}
                            placeholder="ex: Rouge"
                            onChange={e => {
                              const updated = [...form.variants];
                              updated[idx] = { ...updated[idx], color_name: e.target.value };
                              setForm(prev => ({ ...prev, variants: updated }));
                            }}
                          />
                        </td>
                        {/* Color picker */}
                        <td style={{ padding: '6px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="color"
                              value={v.color_hex || '#000000'}
                              style={{ width: '32px', height: '32px', border: 'none', cursor: 'pointer', borderRadius: '6px', padding: '1px', background: 'transparent' }}
                              onChange={e => {
                                const updated = [...form.variants];
                                updated[idx] = { ...updated[idx], color_hex: e.target.value };
                                setForm(prev => ({ ...prev, variants: updated }));
                              }}
                            />
                            <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.78rem' }}>{v.color_hex || '#000000'}</span>
                          </div>
                        </td>
                        {/* Stock */}
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="number"
                            min="0"
                            className="admin-form-input"
                            style={{ padding: '5px 8px', fontSize: '0.85rem', width: '75px' }}
                            value={v.stock_quantity}
                            onChange={e => {
                              const updated = [...form.variants];
                              updated[idx] = { ...updated[idx], stock_quantity: Number(e.target.value) };
                              setForm(prev => ({ ...prev, variants: updated }));
                            }}
                          />
                        </td>
                        {/* Prix override */}
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="admin-form-input"
                            style={{ padding: '5px 8px', fontSize: '0.85rem', width: '90px' }}
                            value={v.price_override}
                            placeholder="Prix de base"
                            onChange={e => {
                              const updated = [...form.variants];
                              updated[idx] = { ...updated[idx], price_override: e.target.value };
                              setForm(prev => ({ ...prev, variants: updated }));
                            }}
                          />
                        </td>
                        {/* Supprimer */}
                        <td style={{ padding: '6px 8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = form.variants.filter((_, i) => i !== idx);
                              setForm(prev => ({ ...prev, variants: updated }));
                            }}
                            style={{
                              background: 'rgba(220,38,38,0.15)',
                              border: '1px solid rgba(220,38,38,0.3)',
                              color: '#f87171',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                            }}
                            title="Supprimer cette variante"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Résumé stock total */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  <span>
                    <strong style={{ color: 'var(--admin-text)' }}>{form.variants.length}</strong> variante(s)
                  </span>
                  <span>
                    Stock total : <strong style={{ color: 'var(--primary)' }}>
                      {form.variants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0)}
                    </strong> unité(s)
                  </span>
                </div>
              </div>
            )}

            {form.variants.length === 0 && (
              <div style={{
                border: '2px dashed var(--admin-border)',
                borderRadius: '10px',
                padding: '18px',
                textAlign: 'center',
                color: 'var(--admin-text-muted)',
                fontSize: '0.85rem',
              }}>
                📦 Aucune variante — cochez une taille ou cliquez sur <strong>+ Taille custom</strong>
              </div>
            )}
          </div>

          <div className="admin-form-group admin-form-group--full" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="admin-btn admin-btn--secondary" type="button" onClick={() => setShowForm(false)}>
              Annuler
            </button>
            <button className="admin-btn admin-btn--primary" type="submit" disabled={saving || uploadingImages}>
              {saving ? 'Enregistrement…' : (editing ? <><EditIcon /> Mettre à jour</> : <><AddIcon /> Créer le produit</>)}
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
                  <th>Produit</th>
                  <th>Prix</th>
                  <th>Catégorie</th>
                  <th>Photos</th>
                  <th>Personnalisable</th>
                  <th>Statut</th>
                  <th>Ordre</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={9}><div className="admin-empty"><div className="admin-empty__icon"><ProductIcon /></div><p>Aucun produit trouvé</p></div></td></tr>
                  : filtered.map((p) => {
                    const imgCount = p.product_images?.length || (p.image_url ? 1 : 0);
                    const isSavingThis = savingScoreId === p.id;
                    const hasScore = p.display_order != null && Number(p.display_order) > 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={p.image_url || 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=100&h=100&fit=crop'}
                              alt=""
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--admin-border)', background: '#111' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <small style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>{p.slug}</small>
                            </div>
                          </div>
                        </td>
                        <td>{p.base_price != null ? `${p.base_price} €` : '—'}</td>
                        <td>{p.category_id ? (categories.find(c => c.id === p.category_id)?.name ?? '—') : '—'}</td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.06)',
                            fontSize: '0.78rem',
                            color: imgCount > 1 ? 'var(--primary)' : 'var(--admin-text-muted)',
                            fontWeight: imgCount > 1 ? 600 : 400
                          }}>
                            📷 {imgCount}
                          </span>
                        </td>
                        <td><span className={`admin-badge admin-badge--${p.is_customizable ? 'purple' : 'gray'}`}>{p.is_customizable ? 'Oui' : 'Non'}</span></td>
                        <td><span className={`admin-badge admin-badge--${p.is_active ? 'green' : 'red'}`}>{p.is_active ? 'Actif' : 'Inactif'}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              key={`${p.id}-${p.display_order}`}
                              defaultValue={p.display_order ?? ''}
                              placeholder="0"
                              disabled={isSavingThis}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                const currentVal = p.display_order != null ? String(p.display_order) : '';
                                if (val !== currentVal) {
                                  handleInlineScoreChange(p.id, val);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.target.blur();
                                }
                              }}
                              style={{
                                width: '62px',
                                padding: '5px 8px',
                                borderRadius: '8px',
                                border: hasScore ? '1px solid rgba(241, 90, 36, 0.45)' : '1px solid var(--admin-border)',
                                background: hasScore ? 'rgba(241, 90, 36, 0.1)' : 'rgba(255,255,255,0.04)',
                                color: hasScore ? 'var(--primary)' : 'inherit',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                outline: 'none',
                                opacity: isSavingThis ? 0.4 : 1,
                                transition: 'all 0.2s ease',
                              }}
                              title="Modifiez le score puis appuyez sur Entrée ou cliquez ailleurs pour enregistrer"
                            />
                            {isSavingThis && (
                              <div className="admin-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="admin-btn admin-btn--icon admin-btn--sm" onClick={() => openEdit(p)} title="Modifier"><EditIcon /></button>
                            <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => remove(p.id)} title="Supprimer"><TrashIcon /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
