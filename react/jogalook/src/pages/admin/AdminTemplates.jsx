import { useState, useEffect, useCallback, useRef } from 'react';
import { AddIcon, CloseIcon, EditIcon, EyeIcon, SearchIcon, TemplateIcon, EmptyIcon, TrashIcon } from './AdminIcons';
import { AdminModal } from './AdminModal';
import { uploadImageFile } from '../../utils/uploadUtil';
import { normalizeSvgForDisplay } from '../../utils/svgUtils';
import { AdminSvgMapperModal } from './AdminSvgMapperModal';
import { AlertTriangleIcon, CameraIcon, JerseyIcon, PaletteIcon, PencilIcon, ShieldCheckIcon, TagIcon, UploadIcon } from '../../components/icons/AppIcons';

const API = '/api/templates';

function formatFCFA(value) {
  return `${Math.round(Number(value) || 0).toLocaleString('fr-FR')} FCFA`;
}

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

const DEFAULT_FLOCKING_CONFIG = {
  name: { x_percent: 50, y_percent: 26, font_family: 'Impact', font_size: 28, default_color: '#ffffff', letter_spacing: 4 },
  number: { x_percent: 50, y_percent: 52, font_family: 'Impact', font_size: 110, default_color: '#ffffff' },
  allowed_colors: ['#ffffff', '#111111', '#ffd700', '#e63946', '#1d3557']
};

