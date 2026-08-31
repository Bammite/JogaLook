import { useState, useEffect, useCallback, useRef } from 'react';
import { AddIcon, CloseIcon, EditIcon, EyeIcon, SearchIcon, TemplateIcon, EmptyIcon, TrashIcon } from './AdminIcons';
import { AdminModal } from './AdminModal';
import { uploadImageFile } from '../../utils/uploadUtil';

const API = '/api/templates';

const DEFAULT_FRONT_SVG = `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Corps principal du maillot -->
  <path id="jersey-body" d="M60 40 L100 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L70 340 L70 110 L60 140 L20 120 Z" fill="#e63946" stroke="#1d3557" stroke-width="3"/>
  
  <!-- Bandes / Motifs graphiques -->
  <g id="jersey-stripes">
    <rect x="95" y="20" width="22" height="320" fill="#1d3557"/>
    <rect x="139" y="20" width="22" height="320" fill="#1d3557"/>
    <rect x="183" y="20" width="22" height="320" fill="#1d3557"/>
  </g>
  
  <!-- Col du maillot -->
  <path id="jersey-collar" d="M120 20 Q150 50 180 20" fill="none" stroke="#FFFFFF" stroke-width="8"/>
  
  <!-- Bordures des manches -->
  <g id="jersey-sleeves">
    <path d="M20 120 L60 140" stroke="#FFFFFF" stroke-width="6"/>
    <path d="M280 120 L240 140" stroke="#FFFFFF" stroke-width="6"/>
  </g>
  
  <!-- Emplacement Blason Club -->
  <g id="badge-zone">
    <circle cx="110" cy="90" r="14" fill="#FFD700"/>
  </g>
  
  <!-- Sponsor / Logo Central -->
  <text x="150" y="190" text-anchor="middle" fill="#FFFFFF" font-family="Impact, Arial Black, sans-serif" font-size="22" font-weight="bold" letter-spacing="3">JOGALOOK</text>
</svg>`;

const DEFAULT_BACK_SVG = `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Corps principal du maillot (Dos) -->
  <path id="jersey-body-back" d="M60 40 L100 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L70 340 L70 110 L60 140 L20 120 Z" fill="#e63946" stroke="#1d3557" stroke-width="3"/>
  
  <!-- Col du maillot (Dos) -->
  <path id="jersey-collar-back" d="M120 20 Q150 35 180 20" fill="none" stroke="#FFFFFF" stroke-width="8"/>
  
  <!-- Zone Flockage Nom -->
  <g id="name-zone">
    <text x="150" y="110" text-anchor="middle" fill="#FFFFFF" font-family="Impact, Arial Black, sans-serif" font-size="22" font-weight="bold" letter-spacing="4">JOUEUR</text>
  </g>
  
  <!-- Zone Flockage Numéro -->
  <g id="number-zone">
    <text x="150" y="230" text-anchor="middle" fill="#FFFFFF" font-family="Impact, Arial Black, sans-serif" font-size="90" font-weight="900">10</text>
  </g>
</svg>`;

const EMPTY_TEMPLATE = {
  name: '',
  description: '',
  is_free: true,
  price: 0.00,
  visibility: 'PUBLIC',
  thumbnail_url: '',
  svg_front: DEFAULT_FRONT_SVG,
  svg_back: DEFAULT_BACK_SVG,
  badge_url: '',
  badge_svg: '',
  editable_elements: {
    body: true,
    collar: true,
    sleeves: true,
    stripes: true,
    badge: true,
    name_zone: true,
    number_zone: true
  },
  layers_config: {
    body_id: 'jersey-body',
    collar_id: 'jersey-collar',
    sleeves_id: 'jersey-sleeves',
    stripes_id: 'jersey-stripes',
    badge_zone_id: 'badge-zone',
    name_zone_id: 'name-zone',
    number_zone_id: 'number-zone'
  }
};

