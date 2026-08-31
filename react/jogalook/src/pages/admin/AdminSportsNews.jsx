import { useCallback, useEffect, useState, useRef } from 'react';
import { AdminModal } from './AdminModal';
import { AddIcon, EditIcon, EyeIcon, NewsIcon, TrashIcon } from './AdminIcons';
import { useAuth } from '../../context/AuthContext';
import TinyEditor from './TinyEditor';
import { uploadImageFile } from '../../utils/uploadUtil';
import {
  UploadIcon,
  FolderIcon,
  CopyIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  FootballIcon,
  StarIcon,
  PinIcon,
  TagIcon,
  CameraIcon,
  SearchIcon,
  CloudIcon,
  SettingsIcon,
} from '../../components/icons/AppIcons';
import './AdminSportsNews.css';

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '<p>Rédigez ici les détails de l’actualité sportive...</p>',
  cover_image_url: '',
  category_id: '',
  status: 'DRAFT',
  is_featured: false,
  seo_title: '',
  seo_description: '',
};

function slugify(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(value) {
  if (!value) return 'Brouillon';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminSportsNews() {
  const { token } = useAuth();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewArticle, setPreviewArticle] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [uploaderModalOpen, setUploaderModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [tableMissing, setTableMissing] = useState(false);

  // États pour l'upload de l'image de couverture
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadMsg, setCoverUploadMsg] = useState(null);
  const coverFileInputRef = useRef(null);

  // États pour la modal d'upload autonome de fichiers
  const [quickUploadFile, setQuickUploadFile] = useState(null);
  const [quickUploading, setQuickUploading] = useState(false);
  const [quickUploadResult, setQuickUploadResult] = useState(null);
  const [quickUploadError, setQuickUploadError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const quickFileInputRef = useRef(null);

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        fetch('/api/sports-news', { headers }),
        fetch('/api/sports-news/categories', { headers }),
      ]);

      const articlesJson = await articlesRes.json();
      const categoriesJson = await categoriesRes.json();

      if (articlesJson.tableMissing || categoriesJson.tableMissing) {
        setTableMissing(true);
        setError('La table des actualités sportives n’est pas encore créée dans Supabase.');
        return;
      }

      if (!articlesRes.ok) {
        throw new Error(articlesJson.message || 'Impossible de charger les articles.');
      }

      setTableMissing(false);
      setArticles(articlesJson.data || []);
      setCategories(categoriesJson.data || []);
    } catch (err) {
      console.error('Erreur chargement actualités:', err);
      setError(err.message || 'Erreur lors du chargement des actualités.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setSuccessMsg('');
    setCoverUploadMsg(null);
    setModalOpen(true);
  };

  const openEdit = (article) => {
    setEditingId(article.id);
    setForm({
      title: article.title || '',
      slug: article.slug || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      cover_image_url: article.cover_image_url || '',
      category_id: article.category_id || '',
      status: article.status || 'DRAFT',
      is_featured: Boolean(article.is_featured),
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || '',
    });
    setError('');
    setSuccessMsg('');
    setCoverUploadMsg(null);
    setModalOpen(true);
  };

  const updateField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'title' && !editingId) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  // Upload d'image de couverture depuis le formulaire
  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setCoverUploadMsg(null);

    try {
      const result = await uploadImageFile(file, 'articles');
      updateField('cover_image_url', result.publicUrl);
      setCoverUploadMsg({ type: 'success', text: 'Image de couverture uploadée avec succès !' });
      setTimeout(() => setCoverUploadMsg(null), 3500);
    } catch (err) {
      setCoverUploadMsg({ type: 'error', text: err.message || 'Échec de l’upload.' });
    } finally {
      setUploadingCover(false);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
    }
  };

  // Upload autonome de fichier (générateur de lien)
  const handleQuickUploadSubmit = async (fileToUpload) => {
    const file = fileToUpload || quickUploadFile;
    if (!file) return;

    setQuickUploading(true);
    setQuickUploadError(null);
    setQuickUploadResult(null);
    setCopiedLink(false);

    try {
      const result = await uploadImageFile(file, 'articles');
      setQuickUploadResult(result);
    } catch (err) {
      setQuickUploadError(err.message || 'Erreur lors de l’upload du fichier.');
    } finally {
      setQuickUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    if (!form.title.trim()) {
      setError('Veuillez renseigner un titre pour l’article.');
      setSaving(false);
      return;
    }

    if (!form.content || !form.content.replace(/<[^>]*>/g, '').trim()) {
      setError('Le contenu de l’article ne peut pas être vide.');
      setSaving(false);
      return;
    }

    try {
      const endpoint = editingId ? `/api/sports-news/${editingId}` : '/api/sports-news';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...form,
        slug: slugify(form.slug || form.title),
      };

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Impossible d’enregistrer l’article.');
      }

      setSuccessMsg(editingId ? 'Article mis à jour avec succès !' : 'Article créé et enregistré avec succès !');
      setTimeout(() => {
        setModalOpen(false);
        setSuccessMsg('');
        load();
      }, 700);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message || 'Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l’article « ${article.title} » ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/sports-news/${article.id}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Impossible de supprimer cet article.');
      }
      setSuccessMsg('Article supprimé avec succès.');
      setTimeout(() => setSuccessMsg(''), 3000);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtrage des articles
  const filteredArticles = articles.filter((a) => {
    const matchSearch =
      `${a.title} ${a.slug} ${a.excerpt || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchCategory = categoryFilter === 'ALL' || a.category_id === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div className="admin-sports-news">
      {/* ── Header de page ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            <span className="admin-page-title__icon"><NewsIcon /></span>
            Actualités Sportives
          </h1>
          <p className="admin-page-subtitle">
            Rédigez, mettez en page et publiez vos articles sportifs & football
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button
            className="admin-btn admin-btn--outline"
            onClick={() => {
              setQuickUploadResult(null);
              setQuickUploadError(null);
              setQuickUploadFile(null);
              setUploaderModalOpen(true);
            }}
            title="Uploader une image et obtenir son lien public"
          >
            <UploadIcon size={16} /> Uploader un fichier
          </button>
          {tableMissing && (
            <button className="admin-btn admin-btn--warning" onClick={() => setSqlModalOpen(true)}>
              <SettingsIcon size={16} /> Créer les tables SQL
            </button>
          )}
          <button className="admin-btn admin-btn--primary" onClick={openCreate}>
            <AddIcon /> Nouvel article
          </button>
        </div>
      </div>

      {/* ── Alerte Table Manquante ── */}
      {tableMissing && (
        <div className="sports-news-missing-banner">
          <div className="sports-news-missing-icon"><AlertTriangleIcon size={24} color="#D97706" /></div>
          <div className="sports-news-missing-content">
            <h3>Configuration de la base de données requise</h3>
            <p>
              Les tables PostgreSQL <code>sports_articles</code> et <code>sports_news_categories</code> ne sont pas encore installées dans votre instance Supabase.
            </p>
            <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => setSqlModalOpen(true)}>
              Voir le script SQL à exécuter
            </button>
          </div>
        </div>
      )}

      {/* ── Messages d'alerte ou succès ── */}
      {error && !tableMissing && (
        <div className="sports-news-alert sports-news-alert--error">
          <AlertTriangleIcon size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="sports-news-alert sports-news-alert--success">
          <CheckCircleIcon size={18} /> {successMsg}
        </div>
      )}

      {/* ── Carte principale avec liste ── */}
      <div className="admin-card">
        {/* Barre de filtres */}
        <div className="sports-news-toolbar">
          <div className="admin-search" style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, mot-clé ou slug..."
            />
          </div>

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PUBLISHED">Publié</option>
            <option value="DRAFT">Brouillon</option>
            <option value="ARCHIVED">Archivé</option>
          </select>

          <select
            className="admin-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Tableau des articles */}
        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              <p>Chargement des actualités…</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Visuel</th>
                  <th>Titre de l’article</th>
                  <th>Catégorie</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="admin-empty">
                        <div className="admin-empty__icon"><NewsIcon /></div>
                        <p style={{ fontWeight: 600, fontSize: '1.05rem', margin: '0 0 6px' }}>Aucun article trouvé</p>
                        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                          Cliquez sur « Nouvel article » pour créer votre première actualité sportive.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((article) => (
                    <tr key={article.id}>
                      <td>
                        {article.cover_image_url ? (
                          <img
                            src={article.cover_image_url}
                            alt=""
                            className="sports-table-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="sports-table-cover-placeholder">
                            <FootballIcon size={20} color="#94A3B8" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="sports-title-cell">
                          <strong>{article.title}</strong>
                          <span className="sports-slug-badge">/{article.slug}</span>
                          {article.is_featured && (
                            <span className="sports-featured-tag">
                              <StarIcon size={12} fill="currentColor" /> À la une
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="sports-category-badge">
                          {article.sports_news_categories?.name || 'Sans catégorie'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${
                            article.status === 'PUBLISHED' ? 'green' : article.status === 'ARCHIVED' ? 'red' : 'orange'
                          }`}
                        >
                          {article.status === 'PUBLISHED' ? 'Publié' : article.status === 'ARCHIVED' ? 'Archivé' : 'Brouillon'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.88rem', color: '#64748B' }}>
                          {formatDate(article.published_at || article.created_at)}
                        </span>
                      </td>
                      <td className="sports-news-actions">
                        <button
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                          onClick={() => {
                            setPreviewArticle(article);
                            setPreviewOpen(true);
                          }}
                          title="Aperçu de l’article"
                        >
                          <EyeIcon />
                        </button>
                        <button
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                          onClick={() => openEdit(article)}
                          title="Modifier l’article"
                        >
                          <EditIcon />
                        </button>
                        <button
                          className="admin-btn admin-btn--danger admin-btn--sm"
                          onClick={() => handleDelete(article)}
                          title="Supprimer l’article"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ════════════════ MODAL STUDIO RÉDACTION (2 COLONNES) ════════════════ */}
      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Modifier l’actualité sportive' : 'Rédiger une actualité sportive'}
        size="xl"
        loading={saving}
      >
        <form onSubmit={handleSave} className="sports-studio-form">
          {error && (
            <div className="sports-news-alert sports-news-alert--error" style={{ gridColumn: '1 / -1' }}>
              <AlertTriangleIcon size={18} /> {error}
            </div>
          )}

          {/* ── COLONNE GAUCHE (70%) : ÉDITION DU CONTENU ── */}
          <div className="sports-studio-main">
            {/* Titre */}
            <div className="sports-field-group">
              <label className="sports-label">
                Titre de l’article <span className="sports-req">*</span>
              </label>
              <input
                type="text"
                className="sports-input sports-input--title"
                placeholder="Ex : Victoire éclatante des Lions de la Téranga en qualifications..."
                value={form.title}
                required
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>

            {/* Slug / Permalien */}
            <div className="sports-field-group">
              <label className="sports-label">
                Permalien (Slug URL) <span className="sports-req">*</span>
              </label>
              <div className="sports-slug-wrapper">
                <span className="sports-slug-prefix">/actualites/</span>
                <input
                  type="text"
                  className="sports-input sports-input--slug"
                  placeholder="victoire-eclatante-lions-teranga"
                  value={form.slug}
                  required
                  onChange={(e) => updateField('slug', slugify(e.target.value))}
                />
              </div>
            </div>

            {/* Résumé / Chapeau */}
            <div className="sports-field-group">
              <label className="sports-label">
                Chapeau / Résumé introductif
                <span className="sports-hint">Affiché en accroche et dans les cartes de la page d’accueil</span>
              </label>
              <textarea
                className="sports-textarea"
                rows="3"
                placeholder="Entrez un court résumé percutant de votre article..."
                value={form.excerpt}
                onChange={(e) => updateField('excerpt', e.target.value)}
              />
            </div>

            {/* Éditeur Riche TinyMCE avec upload direct */}
            <div className="sports-field-group">
              <label className="sports-label">
                Corps de l’article (Éditeur enrichi) <span className="sports-req">*</span>
              </label>
              <TinyEditor
                value={form.content}
                onChange={(val) => updateField('content', val)}
                placeholder="Rédigez votre article complet avec images, citations, listes et paragraphes..."
              />
            </div>
          </div>

          {/* ── COLONNE DROITE (30%) : PARAMÈTRES & PUBLICATION ── */}
          <div className="sports-studio-side">
            {/* Bloc 1 : Publication */}
            <div className="sports-card-side">
              <h3 className="sports-side-title">
                <PinIcon size={16} /> Publication
              </h3>

              <div className="sports-field-group">
                <label className="sports-label">Statut</label>
                <select
                  className="sports-select"
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <option value="DRAFT">Brouillon (Non visible)</option>
                  <option value="PUBLISHED">Publié (En ligne)</option>
                  <option value="ARCHIVED">Archivé</option>
                </select>
              </div>

              <label className="sports-switch-label">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => updateField('is_featured', e.target.checked)}
                />
                <span>
                  <StarIcon size={14} fill="currentColor" /> Mettre à la une (Hero Banner)
                </span>
              </label>
            </div>

            {/* Bloc 2 : Catégorisation */}
            <div className="sports-card-side">
              <h3 className="sports-side-title">
                <TagIcon size={16} /> Catégorie
              </h3>
              <select
                className="sports-select"
                value={form.category_id}
                onChange={(e) => updateField('category_id', e.target.value)}
              >
                <option value="">-- Sans catégorie --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Bloc 3 : Image de Couverture avec Upload Direct */}
            <div className="sports-card-side">
              <h3 className="sports-side-title">
                <CameraIcon size={16} /> Image de couverture
              </h3>

              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverFileUpload}
              />

              {/* Bouton d'upload direct */}
              <button
                type="button"
                className="sports-upload-btn"
                disabled={uploadingCover}
                onClick={() => coverFileInputRef.current?.click()}
              >
                {uploadingCover ? (
                  <>
                    <span className="admin-spinner-inline" />
                    Upload vers Supabase Storage…
                  </>
                ) : (
                  <>
                    <FolderIcon size={16} /> Téléverser une image locale
                  </>
                )}
              </button>

              {coverUploadMsg && (
                <div className={`sports-mini-alert sports-mini-alert--${coverUploadMsg.type}`}>
                  {coverUploadMsg.text}
                </div>
              )}

              <div className="sports-field-group">
                <label className="sports-label" style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Ou lien URL direct de l'image :
                </label>
                <input
                  type="url"
                  className="sports-input"
                  placeholder="https://..."
                  value={form.cover_image_url}
                  onChange={(e) => updateField('cover_image_url', e.target.value)}
                />
              </div>

              {/* Aperçu & Actions */}
              {form.cover_image_url ? (
                <div className="sports-cover-preview-wrapper">
                  <div className="sports-cover-preview-box">
                    <img
                      src={form.cover_image_url}
                      alt="Aperçu"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div className="sports-cover-actions">
                    <button
                      type="button"
                      className="sports-mini-btn"
                      onClick={() => copyToClipboard(form.cover_image_url)}
                    >
                      <CopyIcon size={13} /> Copier le lien
                    </button>
                    <button
                      type="button"
                      className="sports-mini-btn sports-mini-btn--danger"
                      onClick={() => updateField('cover_image_url', '')}
                    >
                      <TrashIcon size={13} /> Retirer
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="sports-cover-dropzone"
                  onClick={() => coverFileInputRef.current?.click()}
                >
                  <CameraIcon size={24} color="#94A3B8" />
                  <span>Cliquez pour choisir ou glissez une image</span>
                  <small>JPG, PNG, WebP (max 5 Mo)</small>
                </div>
              )}
            </div>

            {/* Bloc 4 : SEO & Google */}
            <div className="sports-card-side">
              <h3 className="sports-side-title">
                <SearchIcon size={16} /> Référencement SEO
              </h3>
              <div className="sports-field-group">
                <label className="sports-label">Balise Titre SEO</label>
                <input
                  type="text"
                  className="sports-input"
                  placeholder={form.title || 'Titre optimisé pour Google'}
                  value={form.seo_title}
                  onChange={(e) => updateField('seo_title', e.target.value)}
                />
              </div>
              <div className="sports-field-group">
                <label className="sports-label">Meta Description</label>
                <textarea
                  className="sports-textarea"
                  rows="2"
                  placeholder="Courte description pour les moteurs de recherche..."
                  value={form.seo_description}
                  onChange={(e) => updateField('seo_description', e.target.value)}
                />
              </div>
            </div>

            {/* Boutons d'action rapides */}
            <div className="sports-side-actions">
              <button
                type="button"
                className="admin-btn admin-btn--ghost sports-action-btn"
                onClick={() => {
                  setPreviewArticle(form);
                  setPreviewOpen(true);
                }}
              >
                <EyeIcon /> Aperçu
              </button>

              <button
                type="submit"
                className="admin-btn admin-btn--primary sports-action-btn"
                disabled={saving}
              >
                {saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Publier / Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* ════════════════ MODAL D'UPLOAD AUTONOME & GÉNÉRATEUR DE LIEN ════════════════ */}
      <AdminModal
        open={uploaderModalOpen}
        onClose={() => setUploaderModalOpen(false)}
        title="Uploader un fichier vers Supabase Storage"
        size="md"
      >
        <div className="sports-uploader-modal-content">
          <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '0.92rem' }}>
            Sélectionnez une image sur votre ordinateur. Elle sera automatiquement hébergée sur votre stockage Supabase et vous obtiendrez un lien public direct prêt à l'emploi.
          </p>

          <input
            ref={quickFileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setQuickUploadFile(f);
                handleQuickUploadSubmit(f);
              }
            }}
          />

          <div
            className="sports-uploader-dropzone"
            onClick={() => quickFileInputRef.current?.click()}
          >
            <CloudIcon size={42} color="#94A3B8" />
            <strong>Cliquez ici pour sélectionner une image</strong>
            <span>PNG, JPG, WebP, GIF, SVG (max 5 Mo)</span>
          </div>

          {quickUploading && (
            <div className="sports-uploader-progress">
              <div className="admin-spinner" style={{ width: 32, height: 32 }} />
              <p>Téléversement sécurisé vers Supabase Storage…</p>
            </div>
          )}

          {quickUploadError && (
            <div className="sports-news-alert sports-news-alert--error" style={{ marginTop: '16px' }}>
              <AlertTriangleIcon size={16} /> {quickUploadError}
            </div>
          )}

          {quickUploadResult && (
            <div className="sports-uploader-success-box">
              <div className="sports-uploader-preview">
                <img src={quickUploadResult.publicUrl} alt="Upload" />
              </div>
              <div className="sports-uploader-result-details">
                <label className="sports-label" style={{ fontSize: '0.8rem' }}>URL publique générée :</label>
                <div className="sports-url-copy-box">
                  <input
                    type="text"
                    readOnly
                    value={quickUploadResult.publicUrl}
                    className="sports-input"
                    style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary admin-btn--sm"
                    onClick={() => copyToClipboard(quickUploadResult.publicUrl)}
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircleIcon size={14} /> Copié !
                      </>
                    ) : (
                      <>
                        <CopyIcon size={14} /> Copier
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => setUploaderModalOpen(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      </AdminModal>

      {/* ════════════════ MODAL APERÇU ARTICLE ════════════════ */}
      <AdminModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Aperçu de l’article"
        size="lg"
      >
        <div className="sports-preview-container">
          {previewArticle.cover_image_url && (
            <img className="sports-preview-hero" src={previewArticle.cover_image_url} alt="" />
          )}
          <div className="sports-preview-meta">
            <span className="sports-category-badge">
              {categories.find((c) => c.id === previewArticle.category_id)?.name || 'Sport'}
            </span>
            <span className="sports-preview-date">{formatDate(previewArticle.published_at || new Date())}</span>
          </div>
          <h1 className="sports-preview-title">{previewArticle.title || 'Sans titre'}</h1>
          {previewArticle.excerpt && (
            <p className="sports-preview-lead">{previewArticle.excerpt}</p>
          )}
          <hr className="sports-preview-divider" />
          <div
            className="sports-preview-body"
            dangerouslySetInnerHTML={{ __html: previewArticle.content || '<p>Aucun contenu rédigé.</p>' }}
          />
        </div>
      </AdminModal>

      {/* ════════════════ MODAL SCRIPT SQL ════════════════ */}
      <AdminModal
        open={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
        title="Installation des tables SQL Supabase"
        size="lg"
      >
        <div style={{ lineHeight: 1.6 }}>
          <p style={{ marginTop: 0 }}>
            Pour activer la gestion des actualités sportives, copiez et exécutez le script SQL ci-dessous dans votre tableau de bord <strong>Supabase → SQL Editor</strong> :
          </p>
          <pre
            style={{
              background: '#0F172A',
              color: '#F8FAFC',
              padding: '16px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              overflowX: 'auto',
              maxHeight: '320px',
            }}
          >
{`-- Exécutez le script complet sports_news.sql depuis le dépôt`}
          </pre>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button className="admin-btn admin-btn--ghost" onClick={() => setSqlModalOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
