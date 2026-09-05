import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  OrderIcon, 
  SearchIcon, 
  EyeIcon, 
  CloseIcon, 
  DeliveryIcon, 
  PaymentIcon, 
  UserIcon, 
  ClockIcon, 
  EmptyIcon 
} from './AdminIcons';
import './AdminOrders.css';

const API = '/api/orders';

/* ─── Normalisation des statuts ─── */
const STATUSES = [
  { id: 'PENDING',    label: 'En attente',      color: 'pending',    icon: '⏳' },
  { id: 'PAID',       label: 'Payée',           color: 'paid',       icon: '💳' },
  { id: 'PROCESSING', label: 'En préparation',  color: 'processing', icon: '⚙️' },
  { id: 'SHIPPED',    label: 'En livraison',    color: 'shipped',    icon: '🚚' },
  { id: 'DELIVERED',  label: 'Livrée',          color: 'delivered',  icon: '✅' },
  { id: 'CANCELLED',  label: 'Annulée',         color: 'cancelled',  icon: '❌' },
];

const PAYMENT_METHOD_NAMES = {
  wave:             { label: 'Wave 🇸🇳',        badge: 'wave' },
  orange_money:     { label: 'Orange Money 🇸🇳', badge: 'om' },
  free_money:       { label: 'Free Money 🇸🇳',   badge: 'free' },
  wave_ci:          { label: 'Wave 🇨🇮',        badge: 'wave' },
  orange_money_ci:  { label: 'Orange Money 🇨🇮', badge: 'om' },
  mtn_ci:           { label: 'MTN 🇨🇮',         badge: 'om' },
  moov_ci:          { label: 'Moov 🇨🇮',        badge: 'om' },
  cash_on_delivery: { label: 'Paiement Livraison 💵', badge: 'cod' },
  card:             { label: 'Carte Bancaire 💳', badge: 'card' },
};