export default function AdminTemplates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TEMPLATE);
  const [activeFormTab, setActiveFormTab] = useState('general'); // 'general' | 'front' | 'back' | 'badge' | 'layers'
  const [saving, setSaving] = useState(false);
  const [uploadingBadge, setUploadingBadge] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewSide, setPreviewSide] = useState('front'); // 'front' | 'back'
  const badgeFileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const json = await res.json();
      setItems(json.data ?? MOCK_TEMPLATES);
    } catch {
      setItems(MOCK_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_TEMPLATE);
    setActiveFormTab('general');
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      ...EMPTY_TEMPLATE,
      ...t,
      svg_front: t.svg_front || t.svg_content || DEFAULT_FRONT_SVG,
      svg_back: t.svg_back || DEFAULT_BACK_SVG,
      editable_elements: t.editable_elements || EMPTY_TEMPLATE.editable_elements,
      layers_config: t.layers_config || EMPTY_TEMPLATE.layers_config,
    });
    setActiveFormTab('general');
    setShowForm(true);
  };

  const handleBadgeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBadge(true);
    try {
      const result = await uploadImageFile(file, 'templates');
      setForm(prev => ({ ...prev, badge_url: result.publicUrl }));
    } catch (err) {
      alert(err.message || "Échec de l'upload du blason");
    } finally {
      setUploadingBadge(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        svg_content: form.svg_front, // Retrocompatibilité
        price: parseFloat(form.price) || 0.00,
        is_free: form.is_free === true || form.is_free === 'true'
      };

      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API}/${editing.id}` : API;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.success && json.message) {
        alert(json.message);
      }
      await load();
      setShowForm(false);
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce template ?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    await load();
  };

  const toggleElement = (key) => {
    setForm(prev => ({
      ...prev,
      editable_elements: {
        ...prev.editable_elements,
        [key]: !prev.editable_elements?.[key]
      }
    }));
  };

  const updateLayerId = (key, val) => {
    setForm(prev => ({
      ...prev,
      layers_config: {
        ...prev.layers_config,
        [key]: val
      }
    }));
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><TemplateIcon /> <span>Templates SVG & Maillots</span></h1>
          <p className="admin-page-subtitle">{items.length} template(s) prêt(s) pour la personnalisation</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>
          <AddIcon />
          Nouveau template
        </button>
      </div>

      {/* SVG Dual Preview Modal (Aperçu Face / Dos) */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1d3557' }}>{preview.name}</h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {preview.is_free ? 'Gratuit' : `${preview.price} €`} • {preview.visibility === 'PUBLIC' ? 'Public' : 'Privé'}
                </span>
              </div>
              <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setPreview(null)}>
                <CloseIcon />
              </button>
            </div>

            {/* Switch Face / Dos */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: '#f1f5f9', padding: '4px', borderRadius: '50px', width: 'fit-content' }}>
              <button
                type="button"
                className={`admin-btn ${previewSide === 'front' ? 'admin-btn--primary' : 'admin-btn--ghost'} admin-btn--sm`}
                style={{ borderRadius: '50px' }}
                onClick={() => setPreviewSide('front')}
              >
                Face Avant
              </button>
              <button
                type="button"
                className={`admin-btn ${previewSide === 'back' ? 'admin-btn--primary' : 'admin-btn--ghost'} admin-btn--sm`}
                style={{ borderRadius: '50px' }}
                onClick={() => setPreviewSide('back')}
              >
                Dos / Arrière
              </button>
            </div>

            <div
              style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px',
                background: '#f8fafc',
                maxHeight: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              dangerouslySetInnerHTML={{
                __html: previewSide === 'front'
                  ? (preview.svg_front || preview.svg_content || DEFAULT_FRONT_SVG)
                  : (preview.svg_back || DEFAULT_BACK_SVG)
              }}
            />
          </div>
        </div>
      )}

      {/* FORMULAIRE DE CRÉATION / ÉDITION DE TEMPLATE */}
      <AdminModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? `Modifier "${editing.name}"` : 'Créer un Template de Maillot'}
        size="lg"
        loading={saving}
      >
        {/* Navigation par Onglets */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
          {[
            { id: 'general', label: '1. Général & Tarifs' },
            { id: 'front',   label: '2. Face Avant (SVG)' },
            { id: 'back',    label: '3. Dos / Arrière (SVG)' },
            { id: 'badge',   label: '4. Blason / Logo' },
            { id: 'layers',  label: '5. Calques & IDs Modifiables' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`admin-btn admin-btn--sm ${activeFormTab === tab.id ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
              style={{ borderRadius: '50px', whiteSpace: 'nowrap' }}
              onClick={() => setActiveFormTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={save} className="admin-form-grid">
          {/* ── ONGLET 1 : GÉNÉRAL ── */}
          {activeFormTab === 'general' && (
            <>
              <div className="admin-form-group">
                <label className="admin-form-label">Nom du Template *</label>
                <input
                  className="admin-form-input"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="ex: Maillot Domicile Classic 2026"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Visibilité</label>
                <select
                  className="admin-form-select"
                  value={form.visibility}
                  onChange={e => setForm({ ...form, visibility: e.target.value })}
                >
                  <option value="PUBLIC">Public (Accessible à tous)</option>
                  <option value="PRIVATE">Privé (Admin uniquement)</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Tarification</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', height: '42px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.is_free}
                      onChange={e => setForm({ ...form, is_free: e.target.checked })}
                    />
                    <span>Template Gratuit</span>
                  </label>
                </div>
              </div>

              {!form.is_free && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Prix de base (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-form-input"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="49.99"
                  />
                </div>
              )}

              <div className="admin-form-group admin-form-group--full">
                <label className="admin-form-label">Description</label>
                <textarea
                  className="admin-form-textarea"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Description détaillée du style, matière ou inspiration du maillot..."
                />
              </div>
            </>
          )}

          {/* ── ONGLET 2 : FACE AVANT (SVG FRONT) ── */}
          {activeFormTab === 'front' && (
            <>
              <div className="admin-form-group admin-form-group--full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="admin-form-label">Code SVG Face Avant *</label>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Doit contenir &lt;svg viewBox="0 0 300 360" ...&gt;</span>
                </div>
                <textarea
                  className="admin-form-textarea"
                  style={{ minHeight: '220px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  required
                  value={form.svg_front}
                  onChange={e => setForm({ ...form, svg_front: e.target.value })}
                  placeholder="<svg viewBox='0 0 300 360'>...</svg>"
                />
              </div>

              {form.svg_front && (
                <div className="admin-form-group admin-form-group--full">
                  <label className="admin-form-label">Aperçu immédiat (Face)</label>
                  <div
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      background: '#f8fafc',
                      maxHeight: '240px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    dangerouslySetInnerHTML={{ __html: form.svg_front }}
                  />
                </div>
              )}
            </>
          )}

          {/* ── ONGLET 3 : DOS / ARRIÈRE (SVG BACK) ── */}
          {activeFormTab === 'back' && (
            <>
              <div className="admin-form-group admin-form-group--full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="admin-form-label">Code SVG Dos / Arrière</label>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Utilisé pour le flockage du nom et numéro</span>
                </div>
                <textarea
                  className="admin-form-textarea"
                  style={{ minHeight: '220px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  value={form.svg_back}
                  onChange={e => setForm({ ...form, svg_back: e.target.value })}
                  placeholder="<svg viewBox='0 0 300 360'>...</svg>"
                />
              </div>

              {form.svg_back && (
                <div className="admin-form-group admin-form-group--full">
                  <label className="admin-form-label">Aperçu immédiat (Dos)</label>
                  <div
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      background: '#f8fafc',
                      maxHeight: '240px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    dangerouslySetInnerHTML={{ __html: form.svg_back }}
                  />
                </div>
              )}
            </>
          )}

          {/* ── ONGLET 4 : BLASON / LOGO ── */}
          {activeFormTab === 'badge' && (
            <>
              <div className="admin-form-group admin-form-group--full">
                <label className="admin-form-label">Blason du Club (Image ou Icône par défaut)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                  <input
                    type="file"
                    ref={badgeFileRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleBadgeUpload}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => badgeFileRef.current?.click()}
                    disabled={uploadingBadge}
                  >
                    {uploadingBadge ? 'Téléversement...' : '📁 Téléverser une image (PNG/JPG/SVG)'}
                  </button>
                  {form.badge_url && (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger admin-btn--sm"
                      onClick={() => setForm({ ...form, badge_url: '' })}
                    >
                      Supprimer l'image
                    </button>
                  )}
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Ou URL directe de l'icône/blason</label>
                <input
                  className="admin-form-input"
                  value={form.badge_url || ''}
                  onChange={e => setForm({ ...form, badge_url: e.target.value })}
                  placeholder="https://.../logo.png"
                />
              </div>

              <div className="admin-form-group admin-form-group--full">
                <label className="admin-form-label">Ou Code SVG direct du Blason</label>
                <textarea
                  className="admin-form-textarea"
                  style={{ minHeight: '100px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  value={form.badge_svg || ''}
                  onChange={e => setForm({ ...form, badge_svg: e.target.value })}
                  placeholder="<svg>...</svg>"
                />
              </div>

              {form.badge_url && (
                <div className="admin-form-group admin-form-group--full">
                  <label className="admin-form-label">Aperçu du blason</label>
                  <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '10px', display: 'inline-block' }}>
                    <img src={form.badge_url} alt="Blason preview" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── ONGLET 5 : CALQUES & ÉLÉMENTS MODIFIABLES ── */}
          {activeFormTab === 'layers' && (
            <div className="admin-form-group admin-form-group--full">
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#1e40af', fontSize: '0.92rem' }}>💡 Guide des balises & IDs modifiables</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#1e3a8a', lineHeight: 1.45 }}>
                  Pour que le studio de personnalisation applique dynamiquement les couleurs et les flockages, spécifiez les identifiants (<code style={{ background: '#dbeafe', padding: '1px 4px', borderRadius: '4px' }}>id="..."</code>) utilisés dans vos codes SVG.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Corps */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>
                    <input type="checkbox" checked={form.editable_elements?.body ?? true} onChange={() => toggleElement('body')} />
                    <span>👕 Corps Principal</span>
                  </label>
                  <input
                    className="admin-form-input admin-form-input--sm"
                    value={form.layers_config?.body_id || 'jersey-body'}
                    onChange={e => updateLayerId('body_id', e.target.value)}
                    placeholder="ID SVG (ex: jersey-body)"
                  />
                </div>

                {/* Col */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>
                    <input type="checkbox" checked={form.editable_elements?.collar ?? true} onChange={() => toggleElement('collar')} />
                    <span>👔 Col du Maillot</span>
                  </label>
                  <input
                    className="admin-form-input admin-form-input--sm"
                    value={form.layers_config?.collar_id || 'jersey-collar'}
                    onChange={e => updateLayerId('collar_id', e.target.value)}
                    placeholder="ID SVG (ex: jersey-collar)"
                  />
                </div>

                {/* Manches */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>
                    <input type="checkbox" checked={form.editable_elements?.sleeves ?? true} onChange={() => toggleElement('sleeves')} />
                    <span>💪 Manches & Bordures</span>
                  </label>
                  <input
                    className="admin-form-input admin-form-input--sm"
                    value={form.layers_config?.sleeves_id || 'jersey-sleeves'}
                    onChange={e => updateLayerId('sleeves_id', e.target.value)}
                    placeholder="ID SVG (ex: jersey-sleeves)"
                  />
                </div>

                {/* Motifs / Bandes */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>
                    <input type="checkbox" checked={form.editable_elements?.stripes ?? true} onChange={() => toggleElement('stripes')} />
                    <span>🎨 Bandes & Motifs</span>
                  </label>
                  <input
                    className="admin-form-input admin-form-input--sm"
                    value={form.layers_config?.stripes_id || 'jersey-stripes'}
                    onChange={e => updateLayerId('stripes_id', e.target.value)}
                    placeholder="ID SVG (ex: jersey-stripes)"
                  />
                </div>

                {/* Zone Blason */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>
                    <input type="checkbox" checked={form.editable_elements?.badge ?? true} onChange={() => toggleElement('badge')} />
                    <span>🛡️ Zone du Blason</span>
                  </label>
                  <input
                    className="admin-form-input admin-form-input--sm"
                    value={form.layers_config?.badge_zone_id || 'badge-zone'}
                    onChange={e => updateLayerId('badge_zone_id', e.target.value)}
                    placeholder="ID SVG (ex: badge-zone)"
                  />
                </div>

                {/* Flockage Nom */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>
                    <input type="checkbox" checked={form.editable_elements?.name_zone ?? true} onChange={() => toggleElement('name_zone')} />
                    <span>✍️ Zone Nom Joueur</span>
                  </label>
                  <input
                    className="admin-form-input admin-form-input--sm"
                    value={form.layers_config?.name_zone_id || 'name-zone'}
                    onChange={e => updateLayerId('name_zone_id', e.target.value)}
                    placeholder="ID SVG (ex: name-zone)"
                  />
                </div>

                {/* Flockage Numéro */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>
                    <input type="checkbox" checked={form.editable_elements?.number_zone ?? true} onChange={() => toggleElement('number_zone')} />
                    <span>🔢 Zone Numéro Joueur</span>
                  </label>
                  <input
                    className="admin-form-input admin-form-input--sm"
                    value={form.layers_config?.number_zone_id || 'number-zone'}
                    onChange={e => updateLayerId('number_zone_id', e.target.value)}
                    placeholder="ID SVG (ex: number-zone)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'actions du modal */}
          <div className="admin-form-group admin-form-group--full" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => setPreview({ name: form.name || 'Aperçu du maillot', svg_front: form.svg_front, svg_back: form.svg_back, price: form.price, is_free: form.is_free, visibility: form.visibility })}
            >
              <EyeIcon /> Aperçu Double Face
            </button>
            <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : (editing ? <><EditIcon /> Mettre à jour</> : <><AddIcon /> Enregistrer le Template</>)}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* LISTE DES TEMPLATES (GRILLE ADMIN) */}
      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un template…" />
          </div>
        </div>
        <div className="admin-card__body">
          {loading ? (
            <div className="admin-loading"><div className="admin-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty"><div className="admin-empty__icon"><TemplateIcon /></div><p>Aucun template trouvé</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {filtered.map(t => (
                <div
                  key={t.id}
                  style={{
                    border: '1.5px solid var(--admin-border)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'var(--admin-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Zone Aperçu SVG */}
                  <div
                    style={{
                      height: '160px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px',
                      background: '#ffffff',
                      borderBottom: '1px solid var(--admin-border)',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      dangerouslySetInnerHTML={{ __html: t.svg_front || t.svg_content || DEFAULT_FRONT_SVG }}
                    />
                    <span
                      className={`admin-badge admin-badge--${t.is_free ? 'blue' : 'green'}`}
                      style={{ position: 'absolute', top: '10px', right: '10px' }}
                    >
                      {t.is_free ? 'Inclus' : `${t.price} €`}
                    </span>
                  </div>

                  {/* Détails */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 6px', color: '#1d3557' }}>{t.name}</p>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px', lineHeight: 1.4, flex: 1 }}>
                      {t.description || 'Modèle vectoriel multi-face pour personnalisation.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span className={`admin-badge admin-badge--${t.visibility === 'PUBLIC' ? 'green' : 'amber'}`}>
                        {t.visibility === 'PUBLIC' ? 'Public' : 'Privé'}
                      </span>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="admin-btn admin-btn--icon admin-btn--sm" onClick={() => setPreview(t)} title="Aperçu Double Face">
                          <EyeIcon />
                        </button>
                        <button className="admin-btn admin-btn--icon admin-btn--sm" onClick={() => openEdit(t)} title="Modifier le template">
                          <EditIcon />
                        </button>
                        <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => remove(t.id)} title="Supprimer">
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MOCK_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Maillot Domicile Classic',
    description: 'Design traditionnel à rayures emblématiques avec finitions soignées.',
    is_free: true,
    price: 49.99,
    visibility: 'PUBLIC',
    svg_front: DEFAULT_FRONT_SVG,
    svg_back: DEFAULT_BACK_SVG,
    editable_elements: { body: true, collar: true, sleeves: true, stripes: true, badge: true, name_zone: true, number_zone: true },
    layers_config: { body_id: 'jersey-body', collar_id: 'jersey-collar', sleeves_id: 'jersey-sleeves', stripes_id: 'jersey-stripes', badge_zone_id: 'badge-zone', name_zone_id: 'name-zone', number_zone_id: 'number-zone' },
    created_at: new Date().toISOString()
  }
];
