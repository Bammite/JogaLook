import { useCallback, useEffect, useState } from 'react';
import { AddIcon, EditIcon, EmptyIcon, ProductIcon, SearchIcon, TrashIcon } from './AdminIcons';
import { AdminModal } from './AdminModal';
import './AdminKeywords.css';

const EMPTY_FORM = { keyword_id: '', word: '', lang: 'fr', product_id: '', similarity: 50 };
const token = () => localStorage.getItem('jogalook-token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

export default function AdminKeywords() {
  const [relations, setRelations] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [relationsRes, keywordsRes, productsRes] = await Promise.all([
        fetch('/api/keywords'), fetch('/api/keywords/list'), fetch('/api/products?limit=500'),
      ]);
      const [relationsJson, keywordsJson, productsJson] = await Promise.all([
        relationsRes.json(), keywordsRes.json(), productsRes.json(),
      ]);
      if (!relationsRes.ok || !relationsJson.success) throw new Error(relationsJson.message);
      setRelations(relationsJson.data ?? []);
      setKeywords(keywordsJson.data ?? []);
      setProducts(productsJson.data ?? []);
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les associations.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const isEditing = Boolean(editingId);
      const response = await fetch(`/api/keywords${isEditing ? '/' + editingId : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          keyword_id: form.keyword_id || undefined,
          word: form.keyword_id ? undefined : form.word,
          similarity: Number(form.similarity),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Enregistrement impossible.');
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  };

  const openEdit = (relation) => {
    setEditingId(relation.id);
    setForm({
      keyword_id: relation.keywords?.id ?? '',
      word: '',
      lang: relation.keywords?.lang ?? 'fr',
      product_id: relation.products?.id ?? '',
      similarity: relation.similarity,
    });
    setShowForm(true);
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette association ?')) return;
    const response = await fetch(`/api/keywords/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (!response.ok) setError('Impossible de supprimer cette association.');
    else await load();
  };

  const filtered = relations.filter((relation) => {
    const value = search.toLowerCase();
    return relation.keywords?.word?.toLowerCase().includes(value) || relation.products?.name?.toLowerCase().includes(value);
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><ProductIcon /> <span>Mots-clés produits</span></h1>
          <p className="admin-page-subtitle">Associez un mot-clé à un produit avec un score de pertinence.</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => { setError(''); setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }}><AddIcon /> Nouvelle association</button>
      </div>

      {error && <div className="admin-keywords-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-keywords-search"><SearchIcon /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un mot-clé ou produit..." /></div>
          <span className="admin-keywords-count">{relations.length} association(s)</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Mot-clé</th><th>Produit</th><th>Équivalence</th><th>Source</th><th /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="admin-keywords-empty">Chargement...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan="5" className="admin-keywords-empty"><EmptyIcon /> Aucune association</td></tr>
                : filtered.map((relation) => <tr key={relation.id}>
                  <td><strong>{relation.keywords?.word ?? '—'}</strong></td>
                  <td>{relation.products?.name ?? '—'}</td>
                  <td><span className="admin-keywords-score">{relation.similarity}%</span></td>
                  <td>{relation.source ?? 'manual'}</td>
                  <td className="admin-keywords-actions"><button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => openEdit(relation)} title="Modifier"><EditIcon /></button><button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => remove(relation.id)} title="Supprimer"><TrashIcon /></button></td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal open={showForm} onClose={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }} title={editingId ? 'Modifier l\'association' : 'Associer un mot-clé à un produit'} loading={saving}>
        <form className="admin-form-grid" onSubmit={save}>
          <div className="admin-form-group admin-form-group--full"><label className="admin-form-label">Mot-clé existant</label><select className="admin-form-select" value={form.keyword_id} onChange={(event) => setForm({ ...form, keyword_id: event.target.value })}><option value="">Créer un nouveau mot-clé</option>{keywords.map((keyword) => <option key={keyword.id} value={keyword.id}>{keyword.word} ({keyword.lang})</option>)}</select></div>
          {!form.keyword_id && <><div className="admin-form-group"><label className="admin-form-label">Nouveau mot-clé *</label><input className="admin-form-input" value={form.word} onChange={(event) => setForm({ ...form, word: event.target.value })} required={!form.keyword_id} placeholder="ex: maillot domicile" /></div><div className="admin-form-group"><label className="admin-form-label">Langue</label><input className="admin-form-input" value={form.lang} onChange={(event) => setForm({ ...form, lang: event.target.value })} maxLength="5" /></div></>}
          <div className="admin-form-group admin-form-group--full"><label className="admin-form-label">Produit *</label><select className="admin-form-select" value={form.product_id} onChange={(event) => setForm({ ...form, product_id: event.target.value })} required><option value="">Sélectionner un produit</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div>
          <div className="admin-form-group"><label className="admin-form-label">Pourcentage d'équivalence *</label><input className="admin-form-input" type="number" min="0" max="100" step="1" value={form.similarity} onChange={(event) => setForm({ ...form, similarity: event.target.value })} required /></div>
          <div className="admin-form-actions admin-form-group--full"><button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowForm(false)}>Annuler</button><button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button></div>
        </form>
      </AdminModal>
    </div>
  );
}
