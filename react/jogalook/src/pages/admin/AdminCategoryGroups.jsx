import { useState, useEffect, useCallback } from 'react';
import { AddIcon, EditIcon, TrashIcon, SearchIcon, CategoryIcon, CloseIcon } from './AdminIcons';
import { AdminModal } from './AdminModal';

const API_GROUPS = '/api/category-groups';
const API_CATEGORIES = '/api/categories';

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  display_order: 0,
  category_ids: [],
};

export default function AdminCategoryGroups() {
  const [groups, setGroups] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [catSearch, setCatSearch] = useState('');

  // Charger les groupes et toutes les catégories disponibles
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsRes, catsRes] = await Promise.all([
        fetch(API_GROUPS),
        fetch(API_CATEGORIES),
      ]);

      const groupsJson = await groupsRes.json();
      const catsJson = await catsRes.json();

      if (groupsJson.success && Array.isArray(groupsJson.data)) {
        setGroups(groupsJson.data);
      }
      if (catsJson.success && Array.isArray(catsJson.data)) {
        setAllCategories(catsJson.data);
      }
    } catch (err) {
      console.error('Erreur chargement groupes/catégories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ouvrir modal création
  const openCreate = () => {
    setEditingGroup(null);
    setForm({
      ...EMPTY_FORM,
      display_order: groups.length + 1,
    });
    setCatSearch('');
    setShowModal(true);
  };

  // Ouvrir modal modification
  const openEdit = (group) => {
    setEditingGroup(group);
    setForm({
      name: group.name || '',
      slug: group.slug || '',
      description: group.description || '',
      display_order: group.display_order ?? 0,
      category_ids: (group.categories || []).map(c => c.id),
    });
    setCatSearch('');
    setShowModal(true);
  };

  // Gestion du slug automatique
  const handleNameChange = (val) => {
    const newSlug = val
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setForm(prev => ({
      ...prev,
      name: val,
      slug: editingGroup ? prev.slug : newSlug,
    }));
  };

  // Toggle sélection d'une catégorie
  const toggleCategory = (catId) => {
    setForm(prev => {
      const exists = prev.category_ids.includes(catId);
      return {
        ...prev,
        category_ids: exists
          ? prev.category_ids.filter(id => id !== catId)
          : [...prev.category_ids, catId],
      };
    });
  };

  // Tout sélectionner / désélectionner
  const handleSelectAll = (select) => {
    setForm(prev => ({
      ...prev,
      category_ids: select ? allCategories.map(c => c.id) : [],
    }));
  };

  // Enregistrer (créer ou modifier)
  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Le nom du groupe est obligatoire.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: form.description?.trim() || null,
        display_order: Number(form.display_order) || 0,
        category_ids: form.category_ids,
      };

      const method = editingGroup ? 'PUT' : 'POST';
      const url = editingGroup ? `${API_GROUPS}/${editingGroup.id}` : API_GROUPS;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Erreur lors de l\'enregistrement.');
      }

      await loadData();
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Impossible d\'enregistrer le groupe.');
    } finally {
      setSaving(false);
    }
  };

  // Supprimer un groupe
  const remove = async (group) => {
    if (!confirm(`Supprimer le groupe "${group.name}" ? Les catégories ne seront pas supprimées.`)) return;
    try {
      const res = await fetch(`${API_GROUPS}/${group.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      await loadData();
    } catch (err) {
      alert('Erreur suppression : ' + err.message);
    }
  };

  // Filtrer les groupes pour la recherche
  const filteredGroups = groups.filter(g =>
    (g.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (g.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  // Catégories filtrées dans la modale
  const modalFilteredCategories = allCategories.filter(c =>
    (c.name || '').toLowerCase().includes(catSearch.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(catSearch.toLowerCase())
  );

  return (
    <div>
      {/* ── En-tête de page ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            <CategoryIcon /> <span>Groupes de catégories</span>
          </h1>
          <p className="admin-page-subtitle">
            Regroupez vos catégories pour la navigation e-commerce (Vêtements, Sport, Électronique...)
          </p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>
          <AddIcon />
          Nouveau groupe
        </button>
      </div>

      {/* ── Carte principale ── */}
      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-toolbar">
            <div className="admin-search">
              <SearchIcon />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un groupe…"
              />
            </div>
          </div>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ordre</th>
                  <th>Groupe</th>
                  <th>Slug</th>
                  <th>Catégories associées</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-empty">
                        <div className="admin-empty__icon"><CategoryIcon /></div>
                        <p>Aucun groupe de catégories trouvé</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map(group => {
                    const catCount = group.categories?.length || 0;
                    return (
                      <tr key={group.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          #{group.display_order ?? 0}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {group.name}
                          </div>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                            {group.slug}
                          </code>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                            <span className="admin-badge admin-badge--purple" style={{ fontWeight: 600 }}>
                              {catCount} catégorie{catCount > 1 ? 's' : ''}
                            </span>
                            {(group.categories || []).slice(0, 4).map(c => (
                              <span
                                key={c.id}
                                style={{
                                  padding: '2px 8px',
                                  background: 'rgba(255,255,255,0.06)',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {c.name}
                              </span>
                            ))}
                            {catCount > 4 && (
                              <small style={{ color: 'var(--admin-text-muted)' }}>
                                +{catCount - 4} autre{catCount - 4 > 1 ? 's' : ''}
                              </small>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', maxWidth: '280px' }}>
                          {group.description || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="admin-btn admin-btn--icon admin-btn--sm"
                              onClick={() => openEdit(group)}
                              title="Modifier"
                            >
                              <EditIcon />
                            </button>
                            <button
                              className="admin-btn admin-btn--danger admin-btn--sm"
                              onClick={() => remove(group)}
                              title="Supprimer"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal Création / Édition ── */}
      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingGroup ? `Modifier : ${editingGroup.name}` : 'Nouveau groupe de catégories'}
        size="lg"
        loading={saving}
      >
        <form onSubmit={save} className="admin-form-grid">
          <div className="admin-form-group">
            <label className="admin-form-label">Nom du groupe *</label>
            <input
              className="admin-form-input"
              required
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="ex: Vêtements, Sport, Électronique…"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Slug (identifiant URL)</label>
            <input
              className="admin-form-input"
              required
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })}
              placeholder="ex: vetements, sport…"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Ordre d'affichage dans la Navbar</label>
            <input
              type="number"
              min="0"
              className="admin-form-input"
              value={form.display_order}
              onChange={e => setForm({ ...form, display_order: e.target.value })}
              placeholder="1, 2, 3…"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Description</label>
            <input
              className="admin-form-input"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Courte description pour l'univers…"
            />
          </div>

          {/* ── Sélection des catégories associées ── */}
          <div className="admin-form-group admin-form-group--full" style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--admin-border)',
            borderRadius: '14px',
            padding: '16px',
            marginTop: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <label className="admin-form-label" style={{ marginBottom: '2px' }}>
                  Catégories incluses dans ce groupe ({form.category_ids.length} sélectionnée{form.category_ids.length > 1 ? 's' : ''})
                </label>
                <small style={{ color: 'var(--admin-text-muted)', fontSize: '0.78rem' }}>
                  Les produits de ces catégories apparaîtront sous cet onglet dans la navigation.
                </small>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  onClick={() => handleSelectAll(true)}
                >
                  Tout cocher
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  onClick={() => handleSelectAll(false)}
                >
                  Tout décocher
                </button>
              </div>
            </div>

            {/* Recherche rapide dans les catégories */}
            <div style={{ marginBottom: '12px' }}>
              <input
                className="admin-form-input"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                placeholder="Filtrer les catégories par nom…"
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
              />
            </div>

            {/* Grille de cases à cocher */}
            {allCategories.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', margin: '8px 0' }}>
                Aucune catégorie créée dans le catalogue. Créez d'abord des catégories dans l'onglet "Catégories".
              </p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '4px',
              }}>
                {modalFilteredCategories.map(cat => {
                  const isChecked = form.category_ids.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: isChecked ? '1px solid var(--primary)' : '1px solid var(--admin-border)',
                        background: isChecked ? 'rgba(241, 90, 36, 0.1)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat.id)}
                        style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: isChecked ? 600 : 400 }}>
                        {cat.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="admin-form-group admin-form-group--full" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button className="admin-btn admin-btn--secondary" type="button" onClick={() => setShowModal(false)}>
              Annuler
            </button>
            <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : (editingGroup ? <><EditIcon /> Mettre à jour</> : <><AddIcon /> Créer le groupe</>)}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
