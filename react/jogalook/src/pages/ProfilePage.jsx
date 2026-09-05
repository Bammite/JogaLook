import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './ProfilePage.css';
import JerseyPreview from '../components/JerseyPreview';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function mergeCustomizations(dbItems, localItems) {
  const map = new Map();
  // DB items take precedence
  for (const item of dbItems) map.set(item.id, { ...item, _source: 'db' });
  for (const item of localItems) {
    if (!map.has(item.id)) map.set(item.id, { ...item, _source: 'local' });
  }
  return [...map.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// ── Sub-component: card de customisation ──────────────────────────────────────
function CustomCard({ item, onAddToCart, onDelete }) {
  const [side, setSide] = useState('front');

  return (
    <div className="profile-custom-card">
      {/* Aperçu */}
      <div className="profile-custom-card__img">
        <JerseyPreview item={item} side={side} alt={item.title || item.template_name || 'Maillot'} />
        {(item.preview_back || item.svg_back) && (
          <div className="profile-custom-card__toggle">
            <button type="button" onClick={() => setSide('front')} className={side === 'front' ? 'active' : ''}>Face</button>
            <button type="button" onClick={() => setSide('back')} className={side === 'back' ? 'active' : ''}>Dos</button>
          </div>
        )}
        {item._source === 'local' && (
          <span className="profile-custom-card__local-badge" title="Stocké localement, non synchronisé">Local</span>
        )}
      </div>

      {/* Infos */}
      <div className="profile-custom-card__info">
        <h3 className="profile-custom-card__name">{item.title || item.template_name || 'Maillot personnalisé'}</h3>
        <p className="profile-custom-card__date">{formatDate(item.created_at)}</p>

        <div className="profile-custom-card__tags">
          {item.custom_name && (
            <span className="profile-custom-card__tag profile-custom-card__tag--name">
              ✍️ {item.custom_name}
            </span>
          )}
          {item.custom_number && (
            <span className="profile-custom-card__tag profile-custom-card__tag--number">
              #{item.custom_number}
            </span>
          )}
          {item.primary_color && (
            <span className="profile-custom-card__tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.primary_color, border: '1px solid #ccc' }} />
              Couleur
            </span>
          )}
          {item.font_family && (
            <span className="profile-custom-card__tag" style={{ fontFamily: item.font_family, fontSize: '0.7rem' }}>
              Aa {item.font_family.split(',')[0].replace(/'/g, '')}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="profile-custom-card__actions">
          <button
            type="button"
            className="profile-btn profile-btn--primary"
            onClick={() => onAddToCart(item)}
            title="Ajouter au panier"
          >
            🛒 Panier
          </button>

          {item.template_id && (
            <Link
              to={`/custom/${item.template_id}`}
              className="profile-btn profile-btn--secondary"
            >
              ✏️ Modifier
            </Link>
          )}

          <button
            type="button"
            className="profile-btn profile-btn--danger"
            onClick={() => onDelete(item)}
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page Principale ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('creations');
  const [customizations, setCustomizations] = useState([]);
  const [loadingCustoms, setLoadingCustoms] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null); // item to confirm delete
  const [notification, setNotification] = useState(''); // feedback message

  // ── Auth guard
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  // ── Chargement des customisations (DB + localStorage)
  const loadCustomizations = useCallback(async () => {
    setLoadingCustoms(true);
    let dbItems = [];
    const token = localStorage.getItem('jogalook-token');
    if (token) {
      try {
        const res = await fetch('/api/customizations/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          dbItems = json.data || json || [];
        }
      } catch (_e) {
        // pas de réseau → ignore
      }
    }

    const localRaw = localStorage.getItem('jogalook-customizations');
    const localItems = localRaw ? JSON.parse(localRaw) : [];
    setCustomizations(mergeCustomizations(dbItems, localItems));
    setLoadingCustoms(false);
  }, []);

  useEffect(() => {
    if (user) loadCustomizations();
  }, [user, loadCustomizations]);

  // ── Notification temporaire
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // ── Ajouter au panier
  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      name: item.title || item.template_name || 'Maillot personnalisé',
      price: item.price || 0,
      image: item.preview_front || item.preview_image_url,
      preview_front: item.preview_front || item.preview_image_url,
      preview_back: item.preview_back || null,
      template_id: item.template_id,
      template_type: item.template_type,
      customization_id: item.id,
      category: 'Maillot Personnalisé',
      quantity: 1,
      selectedSize: item.size || 'M',
      extra_details: {
        playerName: item.custom_name,
        playerNumber: item.custom_number,
        textColor: item.primary_color,
        fontFamily: item.font_family,
      },
    });
    showNotification('✅ Maillot ajouté au panier !');
  };

  // ── Suppression
  const handleDelete = async (item) => {
    setDeleteModal(null);
    // Supprimer en DB si item.id est un UUID DB
    if (item._source === 'db') {
      const token = localStorage.getItem('jogalook-token');
      try {
        await fetch(`/api/customizations/${item.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_e) { /* ignore */ }
    }
    // Supprimer dans localStorage
    const localRaw = localStorage.getItem('jogalook-customizations');
    const localItems = localRaw ? JSON.parse(localRaw) : [];
    const updated = localItems.filter(i => i.id !== item.id);
    localStorage.setItem('jogalook-customizations', JSON.stringify(updated));
    setCustomizations(prev => prev.filter(i => i.id !== item.id));
    showNotification('🗑️ Créa supprimée.');
  };

  // ── Télécharger l'aperçu
  const handleDownload = (item) => {
    const src = item.preview_front || item.preview_image_url;
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    link.download = `${item.title || 'maillot'}.png`;
    link.click();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-page__loading">
          <div className="profile-spinner" />
          <p>Chargement...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  const displayName = `${user.first_name || ''}${user.last_name ? ' ' + user.last_name : ''}`.trim() || user.email;

  return (
    <>
      <Navbar />
      <main className="profile-page">
        <div className="container">

          {/* ── En-tête ── */}
          <section className="profile-hero">
            <div className="profile-hero__avatar">
              {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="profile-hero__info">
              <h1 className="profile-hero__name">{displayName}</h1>
              <p className="profile-hero__email">{user.email}</p>
              <p className="profile-hero__meta">Membre depuis {formatDate(user.created_at)}</p>
            </div>
          </section>

          {/* ── Notification ── */}
          {notification && (
            <div className="profile-notification">{notification}</div>
          )}

          {/* ── Onglets ── */}
          <div className="profile-tabs">
            <button
              type="button"
              className={`profile-tab ${activeTab === 'creations' ? 'profile-tab--active' : ''}`}
              onClick={() => setActiveTab('creations')}
            >
              🎨 Mes Créations {customizations.length > 0 && <span className="profile-tab__badge">{customizations.length}</span>}
            </button>
            <button
              type="button"
              className={`profile-tab ${activeTab === 'orders' ? 'profile-tab--active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              📦 Mes Commandes
            </button>
            <button
              type="button"
              className={`profile-tab ${activeTab === 'account' ? 'profile-tab--active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              📍 Mon Compte
            </button>
          </div>

          {/* ── PANEL : Mes Créations ── */}
          {activeTab === 'creations' && (
            <section className="profile-panel">
              <div className="profile-panel__header">
                <h2>🎨 Mes Maillots Personnalisés</h2>
                <Link to="/custom" className="profile-btn profile-btn--orange">+ Nouvelle création</Link>
              </div>

              {loadingCustoms ? (
                <div className="profile-loading-state">
                  <div className="profile-spinner" />
                  <p>Chargement de vos créations…</p>
                </div>
              ) : customizations.length === 0 ? (
                <div className="profile-empty-state">
                  <span style={{ fontSize: '3rem' }}>🎽</span>
                  <h3>Aucune création pour le moment</h3>
                  <p>Allez dans l'atelier pour personnaliser votre premier maillot !</p>
                  <Link to="/custom" className="profile-btn profile-btn--orange">Créer mon maillot</Link>
                </div>
              ) : (
                <div className="profile-custom-grid">
                  {customizations.map(item => (
                    <CustomCard
                      key={item.id}
                      item={item}
                      onAddToCart={handleAddToCart}
                      onDelete={(i) => setDeleteModal(i)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── PANEL : Mes Commandes ── */}
          {activeTab === 'orders' && (
            <section className="profile-panel">
              <div className="profile-panel__header">
                <h2>📦 Mes Commandes</h2>
              </div>
              <div className="profile-orders-shortcut">
                <p>Retrouvez le détail de toutes vos commandes, leur statut de livraison et l'historique de paiement.</p>
                <Link to="/mes-commandes" className="profile-btn profile-btn--orange">
                  Voir mes commandes →
                </Link>
              </div>
            </section>
          )}

          {/* ── PANEL : Mon Compte ── */}
          {activeTab === 'account' && (
            <section className="profile-panel">
              <div className="profile-panel__header">
                <h2>📍 Mes Coordonnées</h2>
              </div>
              <div className="profile-account-grid">
                <div className="profile-account-field">
                  <label>Prénom</label>
                  <span>{user.first_name || '—'}</span>
                </div>
                <div className="profile-account-field">
                  <label>Nom</label>
                  <span>{user.last_name || '—'}</span>
                </div>
                <div className="profile-account-field">
                  <label>Email</label>
                  <span>{user.email}</span>
                </div>
                <div className="profile-account-field">
                  <label>Téléphone</label>
                  <span>{user.phone || '—'}</span>
                </div>
                <div className="profile-account-field">
                  <label>Ville</label>
                  <span>{user.city || '—'}</span>
                </div>
                <div className="profile-account-field">
                  <label>Pays</label>
                  <span>{user.country || '—'}</span>
                </div>
              </div>
              <p className="profile-account-hint">
                Pour modifier vos informations, contactez notre support.
              </p>
            </section>
          )}

        </div>
      </main>

      {/* ── Modale de confirmation suppression ── */}
      {deleteModal && (
        <div className="profile-confirm-overlay" onClick={() => setDeleteModal(null)}>
          <div className="profile-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>🗑️ Supprimer cette création ?</h3>
            <p>
              <strong>{deleteModal.title || deleteModal.template_name || 'Maillot personnalisé'}</strong> sera
              définitivement supprimé. Cette action est irréversible.
            </p>
            <div className="profile-confirm-actions">
              <button type="button" className="profile-btn profile-btn--secondary" onClick={() => setDeleteModal(null)}>Annuler</button>
              <button type="button" className="profile-btn profile-btn--danger" onClick={() => handleDelete(deleteModal)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