/* ─── Fonctions utilitaires ─── */
function formatFCFA(val) {
  return `${Math.round(Number(val) || 0).toLocaleString('fr-FR')} FCFA`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function extractGps(addressStr) {
  if (!addressStr) return null;
  const match = addressStr.match(/GPS:\s*([0-9\.\-]+),\s*([0-9\.\-]+)/i);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return null;
}

/* ─── Normalisation complète d'un article commandé ─── */
function normalizeOrderItem(it) {
  const cust = it.customizations || it.custom_details || it.customization || null;
  const extra = cust?.extra_config || it.extra_details || {};
  
  const customName = cust?.custom_name || it.custom_name || extra.playerName || null;
  const customNumber = cust?.custom_number || it.custom_number || (extra.playerNumber != null ? String(extra.playerNumber) : null);
  const fontFamily = cust?.font_family || it.font_family || extra.fontFamily || 'Sport Bold';
  const primaryColor = cust?.primary_color || it.selectedColor || extra.bodyColor || '#00853F';
  const secondaryColor = cust?.secondary_color || extra.stripesColor || extra.bodyColor2 || '#FDEF42';
  const collarColor = extra.collarColor || null;
  const sleevesColor = extra.sleevesColor || null;
  const badges = Array.isArray(extra.badges) ? extra.badges : (extra.badge_name ? [extra.badge_name] : []);

  const previewFront = it.preview_front || cust?.preview_front || cust?.preview_image_url || it.image || it.image_url || it.product_variants?.products?.image_url || null;
  const previewBack = it.preview_back || cust?.preview_back || null;
  const svgFront = it.svg_front || cust?.svg_front || cust?.svg_content || null;
  const svgBack = it.svg_back || cust?.svg_back || null;

  const isCustom = Boolean(
    customName ||
    customNumber ||
    previewBack ||
    it.customization_id ||
    cust ||
    (it.product_name && it.product_name.toLowerCase().includes('custom')) ||
    (it.name && it.name.toLowerCase().includes('custom')) ||
    (it.product_name && it.product_name.toLowerCase().includes('personnalis')) ||
    (it.name && it.name.toLowerCase().includes('personnalis')) ||
    (it.category && it.category.toLowerCase().includes('personnalis'))
  );

  const size = it.product_variants?.size || it.size || it.selectedSize || (it.variant_info && it.variant_info.replace(/Taille:\s*/i, '').split('|')[0].trim()) || 'Standard';

  return {
    ...it,
    isCustom,
    productName: it.product_name || it.name || (isCustom ? 'Maillot Personnalisé Atelier' : 'Article JogaLook'),
    size,
    quantity: it.quantity || 1,
    unitPrice: Number(it.unit_price || it.price || 0),
    totalPrice: (it.quantity || 1) * Number(it.unit_price || it.price || 0),
    previewFront,
    previewBack,
    svgFront,
    svgBack,
    customName,
    customNumber,
    fontFamily,
    primaryColor,
    secondaryColor,
    collarColor,
    sleevesColor,
    badges,
    extraConfig: extra,
  };
}

/* ─── Visualiseur Face Avant ─── */
function JerseyFrontVisualizer({ item, onZoom }) {
  const frontImg = item.previewFront || '/favicon.ico';
  return (
    <div className="admin-jersey-visual-wrap" onClick={() => onZoom(frontImg, `${item.productName} - Face Avant`, 'front', item)}>
      <img 
        src={frontImg} 
        alt="Face avant du maillot" 
        className="admin-jersey-img"
        onError={(e) => { 
          e.target.style.display = 'none'; 
          e.target.parentElement.classList.add('admin-jersey-img-fallback');
        }}
      />
      <div className="admin-jersey-overlay">
        <span>🔍 Agrandir Lightbox</span>
      </div>
      <span className="admin-jersey-corner-tag">Face Avant</span>
    </div>
  );
}

/* ─── Visualiseur Dos & Flocage (avec simulation vectorielle si besoin) ─── */
function JerseyBackVisualizer({ item, onZoom }) {
  if (item.previewBack) {
    return (
      <div className="admin-jersey-visual-wrap" onClick={() => onZoom(item.previewBack, `${item.productName} - Dos & Flocage`, 'back', item)}>
        <img 
          src={item.previewBack} 
          alt="Dos du maillot" 
          className="admin-jersey-img"
          onError={(e) => { 
            e.target.style.display = 'none'; 
            e.target.parentElement.classList.add('admin-jersey-img-fallback');
          }}
        />
        <div className="admin-jersey-overlay">
          <span>🔍 Agrandir Lightbox</span>
        </div>
        <span className="admin-jersey-corner-tag">Dos & Flocage</span>
      </div>
    );
  }

  // Rendu vectoriel du dos avec nom & numéro si pas d'image dos pré-rendue
  return (
    <div 
      className="admin-jersey-visual-wrap admin-jersey-simulated"
      style={{ backgroundColor: item.primaryColor || '#1A237E' }}
      onClick={() => onZoom(null, `${item.productName} - Flocage Dos`, 'back', item)}
    >
      <div className="admin-simulated-collar" style={{ backgroundColor: item.collarColor || item.secondaryColor || '#FFFFFF' }}></div>
      <div className="admin-simulated-content">
        <div 
          className="admin-simulated-name" 
          style={{ fontFamily: item.fontFamily, color: item.secondaryColor || '#FFFFFF' }}
        >
          {item.customName || 'VOTRE NOM'}
        </div>
        <div 
          className="admin-simulated-number" 
          style={{ fontFamily: item.fontFamily, color: item.secondaryColor || '#FFFFFF' }}
        >
          {item.customNumber || '00'}
        </div>
      </div>
      <div className="admin-simulated-footer">
        <span>Aperçu Flocage Dos</span>
      </div>
      <div className="admin-jersey-overlay">
        <span>🔍 Agrandir Flocage</span>
      </div>
      <span className="admin-jersey-corner-tag">Dos (Simu)</span>
    </div>
  );
}

/* ─── Composant Lightbox / Zoom Plein Écran ─── */
function OrderLightbox({ lightbox, zoom, onZoomIn, onZoomOut, onResetZoom, onClose }) {
  if (!lightbox) return null;

  return (
    <div className="admin-lightbox-overlay" onClick={onClose}>
      <div className="admin-lightbox-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-lightbox-header">
          <div>
            <h4 className="admin-lightbox-title">{lightbox.title}</h4>
            <span className="admin-lightbox-subtitle">
              {lightbox.side === 'back' ? '🏷️ Aperçu Flocage Dos' : '👁️ Aperçu Face Avant'} • Zoom {Math.round(zoom * 100)}%
            </span>
          </div>
          <div className="admin-lightbox-controls">
            <button className="admin-lightbox-btn" onClick={onZoomOut} title="Zoom arrière">➖</button>
            <button className="admin-lightbox-btn" onClick={onResetZoom} title="Réinitialiser zoom">100%</button>
            <button className="admin-lightbox-btn" onClick={onZoomIn} title="Zoom avant">➕</button>
            {lightbox.src && (
              <a 
                href={lightbox.src} 
                download="maillot-jogalook.png" 
                target="_blank" 
                rel="noreferrer" 
                className="admin-lightbox-btn" 
                title="Ouvrir dans un nouvel onglet"
              >
                ↗ Ouvrir
              </a>
            )}
            <button className="admin-lightbox-btn admin-lightbox-btn--close" onClick={onClose} title="Fermer">✕</button>
          </div>
        </div>

        <div className="admin-lightbox-body">
          {lightbox.src ? (
            <img 
              src={lightbox.src} 
              alt={lightbox.title} 
              className="admin-lightbox-img"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : lightbox.customItem ? (
            <div 
              className="admin-jersey-simulated admin-jersey-simulated--lightbox"
              style={{ 
                backgroundColor: lightbox.customItem.primaryColor || '#1A237E',
                transform: `scale(${zoom})` 
              }}
            >
              <div className="admin-simulated-collar" style={{ backgroundColor: lightbox.customItem.collarColor || lightbox.customItem.secondaryColor || '#FFFFFF' }}></div>
              <div className="admin-simulated-content">
                <div 
                  className="admin-simulated-name" 
                  style={{ fontFamily: lightbox.customItem.fontFamily, color: lightbox.customItem.secondaryColor || '#FFFFFF' }}
                >
                  {lightbox.customItem.customName || 'VOTRE NOM'}
                </div>
                <div 
                  className="admin-simulated-number" 
                  style={{ fontFamily: lightbox.customItem.fontFamily, color: lightbox.customItem.secondaryColor || '#FFFFFF' }}
                >
                  {lightbox.customItem.customNumber || '00'}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtres
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'PAID' | ...
  const [cityFilter, setCityFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Commande sélectionnée pour le détail / modale
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Nouveaux états : onglet modale, visualiseur et lightbox
  const [modalTab, setModalTab] = useState('overview'); // 'overview' | 'workshop' | 'delivery' | 'payment'
  const [lightbox, setLightbox] = useState(null); // { src, title, side, customItem }
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [activeSides, setActiveSides] = useState({}); // { [idx]: 'both' | 'front' | 'back' }
  const [atelierChecklist, setAtelierChecklist] = useState({});
  const [copiedWorkshopText, setCopiedWorkshopText] = useState(false);

  // Charger les commandes
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(API);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setItems(json.data);
      } else {
        setItems(MOCK_ORDERS);
      }
    } catch {
      setItems(MOCK_ORDERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Ouverture de la modale avec onglet initial
  const openOrderModal = (order, initialTab = 'overview') => {
    setSelected(order);
    setModalTab(initialTab);
    setActiveSides({});
    setCopiedWorkshopText(false);
  };

  // Gestion du zoom Lightbox
  const handleZoom = (src, title, side = 'front', customItem = null) => {
    setLightbox({ src, title, side, customItem });
    setLightboxZoom(1);
  };

  // Copier le résumé atelier
  const copyWorkshopSpecs = (order) => {
    if (!order) return;
    const customs = order.itemsList.filter(i => i.isCustom);
    if (customs.length === 0) return;

    let text = `=== FICHE ATELIER JOGALOOK - COMMANDE ${order.orderNumber} ===\n`;
    text += `Client: ${order.clientName} | Tél: ${order.clientPhone || '—'}\n`;
    text += `Date: ${formatDate(order.createdAt)}\n\n`;

    customs.forEach((it, idx) => {
      text += `[ARTICLE ${idx + 1}] ${it.productName}\n`;
      text += `• Taille : ${it.size} | Quantité : x${it.quantity}\n`;
      text += `• Nom floqué : ${it.customName || 'SANS NOM'}\n`;
      text += `• Numéro floqué : ${it.customNumber ? '#' + it.customNumber : 'SANS NUMÉRO'}\n`;
      text += `• Police : ${it.fontFamily || 'Standard'}\n`;
      text += `• Couleur Tissu : ${it.primaryColor || 'Standard'}\n`;
      if (it.secondaryColor) text += `• Couleur Bandes / Col : ${it.secondaryColor}\n`;
      if (it.badges && it.badges.length > 0) text += `• Badges / Écussons : ${it.badges.join(', ')}\n`;
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedWorkshopText(true);
    setTimeout(() => setCopiedWorkshopText(false), 2500);
  };

  // Normalisation des propriétés de commande
  const getOrderData = useCallback((o) => {
    const id = o.id || '—';
    const orderNumber = o.order_number || `#JL-${id.slice(0, 8).toUpperCase()}`;
    const status = (o.status || 'PENDING').toUpperCase();
    const amount = Number(o.total_amount ?? o.total_price ?? o.subtotal ?? 0);
    const createdAt = o.created_at || new Date().toISOString();

    // Client
    const clientName = o.users
      ? [o.users.first_name, o.users.last_name].filter(Boolean).join(' ')
      : o.customer_name || o.shipping_address?.recipient_name || 'Client JogaLook';
    
    const clientPhone = o.users?.phone || o.customer_phone || o.phone_number || o.shipping_address?.phone || '';
    const clientEmail = o.users?.email || o.customer_email || '';

    // Adresse & Livraison
    const rawAddress = o.delivery_address || o.shipping_address?.street_address || o.shipping_address_text || '';
    let city = o.city || o.shipping_address?.city || '';
    if (!city) {
      if (rawAddress.includes('Saint-Louis')) city = 'Saint-Louis';
      else if (rawAddress.includes('Kaolack')) city = 'Kaolack';
      else if (rawAddress.includes('Thiès') || rawAddress.includes('Thies')) city = 'Thiès';
      else city = 'Dakar';
    }

    let deliveryType = o.delivery_type;
    if (!deliveryType) {
      if (rawAddress.includes('GPS') || o.latitude) deliveryType = 'gps';
      else if (rawAddress.toLowerCase().includes('appel') || rawAddress.toLowerCase().includes('phone')) deliveryType = 'phone_call';
      else if (rawAddress.toLowerCase().includes('retrait') || rawAddress.toLowerCase().includes('boutique') || rawAddress.toLowerCase().includes('collect')) deliveryType = 'pickup';
      else deliveryType = 'manual';
    }

    const gps = o.latitude && o.longitude 
      ? { lat: Number(o.latitude), lng: Number(o.longitude) } 
      : extractGps(rawAddress);

    // Paiement
    const paymentMethod = o.payments?.[0]?.payment_method || o.payment_method || 'wave';
    const paymentStatus = o.payments?.[0]?.status || (['PAID', 'DELIVERED'].includes(status) ? 'SUCCESS' : paymentMethod === 'cash_on_delivery' ? 'ON_DELIVERY' : 'PENDING');
    const paymentRef = o.payments?.[0]?.transaction_reference || o.transaction_reference || '—';

    // Articles normalisés
    const rawItems = o.order_items || o.items || o.payments?.[0]?.payload?.items || [];
    const itemsList = rawItems.map(normalizeOrderItem);
    const hasCustomization = itemsList.some(it => it.isCustom);

    return {
      ...o,
      id,
      orderNumber,
      status,
      amount,
      createdAt,
      clientName,
      clientPhone,
      clientEmail,
      rawAddress,
      city,
      deliveryType,
      gps,
      paymentMethod,
      paymentStatus,
      paymentRef,
      itemsList,
      hasCustomization
    };
  }, []);

  const normalizedOrders = useMemo(() => {
    return items.map(getOrderData);
  }, [items, getOrderData]);

  // Statistiques KPIs
  const stats = useMemo(() => {
    const totalCount = normalizedOrders.length;
    const totalSales = normalizedOrders.reduce((sum, o) => o.status !== 'CANCELLED' ? sum + o.amount : sum, 0);
    const pendingCount = normalizedOrders.filter(o => o.status === 'PENDING').length;
    const paidCount = normalizedOrders.filter(o => o.status === 'PAID').length;
    const processingCount = normalizedOrders.filter(o => o.status === 'PROCESSING').length;
    const shippedCount = normalizedOrders.filter(o => o.status === 'SHIPPED').length;
    const deliveredCount = normalizedOrders.filter(o => o.status === 'DELIVERED').length;
    const cancelledCount = normalizedOrders.filter(o => o.status === 'CANCELLED').length;

    return {
      totalCount,
      totalSales,
      pendingCount,
      paidCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount
    };
  }, [normalizedOrders]);

  // Filtrage et Tri
  const filteredOrders = useMemo(() => {
    return normalizedOrders.filter(o => {
      // Filtre onglet statut
      if (activeTab !== 'ALL' && o.status !== activeTab) return false;

      // Filtre Ville
      if (cityFilter && o.city.toLowerCase() !== cityFilter.toLowerCase()) return false;

      // Filtre Paiement
      if (paymentFilter && o.paymentMethod !== paymentFilter) return false;

      // Filtre Recherche
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchRef   = o.orderNumber.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
        const matchName  = o.clientName.toLowerCase().includes(q);
        const matchPhone = o.clientPhone.toLowerCase().includes(q);
        const matchEmail = o.clientEmail.toLowerCase().includes(q);
        const matchCity  = o.city.toLowerCase().includes(q);
        const matchItem  = o.itemsList.some(it => (it.product_name || it.name || '').toLowerCase().includes(q));
        if (!matchRef && !matchName && !matchPhone && !matchEmail && !matchCity && !matchItem) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'date_asc')  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc')  return a.amount - b.amount;
      return 0;
    });
  }, [normalizedOrders, activeTab, cityFilter, paymentFilter, search, sortBy]);

  // Mise à jour du statut
  const updateStatus = async (id, newStatus) => {
    setUpdating(true);
    try {
      await fetch(`${API}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: statusNote || undefined }),
      });
      
      // Mettre à jour l'état local
      setItems(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (selected && selected.id === id) {
        setSelected(prev => ({ ...prev, status: newStatus }));
      }
      setStatusNote('');
    } catch {
      // Fallback local
      setItems(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (selected && selected.id === id) {
        setSelected(prev => ({ ...prev, status: newStatus }));
      }
    } finally {
      setUpdating(false);
    }
  };

  // Copier la référence
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Impression de la commande / Bon de livraison
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Référence', 'Date', 'Client', 'Téléphone', 'Email', 'Ville', 'Type Livraison', 'Montant (FCFA)', 'Mode Paiement', 'Statut'];
    const rows = filteredOrders.map(o => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleString('fr-FR')}"`,
      `"${o.clientName}"`,
      `"${o.clientPhone}"`,
      `"${o.clientEmail}"`,
      `"${o.city}"`,
      `"${o.deliveryType}"`,
      o.amount,
      `"${o.paymentMethod}"`,
      `"${o.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `commandes_jogalook_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-orders-page">
      
      {/* ── EN-TÊTE PRINCIPALE ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            <OrderIcon /> <span>Gestion des Commandes</span>
          </h1>
          <p className="admin-page-subtitle">
            Suivi des ventes, préparation des colis, expéditions et livraisons géolocalisées.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="admin-btn admin-btn--ghost admin-btn--sm" 
            onClick={() => load(true)}
            disabled={refreshing}
            title="Rafraîchir les données"
          >
            <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s' }}>🔄</span>
            {refreshing ? 'Chargement…' : 'Actualiser'}
          </button>
          <button className="admin-btn admin-btn--primary admin-btn--sm admin-export-btn" onClick={handleExportCSV}>
            📥 Exporter CSV
          </button>
        </div>
      </div>

      {/* ── CARTES STATISTIQUES (KPIS) ── */}
      <div className="admin-orders-kpis">
        <div 
          className={`admin-kpi-card ${activeTab === 'ALL' ? 'admin-kpi-card--active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          <div className="admin-kpi-icon admin-kpi-icon--all">📦</div>
          <div className="admin-kpi-content">
            <p className="admin-kpi-label">Toutes les commandes</p>
            <h3 className="admin-kpi-val">{stats.totalCount}</h3>
            <p className="admin-kpi-sub">Total : {formatFCFA(stats.totalSales)}</p>
          </div>
        </div>

        <div 
          className={`admin-kpi-card ${activeTab === 'PENDING' ? 'admin-kpi-card--active' : ''}`}
          onClick={() => setActiveTab('PENDING')}
        >
          <div className="admin-kpi-icon admin-kpi-icon--pending">⏳</div>
          <div className="admin-kpi-content">
            <p className="admin-kpi-label">En attente</p>
            <h3 className="admin-kpi-val">{stats.pendingCount}</h3>
            <p className="admin-kpi-sub">À confirmer / initier</p>
          </div>
        </div>

        <div 
          className={`admin-kpi-card ${activeTab === 'PAID' ? 'admin-kpi-card--active' : ''}`}
          onClick={() => setActiveTab('PAID')}
        >
          <div className="admin-kpi-icon admin-kpi-icon--paid">💳</div>
          <div className="admin-kpi-content">
            <p className="admin-kpi-label">Payées</p>
            <h3 className="admin-kpi-val">{stats.paidCount}</h3>
            <p className="admin-kpi-sub">Prêtes à être traitées</p>
          </div>
        </div>

        <div 
          className={`admin-kpi-card ${activeTab === 'PROCESSING' ? 'admin-kpi-card--active' : ''}`}
          onClick={() => setActiveTab('PROCESSING')}
        >
          <div className="admin-kpi-icon admin-kpi-icon--processing">⚙️</div>
          <div className="admin-kpi-content">
            <p className="admin-kpi-label">En préparation</p>
            <h3 className="admin-kpi-val">{stats.processingCount}</h3>
            <p className="admin-kpi-sub">Flocage & Colisage</p>
          </div>
        </div>

        <div 
          className={`admin-kpi-card ${activeTab === 'SHIPPED' ? 'admin-kpi-card--active' : ''}`}
          onClick={() => setActiveTab('SHIPPED')}
        >
          <div className="admin-kpi-icon admin-kpi-icon--shipped">🚚</div>
          <div className="admin-kpi-content">
            <p className="admin-kpi-label">En livraison</p>
            <h3 className="admin-kpi-val">{stats.shippedCount}</h3>
            <p className="admin-kpi-sub">Avec les livreurs</p>
          </div>
        </div>

        <div 
          className={`admin-kpi-card ${activeTab === 'DELIVERED' ? 'admin-kpi-card--active' : ''}`}
          onClick={() => setActiveTab('DELIVERED')}
        >
          <div className="admin-kpi-icon admin-kpi-icon--delivered">✅</div>
          <div className="admin-kpi-content">
            <p className="admin-kpi-label">Livrées</p>
            <h3 className="admin-kpi-val">{stats.deliveredCount}</h3>
            <p className="admin-kpi-sub">Commandes terminées</p>
          </div>
        </div>
      </div>

      {/* ── SECTION TABLEAU & FILTRES ── */}
      <div className="admin-card">
        
        {/* Onglets rapides par statut */}
        <div className="admin-orders-tabs">
          <button 
            className={`admin-tab-btn ${activeTab === 'ALL' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tous <span className="admin-tab-count">{stats.totalCount}</span>
          </button>
          {STATUSES.map(s => {
            const count = normalizedOrders.filter(o => o.status === s.id).length;
            return (
              <button
                key={s.id}
                className={`admin-tab-btn ${activeTab === s.id ? 'admin-tab-btn--active' : ''}`}
                onClick={() => setActiveTab(s.id)}
              >
                <span>{s.icon}</span> {s.label} <span className="admin-tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar de recherche & filtres secondaires */}
        <div className="admin-card__header" style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--admin-border, #E4E7EC)' }}>
          <div className="admin-orders-filters">
            {/* Recherche globale */}
            <div className="admin-search admin-orders-search">
              <SearchIcon />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Rechercher par référence, client, téléphone, ville, produit…" 
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtre Ville */}
            <select 
              className="admin-select" 
              value={cityFilter} 
              onChange={e => setCityFilter(e.target.value)}
            >
              <option value="">Toutes les villes</option>
              <option value="Dakar">Dakar</option>
              <option value="Saint-Louis">Saint-Louis</option>
              <option value="Kaolack">Kaolack</option>
              <option value="Thiès">Thiès</option>
            </select>

            {/* Filtre Mode de paiement */}
            <select 
              className="admin-select" 
              value={paymentFilter} 
              onChange={e => setPaymentFilter(e.target.value)}
            >
              <option value="">Tous les règlements</option>
              <option value="wave">Wave 🇸🇳</option>
              <option value="orange_money">Orange Money 🇸🇳</option>
              <option value="free_money">Free Money 🇸🇳</option>
              <option value="cash_on_delivery">Paiement à la livraison</option>
              <option value="card">Carte bancaire</option>
            </select>

            {/* Tri */}
            <select 
              className="admin-select" 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="date_desc">📅 Plus récentes d'abord</option>
              <option value="date_asc">📅 Plus anciennes d'abord</option>
              <option value="amount_desc">💰 Montant le plus élevé</option>
              <option value="amount_asc">💰 Montant le moins élevé</option>
            </select>
          </div>
        </div>

        {/* Tableau des commandes */}
        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              <p style={{ marginTop: '12px', color: 'var(--admin-text-muted)' }}>Chargement des commandes…</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty__icon"><EmptyIcon /></div>
              <p style={{ fontWeight: 600, fontSize: '1rem', margin: '8px 0 4px' }}>Aucune commande trouvée</p>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>
                Essayez d'ajuster votre recherche ou vos filtres.
              </p>
              {(search || cityFilter || paymentFilter || activeTab !== 'ALL') && (
                <button 
                  className="admin-btn admin-btn--outline admin-btn--sm"
                  onClick={() => { setSearch(''); setCityFilter(''); setPaymentFilter(''); setActiveTab('ALL'); }}
                  style={{ marginTop: '12px' }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Référence & Date</th>
                  <th>Client</th>
                  <th>Articles</th>
                  <th>Destination</th>
                  <th>Paiement</th>
                  <th>Montant Net</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => {
                  const statusObj = STATUSES.find(s => s.id === o.status) || { label: o.status, color: 'gray', icon: '•' };
                  const payMeta = PAYMENT_METHOD_NAMES[o.paymentMethod] || { label: o.paymentMethod || 'Inconnu', badge: 'card' };
                  const initials = (o.clientName || 'C').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

                  return (
                    <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => openOrderModal(o, 'overview')}>
                      
                      {/* Référence */}
                      <td>
                        <div className="admin-order-id-cell">
                          <span className="admin-order-ref" onClick={(e) => { e.stopPropagation(); openOrderModal(o, 'overview'); }}>
                            {o.orderNumber}
                          </span>
                          <span className="admin-order-date">
                            {formatDate(o.createdAt)}
                          </span>
                          {o.hasCustomization && (
                            <span 
                              className="admin-cust-badge"
                              title="Cliquer pour ouvrir directement la Fiche Atelier Flocage"
                              onClick={(e) => { e.stopPropagation(); openOrderModal(o, 'workshop'); }}
                            >
                              ✨ Flocage Atelier ↗
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Client */}
                      <td>
                        <div className="admin-client-cell">
                          <div className="admin-client-avatar">
                            {initials}
                          </div>
                          <div className="admin-client-info">
                            <span className="admin-client-name">{o.clientName}</span>
                            <div className="admin-client-contact">
                              {o.clientPhone ? (
                                <a 
                                  href={`tel:${o.clientPhone}`} 
                                  className="admin-contact-link"
                                  onClick={e => e.stopPropagation()}
                                >
                                  📞 {o.clientPhone}
                                </a>
                              ) : o.clientEmail ? (
                                <span title={o.clientEmail}>{o.clientEmail.slice(0, 18)}…</span>
                              ) : (
                                <span>—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Articles */}
                      <td>
                        <div className="admin-items-preview">
                          <div className="admin-items-thumbs">
                            {o.itemsList.slice(0, 3).map((it, idx) => {
                              const img = it.previewFront || it.image || it.image_url || '/favicon.ico';
                              return (
                                <img 
                                  key={idx} 
                                  src={img} 
                                  alt={it.productName || 'Article'} 
                                  className="admin-item-thumb" 
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              );
                            })}
                          </div>
                          <span className="admin-items-count-badge">
                            {o.itemsList.reduce((sum, it) => sum + (it.quantity || 1), 0) || 1} art.
                          </span>
                        </div>
                      </td>

                      {/* Destination & Mode */}
                      <td>
                        <div className="admin-location-cell">
                          <span className="admin-city-tag">
                            📍 {o.city || 'Dakar'}
                          </span>
                          <span className="admin-delivery-type">
                            {o.deliveryType === 'gps' && '📡 GPS Précis'}
                            {o.deliveryType === 'phone_call' && '📞 Appel'}
                            {o.deliveryType === 'pickup' && '🏪 Retrait boutique'}
                            {o.deliveryType === 'manual' && '✍️ Adresse saisie'}
                          </span>
                          {o.gps && (
                            <a
                              href={`https://maps.google.com/?q=${o.gps.lat},${o.gps.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-gps-link"
                              onClick={e => e.stopPropagation()}
                            >
                              Maps ↗
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Paiement */}
                      <td>
                        <span className={`admin-pay-badge admin-pay-badge--${payMeta.badge}`}>
                          {payMeta.label}
                        </span>
                      </td>

                      {/* Montant Net */}
                      <td>
                        <span className="admin-price-cell">
                          {formatFCFA(o.amount)}
                        </span>
                      </td>

                      {/* Statut */}
                      <td>
                        <div className="admin-status-select-wrap" onClick={e => e.stopPropagation()}>
                          <select
                            className={`admin-status-dropdown admin-badge--${statusObj.color}`}
                            value={o.status}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            disabled={updating}
                          >
                            {STATUSES.map(st => (
                              <option key={st.id} value={st.id}>
                                {st.icon} {st.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="admin-btn admin-btn--ghost admin-btn--sm"
                            onClick={(e) => { e.stopPropagation(); openOrderModal(o, 'overview'); }}
                            title="Consulter tous les détails"
                          >
                            <EyeIcon /> Voir
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer pagination info */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--admin-border, #E4E7EC)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
          <span>Affichage de <strong>{filteredOrders.length}</strong> sur <strong>{normalizedOrders.length}</strong> commande(s)</span>
          <span>JogaLook E-Commerce & Custom Jersey Manager</span>
        </div>

      </div>

      {/* ============================================================
          MODALE DE DÉTAIL COMPLET DE LA COMMANDE
          ============================================================ */}
      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal admin-order-modal" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="admin-modal__header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 className="admin-modal__title" style={{ margin: 0 }}>
                    Commande {selected.orderNumber}
                  </h3>
                  <button 
                    className="admin-btn admin-btn--ghost admin-btn--sm"
                    onClick={() => handleCopy(selected.orderNumber)}
                    title="Copier la référence"
                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                  >
                    {copiedId ? '✓ Copié' : '📋 Copier'}
                  </button>
                  {selected.hasCustomization && (
                    <span className="admin-cust-badge admin-cust-badge--header">
                      ✨ Atelier Flocage
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                  Passée le {formatDate(selected.createdAt)} • Client : <strong>{selected.clientName}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="admin-btn admin-btn--outline admin-btn--sm" onClick={handlePrint} title="Imprimer le bon de commande">
                  🖨️ Imprimer
                </button>
                <button className="admin-modal__close" onClick={() => setSelected(null)}>
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Notification Atelier si maillot customisé */}
            {selected.hasCustomization && (
              <div className="admin-modal-custom-alert">
                <div className="admin-modal-custom-alert__left">
                  <span className="admin-custom-alert-icon">🎨</span>
                  <div>
                    <strong>Commande avec personnalisation textile atelier ({selected.itemsList.filter(i => i.isCustom).length} maillot(s) floqué(s))</strong>
                    <p>Cette commande nécessite la découpe vinyle et le thermocollage selon les spécifications client.</p>
                  </div>
                </div>
                {modalTab !== 'workshop' && (
                  <button 
                    className="admin-btn admin-btn--primary admin-btn--sm"
                    onClick={() => setModalTab('workshop')}
                  >
                    👉 Ouvrir la Fiche Atelier Flocage
                  </button>
                )}
              </div>
            )}

            {/* Modal Navigation Tabs */}
            <div className="admin-modal-subnav">
              <button 
                className={`admin-modal-subnav-btn ${modalTab === 'overview' ? 'admin-modal-subnav-btn--active' : ''}`}
                onClick={() => setModalTab('overview')}
              >
                📋 Vue d'ensemble & Articles ({selected.itemsList.length})
              </button>
              
              {selected.hasCustomization && (
                <button 
                  className={`admin-modal-subnav-btn admin-modal-subnav-btn--workshop ${modalTab === 'workshop' ? 'admin-modal-subnav-btn--active' : ''}`}
                  onClick={() => setModalTab('workshop')}
                >
                  <span className="admin-workshop-live-dot" />
                  ✨ Fiche Atelier Flocage ({selected.itemsList.filter(i => i.isCustom).length})
                </button>
              )}

              <button 
                className={`admin-modal-subnav-btn ${modalTab === 'delivery' ? 'admin-modal-subnav-btn--active' : ''}`}
                onClick={() => setModalTab('delivery')}
              >
                📍 Destination & Réception
              </button>

              <button 
                className={`admin-modal-subnav-btn ${modalTab === 'payment' ? 'admin-modal-subnav-btn--active' : ''}`}
                onClick={() => setModalTab('payment')}
              >
                💳 Règlement & Encaissement
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="admin-order-modal__body">

              {/* ==========================================
                  ONGLET 1 : VUE D'ENSEMBLE & ARTICLES
                  ========================================== */}
              {modalTab === 'overview' && (
                <div className="admin-tab-content">
                  
                  {/* Timeline de Progression */}
                  <div className="admin-timeline">
                    {[
                      { id: 'PENDING',    label: '1. En attente',   icon: '⏳' },
                      { id: 'PAID',       label: '2. Payée',        icon: '💳' },
                      { id: 'PROCESSING', label: '3. En atelier',   icon: '⚙️' },
                      { id: 'SHIPPED',    label: '4. En livraison', icon: '🚚' },
                      { id: 'DELIVERED',  label: '5. Livrée',       icon: '✅' },
                    ].map((step, idx) => {
                      const stepIndex = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].indexOf(selected.status);
                      const isCompleted = stepIndex >= idx && selected.status !== 'CANCELLED';
                      const isCurrent = selected.status === step.id;
                      const isCancelled = selected.status === 'CANCELLED';

                      return (
                        <div 
                          key={step.id} 
                          className={`admin-timeline-step ${isCompleted ? 'admin-timeline-step--completed' : ''} ${isCurrent ? 'admin-timeline-step--current' : ''} ${isCancelled ? 'admin-timeline-step--cancelled' : ''}`}
                        >
                          <div className="admin-timeline-dot">
                            {isCompleted ? '✓' : step.icon}
                          </div>
                          <span className="admin-timeline-label">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Barre d'action rapide pour changer le statut */}
                  <div className="admin-status-box">
                    <div className="admin-status-box__left">
                      <span className="admin-status-box__title">Modifier l'état :</span>
                      <span className={`admin-badge admin-badge--${(STATUSES.find(s => s.id === selected.status) || {}).color || 'gray'}`}>
                        {(STATUSES.find(s => s.id === selected.status) || {}).label || selected.status}
                      </span>
                    </div>
                    <div className="admin-status-btn-group">
                      {STATUSES.map(s => (
                        <button
                          key={s.id}
                          className={`admin-btn admin-btn--sm ${selected.status === s.id ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
                          onClick={() => updateStatus(selected.id, s.id)}
                          disabled={updating || selected.status === s.id}
                        >
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Liste des Articles */}
                  <div className="admin-modal-items">
                    <div className="admin-modal-items__title">
                      <span>Articles de la commande ({selected.itemsList.length})</span>
                      <span>Total : {formatFCFA(selected.amount)}</span>
                    </div>
                    
                    {selected.itemsList.map((item, idx) => {
                      return (
                        <div key={idx} className={`admin-item-row ${item.isCustom ? 'admin-item-row--custom' : ''}`}>
                          
                          {/* Miniatures Visuelles (Face et Dos si custom) */}
                          <div className="admin-item-row__visuals">
                            <div 
                              className="admin-item-mini-thumb" 
                              title="Cliquer pour agrandir la face avant"
                              onClick={() => handleZoom(item.previewFront || item.image, `${item.productName} - Face Avant`, 'front', item)}
                            >
                              <img 
                                src={item.previewFront || item.image || '/favicon.ico'} 
                                alt="Face" 
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <span className="admin-mini-tag">Face</span>
                            </div>

                            {item.isCustom && (
                              <div 
                                className="admin-item-mini-thumb admin-item-mini-thumb--back"
                                title="Cliquer pour agrandir le dos / flocage"
                                onClick={() => handleZoom(item.previewBack, `${item.productName} - Dos & Flocage`, 'back', item)}
                              >
                                {item.previewBack ? (
                                  <img 
                                    src={item.previewBack} 
                                    alt="Dos" 
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div 
                                    className="admin-mini-simulated"
                                    style={{ backgroundColor: item.primaryColor || '#1A237E' }}
                                  >
                                    <span style={{ color: item.secondaryColor || '#fff', fontFamily: item.fontFamily }}>
                                      {item.customNumber || '#'}
                                    </span>
                                  </div>
                                )}
                                <span className="admin-mini-tag">Dos</span>
                              </div>
                            )}
                          </div>

                          {/* Infos Article */}
                          <div className="admin-item-row__info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <p className="admin-item-row__name">
                                {item.productName}
                              </p>
                              {item.isCustom ? (
                                <span className="admin-cust-pill">✨ Maillot Personnalisé Atelier</span>
                              ) : (
                                <span className="admin-item-tag">Catalogue</span>
                              )}
                            </div>

                            <div className="admin-item-row__meta">
                              <span className="admin-item-tag">Taille : <strong>{item.size}</strong></span>
                              <span className="admin-item-tag">Quantité : <strong>x{item.quantity}</strong></span>
                              {item.primaryColor && (
                                <span className="admin-item-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.primaryColor, display: 'inline-block' }} />
                                  Couleur : {item.primaryColor}
                                </span>
                              )}
                            </div>

                            {/* Spécifications Flocage rapide si customisé */}
                            {item.isCustom && (
                              <div className="admin-item-custom-box">
                                <div className="admin-custom-box-header">
                                  <strong>🏷️ Flocage Atelier :</strong>
                                  <button 
                                    className="admin-open-workshop-link"
                                    onClick={() => setModalTab('workshop')}
                                  >
                                    Inspecter dans la Fiche Atelier ↗
                                  </button>
                                </div>
                                <div className="admin-custom-box-chips">
                                  {item.customName && (
                                    <span className="admin-custom-chip">
                                      Nom : <strong>{item.customName}</strong>
                                    </span>
                                  )}
                                  {item.customNumber && (
                                    <span className="admin-custom-chip">
                                      Numéro : <strong>#{item.customNumber}</strong>
                                    </span>
                                  )}
                                  {item.fontFamily && (
                                    <span className="admin-custom-chip">
                                      Police : <em>{item.fontFamily}</em>
                                    </span>
                                  )}
                                  {item.badges && item.badges.length > 0 && (
                                    <span className="admin-custom-chip admin-custom-chip--badge">
                                      🛡️ Badges : {item.badges.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Prix */}
                          <div className="admin-item-row__price">
                            <span className="admin-item-row__unit">{formatFCFA(item.unitPrice)} / u</span>
                            <p className="admin-item-row__total">{formatFCFA(item.totalPrice)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Récapitulatif Financier Final */}
                  <div className="admin-order-totals">
                    <div className="admin-total-line">
                      <span>Sous-total articles ({selected.itemsList.length})</span>
                      <span>{formatFCFA(selected.amount)}</span>
                    </div>
                    <div className="admin-total-line">
                      <span>Frais de livraison ({selected.city || 'Dakar'})</span>
                      <span style={{ color: '#16A34A', fontWeight: 600 }}>Gratuit (Offert)</span>
                    </div>
                    <div className="admin-total-line admin-total-line--final">
                      <span>Total net à régler</span>
                      <strong>{formatFCFA(selected.amount)}</strong>
                    </div>
                  </div>

                </div>
              )}

              {/* ==========================================
                  ONGLET 2 : ATELIER DE FLOCAGE DÉDIÉ
                  ========================================== */}
              {modalTab === 'workshop' && (
                <div className="admin-workshop-view">
                  
                  {/* Workshop Header Banner */}
                  <div className="admin-workshop-header-banner">
                    <div className="admin-workshop-header-info">
                      <span className="admin-workshop-badge">🏭 ATELIER DE CONFECTION & FLOCAGE</span>
                      <h4 style={{ margin: '4px 0', fontSize: '1.05rem', color: '#1A1A2E' }}>
                        Fiche Technique Atelier — Commande {selected.orderNumber}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                        Spécifications pour découpe vinyle, alignement dos et thermocollage textile ({selected.itemsList.filter(i => i.isCustom).length} article(s) à confectionner).
                      </p>
                    </div>
                    <div className="admin-workshop-actions">
                      <button 
                        className="admin-btn admin-btn--outline admin-btn--sm"
                        onClick={() => copyWorkshopSpecs(selected)}
                        title="Copier les spécifications techniques au presse-papier"
                      >
                        {copiedWorkshopText ? '✓ Spécifications copiées !' : '📋 Copier la fiche atelier'}
                      </button>
                      <button 
                        className="admin-btn admin-btn--primary admin-btn--sm"
                        onClick={handlePrint}
                        title="Imprimer le bon de commande atelier"
                      >
                        🖨️ Imprimer la fiche atelier
                      </button>
                    </div>
                  </div>

                  {/* Cartes des Maillots Personnalisés */}
                  <div className="admin-workshop-cards">
                    {selected.itemsList.filter(i => i.isCustom).map((item, idx) => {
                      const side = activeSides[idx] || 'both'; // 'both' | 'front' | 'back'
                      return (
                        <div key={idx} className="admin-workshop-card">
                          
                          {/* En-tête de la carte */}
                          <div className="admin-workshop-card__top">
                            <div>
                              <span className="admin-workshop-item-num">Maillot #{idx + 1}</span>
                              <h4 className="admin-workshop-item-title">{item.productName}</h4>
                            </div>
                            <div className="admin-workshop-pill-group">
                              <span className="admin-item-tag admin-item-tag--size">Taille : <strong>{item.size}</strong></span>
                              <span className="admin-item-tag admin-item-tag--qty">Quantité : <strong>x{item.quantity}</strong></span>
                              <span className="admin-item-tag admin-item-tag--price">{formatFCFA(item.totalPrice)}</span>
                            </div>
                          </div>

                          {/* Contenu principal : Visuel à gauche, Spécifications à droite */}
                          <div className="admin-workshop-card__content">
                            
                            {/* Colonne Visuelle */}
                            <div className="admin-workshop-visuals-col">
                              <div className="admin-side-toggle-bar">
                                <button 
                                  className={`admin-side-btn ${side === 'both' ? 'admin-side-btn--active' : ''}`}
                                  onClick={() => setActiveSides(p => ({ ...p, [idx]: 'both' }))}
                                >
                                  Face & Dos
                                </button>
                                <button 
                                  className={`admin-side-btn ${side === 'front' ? 'admin-side-btn--active' : ''}`}
                                  onClick={() => setActiveSides(p => ({ ...p, [idx]: 'front' }))}
                                >
                                  Face Avant
                                </button>
                                <button 
                                  className={`admin-side-btn ${side === 'back' ? 'admin-side-btn--active' : ''}`}
                                  onClick={() => setActiveSides(p => ({ ...p, [idx]: 'back' }))}
                                >
                                  Dos & Flocage
                                </button>
                              </div>

                              <div className={`admin-workshop-previews ${side === 'both' ? 'admin-workshop-previews--split' : ''}`}>
                                {(side === 'both' || side === 'front') && (
                                  <div className="admin-preview-pane">
                                    <span className="admin-pane-label">Face Avant</span>
                                    <JerseyFrontVisualizer item={item} onZoom={handleZoom} />
                                  </div>
                                )}

                                {(side === 'both' || side === 'back') && (
                                  <div className="admin-preview-pane">
                                    <span className="admin-pane-label">Dos & Flocage</span>
                                    <JerseyBackVisualizer item={item} onZoom={handleZoom} />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Colonne Fiche Technique */}
                            <div className="admin-workshop-specs-col">
                              <h5 className="admin-specs-title">📐 Fiche Technique Flocage</h5>

                              <div className="admin-flocage-display-box">
                                <div className="admin-flocage-display-row">
                                  <span className="admin-flocage-display-label">NOM FLOQUÉ</span>
                                  <strong 
                                    className="admin-flocage-display-val admin-flocage-name"
                                    style={{ fontFamily: item.fontFamily }}
                                  >
                                    {item.customName || '— AUCUN NOM —'}
                                  </strong>
                                </div>

                                <div className="admin-flocage-display-row">
                                  <span className="admin-flocage-display-label">NUMÉRO FLOQUÉ</span>
                                  <strong 
                                    className="admin-flocage-display-val admin-flocage-num"
                                    style={{ fontFamily: item.fontFamily }}
                                  >
                                    {item.customNumber ? `#${item.customNumber}` : '— SANS NUMÉRO —'}
                                  </strong>
                                </div>

                                <div className="admin-flocage-display-row">
                                  <span className="admin-flocage-display-label">POLICE TYPOGRAPHIQUE</span>
                                  <span className="admin-font-tag">
                                    ✒️ {item.fontFamily}
                                  </span>
                                </div>
                              </div>

                              {/* Nuancier Couleurs */}
                              <div className="admin-specs-group">
                                <span className="admin-specs-subtitle">Couleurs du maillot :</span>
                                <div className="admin-color-swatches">
                                  <div className="admin-color-swatch-item">
                                    <div className="admin-swatch-dot" style={{ backgroundColor: item.primaryColor }}></div>
                                    <div className="admin-swatch-info">
                                      <span>Tissu Principal</span>
                                      <code>{item.primaryColor || 'Par défaut'}</code>
                                    </div>
                                  </div>
                                  {item.secondaryColor && (
                                    <div className="admin-color-swatch-item">
                                      <div className="admin-swatch-dot" style={{ backgroundColor: item.secondaryColor }}></div>
                                      <div className="admin-swatch-info">
                                        <span>Bandes / Col</span>
                                        <code>{item.secondaryColor}</code>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Badges & Écussons */}
                              {item.badges && item.badges.length > 0 && (
                                <div className="admin-specs-group">
                                  <span className="admin-specs-subtitle">Badges & Écussons appliqués :</span>
                                  <div className="admin-badges-list">
                                    {item.badges.map((b, bIdx) => (
                                      <span key={bIdx} className="admin-badge-pill">
                                        🛡️ {b}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Checklist Fabrication Atelier */}
                              <div className="admin-specs-group admin-checklist-group">
                                <span className="admin-specs-subtitle">Checklist de production atelier :</span>
                                <div className="admin-checklist">
                                  {[
                                    '1. Découpe & Échenillage vinyle Flex / DTF',
                                    '2. Alignement dos (Nom à 5cm du col, Numéro centré)',
                                    '3. Pressage thermique (160°C - 15 secondes)',
                                    '4. Pose des écussons et badges officiels',
                                    '5. Contrôle qualité & Pliage sachet JogaLook'
                                  ].map((step, stepIdx) => {
                                    const checkKey = `${idx}-${stepIdx}`;
                                    const isChecked = Boolean(atelierChecklist[checkKey]);
                                    return (
                                      <label key={stepIdx} className={`admin-checklist-item ${isChecked ? 'admin-checklist-item--done' : ''}`}>
                                        <input 
                                          type="checkbox" 
                                          checked={isChecked}
                                          onChange={(e) => setAtelierChecklist(p => ({ ...p, [checkKey]: e.target.checked }))}
                                        />
                                        <span>{step}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==========================================
                  ONGLET 3 : DESTINATION & RÉCEPTION
                  ========================================== */}
              {modalTab === 'delivery' && (
                <div className="admin-tab-content">
                  <div className="admin-detail-grid">
                    
                    {/* Client */}
                    <div className="admin-detail-card">
                      <div className="admin-detail-card__header">
                        <h4 className="admin-detail-card__title"><UserIcon /> Client & Contacts</h4>
                      </div>
                      <div className="admin-detail-row">
                        <label>Nom complet</label>
                        <strong>{selected.clientName}</strong>
                      </div>
                      <div className="admin-detail-row">
                        <label>Téléphone Mobile Money</label>
                        <span>{selected.clientPhone || 'Non renseigné'}</span>
                      </div>
                      {selected.clientEmail && (
                        <div className="admin-detail-row">
                          <label>Email</label>
                          <span>{selected.clientEmail}</span>
                        </div>
                      )}
                      {selected.clientPhone && (
                        <div className="admin-quick-actions">
                          <a 
                            href={`tel:${selected.clientPhone}`} 
                            className="admin-action-chip"
                          >
                            📞 Appeler
                          </a>
                          <a 
                            href={`https://wa.me/221${selected.clientPhone.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="admin-action-chip admin-action-chip--whatsapp"
                          >
                            💬 WhatsApp
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Livraison / Localisation */}
                    <div className="admin-detail-card">
                      <div className="admin-detail-card__header">
                        <h4 className="admin-detail-card__title"><DeliveryIcon /> Mode de livraison & Lieu</h4>
                        <span className="admin-item-tag">{selected.city || 'Dakar'}</span>
                      </div>
                      <div className="admin-detail-row">
                        <label>Mode de réception</label>
                        <strong>
                          {selected.deliveryType === 'gps' && '📍 Position GPS satellite'}
                          {selected.deliveryType === 'phone_call' && '📞 Préciser par appel téléphonique'}
                          {selected.deliveryType === 'pickup' && '🏪 Retrait boutique (Dakar)'}
                          {selected.deliveryType === 'manual' && '✍️ Saisie manuelle'}
                        </strong>
                      </div>
                      <div className="admin-detail-row">
                        <label>Adresse / Indications</label>
                        <span>{selected.rawAddress || 'Adresse standard de livraison'}</span>
                      </div>
                      {selected.gps && (
                        <div className="admin-quick-actions">
                          <a 
                            href={`https://maps.google.com/?q=${selected.gps.lat},${selected.gps.lng}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="admin-action-chip admin-action-chip--maps"
                          >
                            📍 Itinéraire Google Maps ({selected.gps.lat.toFixed(4)}, {selected.gps.lng.toFixed(4)})
                          </a>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* ==========================================
                  ONGLET 4 : RÈGLEMENT & PAIEMENT
                  ========================================== */}
              {modalTab === 'payment' && (
                <div className="admin-tab-content">
                  <div className="admin-detail-grid">
                    <div className="admin-detail-card">
                      <div className="admin-detail-card__header">
                        <h4 className="admin-detail-card__title"><PaymentIcon /> Paiement & Encaissement</h4>
                      </div>
                      <div className="admin-detail-row">
                        <label>Moyen de paiement</label>
                        <strong>
                          {(PAYMENT_METHOD_NAMES[selected.paymentMethod] || {}).label || selected.paymentMethod}
                        </strong>
                      </div>
                      <div className="admin-detail-row">
                        <label>Statut du paiement</label>
                        <span className={`admin-badge admin-badge--${selected.paymentStatus === 'SUCCESS' || selected.status === 'PAID' ? 'paid' : selected.paymentStatus === 'ON_DELIVERY' ? 'pending' : 'gray'}`}>
                          {selected.paymentStatus === 'SUCCESS' || selected.status === 'PAID' ? 'Encaissé (Payé)' : selected.paymentStatus === 'ON_DELIVERY' ? 'À encaisser à la livraison' : 'En attente'}
                        </span>
                      </div>
                      <div className="admin-detail-row">
                        <label>Réf. Transaction</label>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{selected.paymentRef}</span>
                      </div>
                    </div>

                    <div className="admin-detail-card">
                      <div className="admin-detail-card__header">
                        <h4 className="admin-detail-card__title">Facturation & Montants</h4>
                      </div>
                      <div className="admin-detail-row">
                        <label>Sous-total articles ({selected.itemsList.length})</label>
                        <strong>{formatFCFA(selected.amount)}</strong>
                      </div>
                      <div className="admin-detail-row">
                        <label>Frais de livraison</label>
                        <strong style={{ color: '#16A34A' }}>0 FCFA (Gratuit)</strong>
                      </div>
                      <div className="admin-detail-row" style={{ marginTop: '8px', borderTop: '1px dashed #CBD5E1', paddingTop: '8px' }}>
                        <label>Total Commande Net</label>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--primary, #F15A24)' }}>{formatFCFA(selected.amount)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="admin-modal__footer">
              <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClockIcon />
                <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                  Dernière synchronisation : {new Date().toLocaleTimeString('fr-FR')}
                </span>
              </div>
              <button className="admin-btn admin-btn--outline" onClick={() => setSelected(null)}>
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          LIGHTBOX ZOOM MAILLOT HAUTE RÉSOLUTION
          ============================================================ */}
      <OrderLightbox 
        lightbox={lightbox}
        zoom={lightboxZoom}
        onZoomIn={() => setLightboxZoom(z => Math.min(3, z + 0.25))}
        onZoomOut={() => setLightboxZoom(z => Math.max(0.5, z - 0.25))}
        onResetZoom={() => setLightboxZoom(1)}
        onClose={() => setLightbox(null)}
      />

      {/* ============================================================
          VUE IMPRIMABLE (TICKET / BON DE COMMANDE LIVREUR & ATELIER)
          ============================================================ */}
      {selected && (
        <div className="admin-printable-slip" style={{ display: 'none' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>JOGALOOK SÉNÉGAL</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Bon de livraison & Ordre de Préparation Atelier</p>
          </div>

          <table style={{ width: '100%', marginBottom: '16px', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td><strong>N° Commande :</strong> {selected.orderNumber}</td>
                <td style={{ textAlign: 'right' }}><strong>Date :</strong> {formatDate(selected.createdAt)}</td>
              </tr>
              <tr>
                <td><strong>Client :</strong> {selected.clientName}</td>
                <td style={{ textAlign: 'right' }}><strong>Tél :</strong> {selected.clientPhone}</td>
              </tr>
              <tr>
                <td colSpan={2}><strong>Adresse de livraison :</strong> {selected.rawAddress || selected.city}</td>
              </tr>
              {selected.gps && (
                <tr>
                  <td colSpan={2}><strong>GPS :</strong> {selected.gps.lat}, {selected.gps.lng} (Maps: https://maps.google.com/?q={selected.gps.lat},{selected.gps.lng})</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Table Générale des Articles */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }} border="1" cellPadding="6">
            <thead>
              <tr style={{ background: '#eee' }}>
                <th>Article</th>
                <th>Taille</th>
                <th>Flocage / Détails</th>
                <th>Qté</th>
                <th>Prix Total</th>
              </tr>
            </thead>
            <tbody>
              {selected.itemsList.map((it, i) => (
                <tr key={i}>
                  <td><strong>{it.productName}</strong></td>
                  <td style={{ textAlign: 'center' }}>{it.size}</td>
                  <td>{it.customName ? `Nom: ${it.customName} | N°: ${it.customNumber || '—'} (Police: ${it.fontFamily})` : 'Standard Catalogue'}</td>
                  <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatFCFA(it.totalPrice || selected.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Section Dédiée Atelier de Flocage si customisations */}
          {selected.hasCustomization && (
            <div style={{ marginTop: '20px', borderTop: '2px solid #000', paddingTop: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>
                🏭 FICHE DE PRODUCTION ATELIER — FLOCAGES TEXTILE
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }} border="1" cellPadding="6">
                <thead>
                  <tr style={{ background: '#eee' }}>
                    <th>Article</th>
                    <th>Taille</th>
                    <th>Nom Floqué</th>
                    <th>N° Floqué</th>
                    <th>Police</th>
                    <th>Couleur Tissu</th>
                    <th>Badges & Écussons</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.itemsList.filter(i => i.isCustom).map((it, i) => (
                    <tr key={i}>
                      <td><strong>{it.productName}</strong></td>
                      <td style={{ textAlign: 'center' }}><strong>{it.size}</strong></td>
                      <td style={{ fontSize: '13px', fontWeight: 'bold' }}>{it.customName || '—'}</td>
                      <td style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>{it.customNumber ? `#${it.customNumber}` : '—'}</td>
                      <td>{it.fontFamily}</td>
                      <td>{it.primaryColor || 'Standard'}</td>
                      <td>{it.badges && it.badges.length > 0 ? it.badges.join(', ') : 'Aucun'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ textAlign: 'right', fontSize: '14px', marginBottom: '24px' }}>
            <p style={{ margin: 0 }}><strong>Mode de règlement :</strong> {(PAYMENT_METHOD_NAMES[selected.paymentMethod] || {}).label || selected.paymentMethod}</p>
            <h3 style={{ margin: '6px 0 0' }}>TOTAL : {formatFCFA(selected.amount)}</h3>
          </div>

          <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Signature Client : ___________________</span>
            <span>Signature Opérateur Atelier : ___________________</span>
            <span>Signature Livreur : ___________________</span>
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── Données Mock Réalistes (utilisées si base vide ou hors-ligne) ─── */
const MOCK_ORDERS = [
  { 
    id: 'a1b2c3d4-0001-0000-0000-000000000001', 
    order_number: 'JL-984321-7821',
    customer_name: 'Amadou Diallo', 
    customer_phone: '77 456 78 90', 
    customer_email: 'amadou.diallo@gmail.com',
    city: 'Dakar',
    delivery_type: 'gps',
    latitude: 14.718345,
    longitude: -17.438931,
    delivery_address: 'Dakar | GPS: 14.718345, -17.438931 (±12m) | Sacré-Cœur 3 près de la boulangerie',
    total_amount: 35000, 
    status: 'PROCESSING', 
    payment_method: 'wave',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    order_items: [
      {
        product_name: 'Maillot Domicile Sénégal 2026 - Personnalisé',
        quantity: 1,
        unit_price: 35000,
        variant_info: 'Taille: L',
        custom_name: 'MANÉ',
        custom_number: '10',
        preview_front: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&auto=format&fit=crop',
        preview_back: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop',
        customizations: {
          custom_name: 'MANÉ',
          custom_number: '10',
          font_family: 'Premier League Bold',
          primary_color: '#00853F',
          secondary_color: '#FDEF42',
          preview_front: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&auto=format&fit=crop',
          preview_back: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop',
          extra_config: {
            playerName: 'MANÉ',
            playerNumber: '10',
            fontFamily: 'Premier League Bold',
            bodyColor: '#00853F',
            stripesColor: '#FDEF42',
            collarColor: '#E31B23',
            badges: ['⭐ Écusson Sénégal FSF', 'Badge Coupe d\'Afrique CAN 2025']
          }
        }
      }
    ]
  },
  { 
    id: 'a1b2c3d4-0002-0000-0000-000000000002', 
    order_number: 'JL-984321-7822',
    customer_name: 'Fatou Sarr', 
    customer_phone: '78 123 45 67', 
    customer_email: 'fatou.sarr@outlook.com',
    city: 'Thiès',
    delivery_type: 'phone_call',
    delivery_address: 'Thiès | Position à préciser par appel téléphonique (+221 78 123 45 67)',
    total_amount: 50000, 
    status: 'PAID', 
    payment_method: 'orange_money',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    order_items: [
      {
        product_name: 'Maillot Extérieur Real Madrid 2026',
        quantity: 2,
        unit_price: 25000,
        variant_info: 'Taille: M',
        preview_front: 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=400&h=500&fit=crop'
      }
    ]
  },
  { 
    id: 'a1b2c3d4-0003-0000-0000-000000000003', 
    order_number: 'JL-984321-7823',
    customer_name: 'Oumar Ba', 
    customer_phone: '76 890 12 34', 
    customer_email: 'oumar.ba@gmail.com',
    city: 'Dakar',
    delivery_type: 'pickup',
    delivery_address: 'Dakar | Retrait en boutique (Boutique JogaLook - Sacré-Cœur 3 / VDN Dakar)',
    total_amount: 45000, 
    status: 'DELIVERED', 
    payment_method: 'cash_on_delivery',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    order_items: [
      {
        product_name: 'Maillot Domicile Arsenal 2026 - Flocage Personnalisé',
        quantity: 1,
        unit_price: 45000,
        variant_info: 'Taille: XL',
        custom_name: 'SAKA',
        custom_number: '7',
        preview_front: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop',
        customizations: {
          custom_name: 'SAKA',
          custom_number: '7',
          font_family: 'Sport Bold',
          primary_color: '#DC2626',
          secondary_color: '#FFFFFF',
          extra_config: {
            playerName: 'SAKA',
            playerNumber: '7',
            fontFamily: 'Sport Bold',
            bodyColor: '#DC2626',
            stripesColor: '#FFFFFF',
            badges: ['🏆 Premier League Champions 2025']
          }
        }
      }
    ]
  },
  { 
    id: 'a1b2c3d4-0004-0000-0000-000000000004', 
    order_number: 'JL-984321-7824',
    customer_name: 'Aissatou Camara', 
    customer_phone: '70 999 88 77', 
    customer_email: 'aissatou.c@yahoo.fr',
    city: 'Saint-Louis',
    delivery_type: 'manual',
    delivery_address: 'Saint-Louis | Sor, près du Lycée Cheikh Omar Foutiyou Tall, Villa 45',
    total_amount: 75000, 
    status: 'SHIPPED', 
    payment_method: 'wave',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    order_items: [
      {
        product_name: 'Pack 3 Maillots Édition Collector',
        quantity: 1,
        unit_price: 75000,
        variant_info: 'Taille: S',
        preview_front: 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=400&h=500&fit=crop'
      }
    ]
  },
  { 
    id: 'a1b2c3d4-0005-0000-0000-000000000005', 
    order_number: 'JL-984321-7825',
    customer_name: 'Moussa Ndiaye', 
    customer_phone: '77 333 22 11', 
    customer_email: 'moussa.ndiaye@gmail.com',
    city: 'Kaolack',
    delivery_type: 'manual',
    delivery_address: 'Kaolack | Quartier Léona, après le marché',
    total_amount: 25000, 
    status: 'PENDING', 
    payment_method: 'free_money',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    order_items: [
      {
        product_name: 'Maillot Domicile FC Barcelone 2026',
        quantity: 1,
        unit_price: 25000,
        variant_info: 'Taille: L',
        preview_front: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&auto=format&fit=crop'
      }
    ]
  }
];