const EMPTY_TEMPLATE = {
  name: '',
  description: '',
  template_type: 'SVG', // 'SVG' | 'MOCKUP'
  image_front: '',
  image_back: '',
  flocking_config: DEFAULT_FLOCKING_CONFIG,
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
  const [activeFormTab, setActiveFormTab] = useState('general'); // 'general' | 'front' | 'back' | 'badge' | 'layers' | 'mockup_images' | 'mockup_flocking'
  const [saving, setSaving] = useState(false);
  const [uploadingBadge, setUploadingBadge] = useState(false);
  const [uploadingFrontImage, setUploadingFrontImage] = useState(false);
  const [uploadingBackImage, setUploadingBackImage] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewSide, setPreviewSide] = useState('front'); // 'front' | 'back'
  const [mapperOpen, setMapperOpen] = useState(false);
  const [mapperSide, setMapperSide] = useState('front'); // 'front' | 'back'
  const badgeFileRef = useRef(null);
  const frontImageRef = useRef(null);
  const backImageRef = useRef(null);

  const handleFrontImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFrontImage(true);
    try {
      const result = await uploadImageFile(file, 'templates');
      setForm(prev => ({ ...prev, image_front: result.publicUrl, thumbnail_url: prev.thumbnail_url || result.publicUrl }));
    } catch (err) {
      alert(err.message || "Échec de l'upload de l'image face");
    } finally {
      setUploadingFrontImage(false);
    }
  };

  const handleBackImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBackImage(true);
    try {
      const result = await uploadImageFile(file, 'templates');
      setForm(prev => ({ ...prev, image_back: result.publicUrl }));
    } catch (err) {
      alert(err.message || "Échec de l'upload de l'image dos");
    } finally {
      setUploadingBackImage(false);
    }
  };

  const handleMapperSave = ({ finalSvg, layersConfig, side }) => {
    if (side === 'front') {
      setForm(prev => ({
        ...prev,
        svg_front: finalSvg,
        layers_config: { ...prev.layers_config, ...layersConfig }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        svg_back: finalSvg,
        layers_config: { ...prev.layers_config, ...layersConfig }
      }));
    }
  };

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
      template_type: t.template_type || (t.image_front ? 'MOCKUP' : 'SVG'),
      image_front: t.image_front || '',
      image_back: t.image_back || '',
      flocking_config: t.flocking_config || DEFAULT_FLOCKING_CONFIG,
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
                  {preview.is_free ? 'Gratuit' : formatFCFA(preview.price)} • {preview.visibility === 'PUBLIC' ? 'Public' : 'Privé'}
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
                __html: normalizeSvgForDisplay(
                  previewSide === 'front'
                    ? (preview.svg_front || preview.svg_content || DEFAULT_FRONT_SVG)
                    : (preview.svg_back || DEFAULT_BACK_SVG)
                )
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
        {/* Navigation par Onglets (S'adapte dynamiquement selon le format SVG ou MOCKUP) */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
          {(form.template_type === 'MOCKUP'
            ? [
                { id: 'general',         label: '1. Général & Format' },
                { id: 'mockup_images',   label: '2. Photos du Maillot (Face & Dos)' },
                { id: 'mockup_flocking', label: '3. Réglage Flockage (Nom & Numéro)' },
              ]
            : [
                { id: 'general', label: '1. Général & Format' },
                { id: 'front',   label: '2. Face Avant (SVG)' },
                { id: 'back',    label: '3. Dos / Arrière (SVG)' },
                { id: 'badge',   label: '4. Blason / Logo' },
                { id: 'layers',  label: '5. Calques & IDs Modifiables' },
              ]
          ).map(tab => (
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
          {/* ── ONGLET 1 : GÉNÉRAL & FORMAT ── */}
          {activeFormTab === 'general' && (
            <>
              {/* SÉLECTEUR DU FORMAT DE TEMPLATE */}
              <div className="admin-form-group admin-form-group--full">
                <label className="admin-form-label" style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '8px' }}>
                  Format de Conception du Template *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    onClick={() => {
                      setForm(prev => ({ ...prev, template_type: 'SVG' }));
                      if (activeFormTab === 'mockup_images' || activeFormTab === 'mockup_flocking') {
                        setActiveFormTab('general');
                      }
                    }}
                    style={{
                      border: `2px solid ${form.template_type !== 'MOCKUP' ? '#f15a24' : '#e2e8f0'}`,
                      background: form.template_type !== 'MOCKUP' ? 'rgba(241, 90, 36, 0.05)' : '#fff',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.92rem', color: form.template_type !== 'MOCKUP' ? '#f15a24' : '#1e293b' }}>
                      <PaletteIcon size={18} />
                      <span>Modèle Vectoriel SVG</span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                      Personnalisation intégrale : couleurs du corps, col, manches, rayures et flockage.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setForm(prev => ({ ...prev, template_type: 'MOCKUP' }));
                      if (activeFormTab === 'front' || activeFormTab === 'back' || activeFormTab === 'badge' || activeFormTab === 'layers') {
                        setActiveFormTab('general');
                      }
                    }}
                    style={{
                      border: `2px solid ${form.template_type === 'MOCKUP' ? '#f15a24' : '#e2e8f0'}`,
                      background: form.template_type === 'MOCKUP' ? 'rgba(241, 90, 36, 0.05)' : '#fff',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.92rem', color: form.template_type === 'MOCKUP' ? '#f15a24' : '#1e293b' }}>
                      <CameraIcon size={18} />
                      <span>Photo / Mockup Réaliste (Recommandé)</span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                      Ultra-rapide : uploadez les vraies photos face & dos vierge, le client personnalise nom et numéro.
                    </p>
                  </div>
                </div>
              </div>

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
                  <label className="admin-form-label">Prix de base (FCFA)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-form-input"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="30 000"
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

          {/* ── ONGLET MOCKUP 2 : PHOTOS DU MAILLOT (FACE & DOS) ── */}
          {activeFormTab === 'mockup_images' && (
            <>
              {/* FACE AVANT */}
              <div className="admin-form-group admin-form-group--full">
                <label className="admin-form-label" style={{ fontWeight: 700 }}>1. Photo Face Avant du Maillot *</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={frontImageRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFrontImageUpload}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => frontImageRef.current?.click()}
                    disabled={uploadingFrontImage}
                  >
                    {uploadingFrontImage ? 'Téléversement…' : <><UploadIcon size={16} /> Téléverser la photo Face</>}
                  </button>
                  <input
                    className="admin-form-input"
                    style={{ flex: 1, minWidth: '240px' }}
                    value={form.image_front || ''}
                    onChange={e => setForm({ ...form, image_front: e.target.value, thumbnail_url: form.thumbnail_url || e.target.value })}
                    placeholder="Ou collez une URL : https://.../maillot-face.png"
                  />
                </div>

                {form.image_front && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={form.image_front} alt="Face" style={{ width: '80px', height: '95px', objectFit: 'contain', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16a34a' }}>✓ Photo Face prête</span>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Affichée côté client lors de la vue face.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* DOS VIERGE */}
              <div className="admin-form-group admin-form-group--full" style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="admin-form-label" style={{ fontWeight: 700, margin: 0 }}>2. Photo Dos Vierge du Maillot *</label>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangleIcon size={14} /> Le dos ne doit comporter aucun nom ni numéro</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={backImageRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleBackImageUpload}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => backImageRef.current?.click()}
                    disabled={uploadingBackImage}
                  >
                    {uploadingBackImage ? 'Téléversement…' : <><UploadIcon size={16} /> Téléverser la photo Dos Vierge</>}
                  </button>
                  <input
                    className="admin-form-input"
                    style={{ flex: 1, minWidth: '240px' }}
                    value={form.image_back || ''}
                    onChange={e => setForm({ ...form, image_back: e.target.value })}
                    placeholder="Ou collez une URL : https://.../maillot-dos-vierge.png"
                  />
                </div>

                {form.image_back && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={form.image_back} alt="Dos" style={{ width: '80px', height: '95px', objectFit: 'contain', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16a34a' }}>✓ Photo Dos Vierge prête</span>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Prête pour le positionnement du flockage dans l'onglet suivant.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── ONGLET MOCKUP 3 : RÉGLAGE FLOCKAGE ── */}
          {activeFormTab === 'mockup_flocking' && (
            <div className="admin-form-group admin-form-group--full">
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px' }}>
                <h4 style={{ margin: '0 0 4px', color: '#1e40af', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}><PencilIcon size={16} /> Positionnement du Flockage Officiel</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#1e3a8a' }}>
                  Ajustez avec les curseurs ci-dessous la position du Nom et du Numéro sur le dos du maillot. Le rendu est synchronisé en temps réel.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
                {/* APERÇU VISUEL DIRECT */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px', margin: '0 auto', border: '1.5px solid #cbd5e1', borderRadius: '14px', overflow: 'hidden', background: '#f8fafc', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
                  {form.image_back ? (
                    <img src={form.image_back} alt="Aperçu Dos" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  ) : (
                    <div style={{ height: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                      <CameraIcon size={32} style={{ marginBottom: '8px' }} />
                      <span>Veuillez ajouter une photo de dos dans l'onglet 2</span>
                    </div>
                  )}

                  {form.image_back && (
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                      {/* Nom */}
                      <div style={{
                        position: 'absolute',
                        left: `${form.flocking_config?.name?.x_percent ?? 50}%`,
                        top: `${form.flocking_config?.name?.y_percent ?? 26}%`,
                        transform: 'translateX(-50%)',
                        fontFamily: form.flocking_config?.name?.font_family || "'Bebas Neue', 'Impact', sans-serif",
                        fontSize: `${Math.round((form.flocking_config?.name?.font_size || 28) * 0.75)}px`,
                        color: form.flocking_config?.name?.default_color || '#ffffff',
                        letterSpacing: `${form.flocking_config?.name?.letter_spacing || 4}px`,
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        textAlign: 'center'
                      }}>
                        JOUEUR
                      </div>

                      {/* Numéro */}
                      <div style={{
                        position: 'absolute',
                        left: `${form.flocking_config?.number?.x_percent ?? 50}%`,
                        top: `${form.flocking_config?.number?.y_percent ?? 52}%`,
                        transform: 'translateX(-50%)',
                        fontFamily: form.flocking_config?.number?.font_family || "'Bebas Neue', 'Impact', sans-serif",
                        fontSize: `${Math.round((form.flocking_config?.number?.font_size || 110) * 0.7)}px`,
                        color: form.flocking_config?.number?.default_color || '#ffffff',
                        lineHeight: 1,
                        fontWeight: 900,
                        textAlign: 'center'
                      }}>
                        10
                      </div>
                    </div>
                  )}
                </div>

                {/* CONTRÔLES / SLIDERS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Positionnement Nom (X & Y) */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px', color: '#1e293b' }}>Position du Nom</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Horizontal (X%)</label>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f15a24' }}>{form.flocking_config?.name?.x_percent ?? 50}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="80"
                          value={form.flocking_config?.name?.x_percent ?? 50}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            setForm(prev => ({
                              ...prev,
                              flocking_config: {
                                ...prev.flocking_config,
                                name: { ...prev.flocking_config?.name, x_percent: val }
                              }
                            }));
                          }}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Hauteur (Y%)</label>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f15a24' }}>{form.flocking_config?.name?.y_percent ?? 26}%</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="45"
                          value={form.flocking_config?.name?.y_percent ?? 26}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            setForm(prev => ({
                              ...prev,
                              flocking_config: {
                                ...prev.flocking_config,
                                name: { ...prev.flocking_config?.name, y_percent: val }
                              }
                            }));
                          }}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Positionnement Numéro (X & Y) */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px', color: '#1e293b' }}>Position du Numéro</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Horizontal (X%)</label>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f15a24' }}>{form.flocking_config?.number?.x_percent ?? 50}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="80"
                          value={form.flocking_config?.number?.x_percent ?? 50}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            setForm(prev => ({
                              ...prev,
                              flocking_config: {
                                ...prev.flocking_config,
                                number: { ...prev.flocking_config?.number, x_percent: val }
                              }
                            }));
                          }}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Hauteur (Y%)</label>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f15a24' }}>{form.flocking_config?.number?.y_percent ?? 52}%</span>
                        </div>
                        <input
                          type="range"
                          min="35"
                          max="75"
                          value={form.flocking_config?.number?.y_percent ?? 52}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            setForm(prev => ({
                              ...prev,
                              flocking_config: {
                                ...prev.flocking_config,
                                number: { ...prev.flocking_config?.number, y_percent: val }
                              }
                            }));
                          }}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tailles de Police Nom & Numéro */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Taille du Nom</label>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f15a24' }}>{form.flocking_config?.name?.font_size || 28}px</span>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        value={form.flocking_config?.name?.font_size || 28}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          setForm(prev => ({
                            ...prev,
                            flocking_config: {
                              ...prev.flocking_config,
                              name: { ...prev.flocking_config?.name, font_size: val }
                            }
                          }));
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Taille du Numéro</label>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f15a24' }}>{form.flocking_config?.number?.font_size || 110}px</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="160"
                        value={form.flocking_config?.number?.font_size || 110}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          setForm(prev => ({
                            ...prev,
                            flocking_config: {
                              ...prev.flocking_config,
                              number: { ...prev.flocking_config?.number, font_size: val }
                            }
                          }));
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Police et Couleur par défaut */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="admin-form-label">Police du Flockage</label>
                      <select
                        className="admin-form-select"
                        value={form.flocking_config?.name?.font_family || "'Bebas Neue', sans-serif"}
                        onChange={e => {
                          const val = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            flocking_config: {
                              ...prev.flocking_config,
                              name: { ...prev.flocking_config?.name, font_family: val },
                              number: { ...prev.flocking_config?.number, font_family: val }
                            }
                          }));
                        }}
                      >
                        <option value="'Bebas Neue', sans-serif">Bebas Neue (Football Pro / Officiel)</option>
                        <option value="'Impact', 'Arial Black', sans-serif">Impact (Classique Musclé)</option>
                        <option value="'Anton', sans-serif">Anton (Massif / Premier League)</option>
                        <option value="'Oswald', sans-serif">Oswald (Élancé / Serie A)</option>
                        <option value="'Barlow Condensed', sans-serif">Barlow Condensed (Moderne Pro)</option>
                        <option value="'Teko', sans-serif">Teko (Athlétique Haute Lisibilité)</option>
                        <option value="'Russo One', sans-serif">Russo One (Puissant / Power Sport)</option>
                        <option value="'Staatliches', sans-serif">Staatliches (Urbain / Street)</option>
                        <option value="'Archivo Black', sans-serif">Archivo Black (Robuste)</option>
                        <option value="'Montserrat', sans-serif">Montserrat (Clean Géométrique)</option>
                        <option value="'Chakra Petch', sans-serif">Chakra Petch (Racing & Esport)</option>
                        <option value="'Orbitron', sans-serif">Orbitron (Futuriste / Gaming)</option>
                        <option value="'Playfair Display', serif">Playfair (Vintage / Luxe)</option>
                        <option value="'Georgia', serif">Georgia (Rétro / Héritage)</option>
                        <option value="'Permanent Marker', cursive">Permanent Marker (Street)</option>
                        <option value="'Courier New', monospace">Courier New (Technique / Mono)</option>
                      </select>
                    </div>

                    <div>
                      <label className="admin-form-label">Couleur de Base</label>
                      <select
                        className="admin-form-select"
                        value={form.flocking_config?.name?.default_color || '#ffffff'}
                        onChange={e => {
                          const val = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            flocking_config: {
                              ...prev.flocking_config,
                              name: { ...prev.flocking_config?.name, default_color: val },
                              number: { ...prev.flocking_config?.number, default_color: val }
                            }
                          }));
                        }}
                      >
                        <option value="#ffffff">⚪ Blanc</option>
                        <option value="#111111">⚫ Noir</option>
                        <option value="#ffd700">🟡 Or / Doré</option>
                        <option value="#e63946">🔴 Rouge</option>
                        <option value="#1d3557">🔵 Bleu Marine</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ONGLET 2 : FACE AVANT (SVG FRONT) ── */}
          {activeFormTab === 'front' && (
            <>
              <div className="admin-form-group admin-form-group--full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label className="admin-form-label" style={{ margin: 0 }}>Code SVG Face Avant *</label>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary admin-btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => { setMapperSide('front'); setMapperOpen(true); }}
                  >
                    <PaletteIcon size={16} />
                    <span>Assistant Visuel : Identifier les éléments & Blason</span>
                  </button>
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
                    dangerouslySetInnerHTML={{ __html: normalizeSvgForDisplay(form.svg_front) }}
                  />
                </div>
              )}
            </>
          )}

          {/* ── ONGLET 3 : DOS / ARRIÈRE (SVG BACK) ── */}
          {activeFormTab === 'back' && (
            <>
              <div className="admin-form-group admin-form-group--full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label className="admin-form-label" style={{ margin: 0 }}>Code SVG Dos / Arrière</label>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary admin-btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => { setMapperSide('back'); setMapperOpen(true); }}
                  >
                    <PaletteIcon size={16} />
                    <span>Assistant Visuel : Identifier les éléments & Flockage</span>
                  </button>
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
                    dangerouslySetInnerHTML={{ __html: normalizeSvgForDisplay(form.svg_back) }}
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
                    {uploadingBadge ? 'Téléversement...' : <><UploadIcon size={16} /> Téléverser une image (PNG/JPG/SVG)</>}
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
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 18px', marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#1e40af', fontSize: '0.92rem' }}><TagIcon size={16} /> Guide des balises & IDs modifiables</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#1e3a8a', lineHeight: 1.45 }}>
                  Pour que le studio de personnalisation applique dynamiquement les couleurs et les flockages, spécifiez les identifiants (<code style={{ background: '#dbeafe', padding: '1px 4px', borderRadius: '4px' }}>id="..."</code>) utilisés dans vos codes SVG.
                </p>
              </div>

              {/* Raccourci vers le Studio Interactif Point-and-Click */}
              <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', color: '#0f172a' }}><PaletteIcon size={16} /> Studio Interactif de Mapping</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Identifiez visuellement chaque tracé en cliquant dessus et positionnez le blason et le flockage sans saisir de code.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary admin-btn--sm"
                    onClick={() => { setMapperSide('front'); setMapperOpen(true); }}
                  >
                    <><PaletteIcon size={16} /> Identifier Face & Blason</>
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    onClick={() => { setMapperSide('back'); setMapperOpen(true); }}
                  >
                    <><PaletteIcon size={16} /> Identifier Dos & Flockage</>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Corps */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>
                    <input type="checkbox" checked={form.editable_elements?.body ?? true} onChange={() => toggleElement('body')} />
                    <span><JerseyIcon size={16} /> Corps Principal</span>
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
                    <span><JerseyIcon size={16} /> Col du Maillot</span>
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
                    <span><JerseyIcon size={16} /> Manches & Bordures</span>
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
                    <span><PaletteIcon size={16} /> Bandes & Motifs</span>
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
                    <span><ShieldCheckIcon size={16} /> Zone du Blason</span>
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
                    <span><PencilIcon size={16} /> Zone Nom Joueur</span>
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
                    <span><TagIcon size={16} /> Zone Numéro Joueur</span>
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
                    {t.template_type === 'MOCKUP' && t.image_front ? (
                      <img
                        src={t.image_front}
                        alt={t.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        dangerouslySetInnerHTML={{ __html: normalizeSvgForDisplay(t.svg_front || t.svg_content || DEFAULT_FRONT_SVG) }}
                      />
                    )}
                    <span
                      className={`admin-badge admin-badge--${t.template_type === 'MOCKUP' ? 'purple' : 'blue'}`}
                      style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.72rem' }}
                    >
                      <>{t.template_type === 'MOCKUP' ? <><CameraIcon size={14} /> MOCKUP</> : <><PaletteIcon size={14} /> SVG</>}</>
                    </span>
                    <span
                      className={`admin-badge admin-badge--${t.is_free ? 'blue' : 'green'}`}
                      style={{ position: 'absolute', top: '10px', right: '10px' }}
                    >
                      {t.is_free ? 'Inclus' : formatFCFA(t.price)}
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

      {/* STUDIO INTERACTIF DE MAPPING SVG */}
      <AdminSvgMapperModal
        open={mapperOpen}
        onClose={() => setMapperOpen(false)}
        initialSvg={mapperSide === 'front' ? form.svg_front : form.svg_back}
        side={mapperSide}
        badgeUrl={form.badge_url}
        onSave={handleMapperSave}
      />
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
