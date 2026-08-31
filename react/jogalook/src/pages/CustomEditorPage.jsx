import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckIcon } from '../components/icons/AppIcons';
import { MOCK_TEMPLATES } from '../utils/templatePresets';
import './CustomEditorPage.css';

const baseColors = [
  { name: 'Rouge Flash', hex: '#e63946' },
  { name: 'Bleu Marine', hex: '#1d3557' },
  { name: 'Noir Carbone', hex: '#111111' },
  { name: 'Blanc Pur', hex: '#ffffff' },
  { name: 'Vert Émeraude', hex: '#2a9d8f' },
  { name: 'Orange Solaire', hex: '#f4a261' },
  { name: 'Jaune Or', hex: '#e9c46a' },
  { name: 'Violet Royal', hex: '#7b2d8e' },
  { name: 'Bleu Ciel', hex: '#457b9d' },
  { name: 'Gris Sidéral', hex: '#6c757d' },
  { name: 'Or Ambré', hex: '#ffd700' },
  { name: 'Bleu Pétrole', hex: '#264653' },
];

const patterns = [
  { name: 'Uni', value: 'solid', icon: '■' },
  { name: 'Rayures', value: 'stripes', icon: '⫿' },
  { name: 'Dégradé', value: 'gradient', icon: '▨' },
  { name: 'Moitié', value: 'half', icon: '◧' },
  { name: 'Diagonale', value: 'slash', icon: '⧄' },
  { name: 'Damier', value: 'checker', icon: '▦' },
];

const collarStyles = [
  { name: 'Rond', value: 'round' },
  { name: 'En V', value: 'vneck' },
  { name: 'Col Polo', value: 'polo' },
];

const fontFamilies = [
  { name: 'Impact / Sport', value: "'Impact', 'Arial Black', sans-serif" },
  { name: 'Montserrat / Moderne', value: "'Montserrat', sans-serif" },
  { name: 'Classique / Serif', value: "'Georgia', serif" },
  { name: 'Tech / Mono', value: "'Courier New', monospace" },
  { name: 'Clean / Sans', value: "'Verdana', sans-serif" },
];

export default function CustomEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const fileInputRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Tool Tab in the Figma Bottom Dock: 'colors' | 'flockage' | 'badge' | 'size' | null
  const [activeTab, setActiveTab] = useState('colors');
  const [activeColorSubTab, setActiveColorSubTab] = useState('body'); // 'pattern' | 'body' | 'body2' | 'collar' | 'sleeves' | 'stripes'

  // View state: 'front' | 'back'
  const [view, setView] = useState('front');
  const [isRotating, setIsRotating] = useState(false);

  // ── VARIABLES DISTINCTES PAR ÉLÉMENT DU MAILLOT ──
  const [bodyColor, setBodyColor] = useState('#e63946');
  const [bodyColor2, setBodyColor2] = useState('#1d3557');
  const [collarColor, setCollarColor] = useState('#ffffff');
  const [sleevesColor, setSleevesColor] = useState('#ffffff');
  const [stripesColor, setStripesColor] = useState('#1d3557');
  const [pattern, setPattern] = useState('solid');
  const [collar, setCollar] = useState('round');

  // Flockage States
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState("'Impact', 'Arial Black', sans-serif");

  // Club Badge / Logo States
  const [clubBadgeUrl, setClubBadgeUrl] = useState(null);
  const [badgePosition, setBadgePosition] = useState('left'); // 'left' | 'center' | 'right'
  const [badgeSize, setBadgeSize] = useState('medium'); // 'small' | 'medium' | 'large'

  // Order Details
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  // Contextual Tap-to-Edit Popup: { visible, x, y, label, targetKey }
  // targetKey: 'body' | 'body2' | 'collar' | 'sleeves' | 'stripes' | 'flockage' | 'badge'
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    label: '',
    targetKey: null
  });

  // Charger le template correspondant
  useEffect(() => {
    async function loadTemplate() {
      setLoading(true);
      let foundTemplate = null;

      // 1. Chercher dans les templates mock prédéfinis
      const mockFound = MOCK_TEMPLATES.find((t) => String(t.id) === String(id));
      if (mockFound) {
        foundTemplate = mockFound;
      } else {
        // 2. Tenter de charger depuis l'API backend si c'est un UUID
        try {
          const res = await fetch(`/api/templates/${id}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              foundTemplate = json.data;
            }
          }
        } catch (err) {
          console.warn('Template API fetch error:', err);
        }
      }

      // 3. Fallback sur le premier template
      const activeTpl = foundTemplate || MOCK_TEMPLATES[0];
      setTemplate(activeTpl);

      // Initialiser chaque variable indépendamment selon le template
      setBodyColor(activeTpl.baseColor || '#e63946');
      setBodyColor2(activeTpl.accentColor || '#1d3557');
      setCollarColor(activeTpl.collarColor || (activeTpl.collar === 'polo' ? '#111111' : '#ffffff'));
      setSleevesColor(activeTpl.sleevesColor || activeTpl.accentColor || '#ffffff');
      setStripesColor(activeTpl.stripesColor || activeTpl.accentColor || '#1d3557');
      setPattern(activeTpl.pattern || 'solid');
      setCollar(activeTpl.collar || 'round');
      setPlayerName(activeTpl.defaultName || '');
      setPlayerNumber(activeTpl.defaultNumber || '');
      if (activeTpl.badge_url) setClubBadgeUrl(activeTpl.badge_url);

      setLoading(false);
    }

    loadTemplate();
  }, [id]);

  // Permissions d'édition issues du template
  const editable = template?.editable_elements || {
    body: true,
    collar: true,
    sleeves: true,
    stripes: true,
    badge: true,
    name_zone: true,
    number_zone: true
  };

  const layers = template?.layers_config || {
    body_id: 'jersey-body',
    collar_id: 'jersey-collar',
    sleeves_id: 'jersey-sleeves',
    stripes_id: 'jersey-stripes',
    badge_zone_id: 'badge-zone',
    name_zone_id: 'name-zone',
    number_zone_id: 'number-zone'
  };

  const showColorsTab = editable.body !== false || editable.collar !== false || editable.sleeves !== false || editable.stripes !== false;
  const showFlockageTab = editable.name_zone !== false || editable.number_zone !== false;
  const showBadgeTab = editable.badge !== false;

  // ── MAPPING TAP-TO-EDIT SUR TOUS LES IDS DE LA FACE ET DU DOS ──
  const LAYER_TOUCH_CONFIG = {
    // Face avant
    [layers.body_id || 'jersey-body']:       { label: '👕 Corps Principal', targetKey: 'body' },
    [layers.collar_id || 'jersey-collar']:   { label: '👔 Col du Maillot', targetKey: 'collar' },
    [layers.sleeves_id || 'jersey-sleeves']: { label: '💪 Manches & Finitions', targetKey: 'sleeves' },
    [layers.stripes_id || 'jersey-stripes']: { label: '🎨 Motifs & Bandes', targetKey: 'stripes' },
    [layers.badge_zone_id || 'badge-zone']:   { label: '🛡️ Blason du Club', targetKey: 'badge' },
    
    // Dos
    [`${layers.body_id || 'jersey-body'}-back`]:       { label: '👕 Corps Principal', targetKey: 'body' },
    [`${layers.collar_id || 'jersey-collar'}-back`]:   { label: '👔 Col du Maillot', targetKey: 'collar' },
    [`${layers.sleeves_id || 'jersey-sleeves'}-back`]: { label: '💪 Manches & Finitions', targetKey: 'sleeves' },
    [`${layers.stripes_id || 'jersey-stripes'}-back`]: { label: '🎨 Motifs & Bandes', targetKey: 'stripes' },
    [layers.name_zone_id || 'name-zone']:     { label: '✍️ Nom du Joueur', targetKey: 'flockage' },
    [layers.number_zone_id || 'number-zone']: { label: '🔢 Numéro du Joueur', targetKey: 'flockage' },
  };

  // Détection du calque touché
  const resolveTouchedLayer = (el, root) => {
    let node = el;
    for (let i = 0; i < 8 && node && node !== root; i++) {
      const elId = node.id || node.getAttribute?.('id') || '';
      if (elId && LAYER_TOUCH_CONFIG[elId]) return { id: elId, config: LAYER_TOUCH_CONFIG[elId] };
      node = node.parentElement;
    }
    return null;
  };

  const handleSvgTap = (e) => {
    const resolved = resolveTouchedLayer(e.target, e.currentTarget);
    if (!resolved) {
      setContextMenu({ visible: false });
      return;
    }

    e.stopPropagation();
    const { config } = resolved;

    if (config.targetKey === 'flockage') {
      setActiveTab('flockage');
      setView('back');
      setContextMenu({ visible: false });
      return;
    }

    if (config.targetKey === 'badge') {
      setActiveTab('badge');
      setView('front');
      setContextMenu({ visible: false });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.changedTouches?.[0]?.clientX ?? e.clientX;
    const clientY = e.changedTouches?.[0]?.clientY ?? e.clientY;

    setContextMenu({
      visible: true,
      x: clientX - rect.left,
      y: clientY - rect.top,
      label: config.label,
      targetKey: config.targetKey,
    });
    setActiveTab(null);
  };

  const closeContextMenu = () => setContextMenu({ visible: false });

  // Appliquer une couleur à un élément spécifique
  const applyTargetColor = (targetKey, color) => {
    if (targetKey === 'body') setBodyColor(color);
    if (targetKey === 'body2') setBodyColor2(color);
    if (targetKey === 'collar') setCollarColor(color);
    if (targetKey === 'sleeves') setSleevesColor(color);
    if (targetKey === 'stripes') setStripesColor(color);
    closeContextMenu();
  };

  // Harmoniser tous les détails (Col + Manches + Motifs) en un clic
  const handleHarmonizeAccents = (color) => {
    setCollarColor(color);
    setSleevesColor(color);
    setStripesColor(color);
  };

  // Handle Logo Upload
  const handleBadgeUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setClubBadgeUrl(event.target.result);
        setView('front');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => {
      setView((prev) => (prev === 'front' ? 'back' : 'front'));
      setIsRotating(false);
    }, 280);
  };

  // Badge coordinates
  const getBadgeCoordinates = () => {
    const sizeMap = { small: 26, medium: 36, large: 48 };
    const width = sizeMap[badgeSize] || 36;
    const height = width;

    let x = 108 - width / 2;
    const y = 94 - height / 2;

    if (badgePosition === 'left') {
      x = 108 - width / 2;
    } else if (badgePosition === 'center') {
      x = 150 - width / 2;
    } else if (badgePosition === 'right') {
      x = 192 - width / 2;
    }

    return { x, y, width, height };
  };

  const badgeCoords = getBadgeCoordinates();

  // Price Calculation
  const basePrice = template?.price ? parseFloat(template.price) : 49.99;
  const flockingPrice = (playerName ? 9.99 : 0) + (playerNumber ? 4.99 : 0);
  const badgePrice = clubBadgeUrl ? 4.99 : 0;
  const unitPrice = basePrice + flockingPrice + badgePrice;
  const totalPrice = (unitPrice * quantity).toFixed(2);

  // ── MOTEUR MODULAIRE DE GÉNÉRATION VECTORIELLE (FACE & DOS) ──
  const buildSvgString = (side) => {
    const isFront = side === 'front';

    // Gradients et Patterns dynamiques
    const defs = `
      <defs>
        <filter id="jersey-dyn-shadow-${side}" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.18)" />
        </filter>
        <linearGradient id="dyn-gradient-${side}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bodyColor}" />
          <stop offset="100%" stop-color="${bodyColor2}" />
        </linearGradient>
        <pattern id="dyn-checker-${side}" width="36" height="36" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill="${bodyColor}" />
          <rect x="18" width="18" height="18" fill="${stripesColor}" />
          <rect y="18" width="18" height="18" fill="${stripesColor}" />
          <rect x="18" y="18" width="18" height="18" fill="${bodyColor}" />
        </pattern>
      </defs>
    `;

    // 1. Rendu du Corps selon le motif choisi (Uni, Dégradé, Rayures, Moitié, Slash, Damier)
    let bodyMarkup = '';
    const bodyPathD = "M60 40 L100 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L70 340 L70 110 L60 140 L20 120 Z";
    const bodyId = isFront ? 'jersey-body' : 'jersey-body-back';

    if (pattern === 'gradient') {
      bodyMarkup = `<path id="${bodyId}" d="${bodyPathD}" fill="url(#dyn-gradient-${side})" stroke="#0f172a" stroke-width="2.5" filter="url(#jersey-dyn-shadow-${side})"/>`;
    } else if (pattern === 'checker') {
      bodyMarkup = `<path id="${bodyId}" d="${bodyPathD}" fill="url(#dyn-checker-${side})" stroke="#0f172a" stroke-width="2.5" filter="url(#jersey-dyn-shadow-${side})"/>`;
    } else if (pattern === 'half') {
      bodyMarkup = `
        <g id="${bodyId}" filter="url(#jersey-dyn-shadow-${side})">
          <path d="M60 40 L100 20 L150 20 L150 340 L70 340 L70 110 L60 140 L20 120 Z" fill="${bodyColor}" stroke="#0f172a" stroke-width="2.5"/>
          <path d="M150 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L150 340 Z" fill="${bodyColor2}" stroke="#0f172a" stroke-width="2.5"/>
        </g>
      `;
    } else {
      // Solid / Rayures / Slash base
      bodyMarkup = `<path id="${bodyId}" d="${bodyPathD}" fill="${bodyColor}" stroke="#0f172a" stroke-width="2.5" filter="url(#jersey-dyn-shadow-${side})"/>`;
    }

    // 2. Rendu des Motifs / Rayures / Bandes
    let stripesMarkup = '';
    const stripesId = isFront ? 'jersey-stripes' : 'jersey-stripes-back';

    if (pattern === 'stripes') {
      stripesMarkup = `
        <g id="${stripesId}">
          <rect x="95" y="20" width="22" height="320" fill="${stripesColor}"/>
          <rect x="139" y="20" width="22" height="320" fill="${stripesColor}"/>
          <rect x="183" y="20" width="22" height="320" fill="${stripesColor}"/>
        </g>
      `;
    } else if (pattern === 'slash') {
      stripesMarkup = `
        <g id="${stripesId}">
          <polygon points="70,100 230,220 230,260 70,140" fill="${stripesColor}"/>
        </g>
      `;
    }

    // 3. Rendu du Col (Forme & Couleur indépendante)
    let collarMarkup = '';
    const collarId = isFront ? 'jersey-collar' : 'jersey-collar-back';

    if (collar === 'vneck') {
      collarMarkup = isFront
        ? `<path id="${collarId}" d="M120 20 L150 60 L180 20" fill="none" stroke="${collarColor}" stroke-width="8"/>`
        : `<path id="${collarId}" d="M120 20 L150 45 L180 20" fill="none" stroke="${collarColor}" stroke-width="8"/>`;
    } else if (collar === 'polo') {
      collarMarkup = isFront
        ? `<path id="${collarId}" d="M110 20 L150 70 L190 20 L170 20 L150 50 L130 20 Z" fill="${collarColor}"/>`
        : `<path id="${collarId}" d="M110 20 L150 45 L190 20 Z" fill="${collarColor}"/>`;
    } else {
      // Round collar
      collarMarkup = isFront
        ? `<path id="${collarId}" d="M120 20 Q150 50 180 20" fill="none" stroke="${collarColor}" stroke-width="8"/>`
        : `<path id="${collarId}" d="M120 20 Q150 35 180 20" fill="none" stroke="${collarColor}" stroke-width="8"/>`;
    }

    // 4. Rendu des Manches et Bordures
    const sleevesId = isFront ? 'jersey-sleeves' : 'jersey-sleeves-back';
    const sleevesMarkup = `
      <g id="${sleevesId}">
        <path d="M20 120 L60 140" stroke="${sleevesColor}" stroke-width="6"/>
        <path d="M280 120 L240 140" stroke="${sleevesColor}" stroke-width="6"/>
      </g>
      <line x1="70" y1="337" x2="230" y2="337" stroke="${sleevesColor}" stroke-width="6"/>
    `;

    // 5. Blason / Logo (Face avant)
    let badgeMarkup = '';
    if (isFront) {
      if (clubBadgeUrl) {
        badgeMarkup = `
          <g id="badge-zone">
            <image href="${clubBadgeUrl}" x="${badgeCoords.x}" y="${badgeCoords.y}" width="${badgeCoords.width}" height="${badgeCoords.height}" preserveAspectRatio="xMidYMid meet"/>
          </g>
        `;
      } else {
        badgeMarkup = `
          <g id="badge-zone">
            <circle cx="108" cy="94" r="14" fill="${stripesColor || '#ffd700'}"/>
          </g>
        `;
      }
    }

    // 6. Sponsor Central (Face avant)
    const sponsorMarkup = isFront
      ? `<text x="150" y="190" text-anchor="middle" fill="${textColor}" font-family="Impact, Arial Black, sans-serif" font-size="22" font-weight="bold" letter-spacing="3">JOGALOOK</text>`
      : '';

    // 7. Flockage Nom & Numéro (Dos)
    let flockageMarkup = '';
    if (!isFront) {
      const nameText = playerName || 'JOUEUR';
      const numberText = playerNumber || '10';
      const nameOpacity = playerName ? '1' : '0.4';
      const numberOpacity = playerNumber ? '1' : '0.4';

      flockageMarkup = `
        <g id="name-zone">
          <text x="150" y="110" text-anchor="middle" fill="${textColor}" opacity="${nameOpacity}" font-family="${fontFamily}" font-size="22" font-weight="bold" letter-spacing="4">${nameText}</text>
        </g>
        <g id="number-zone">
          <text x="150" y="230" text-anchor="middle" fill="${textColor}" opacity="${numberOpacity}" font-family="${fontFamily}" font-size="90" font-weight="900">${numberText}</text>
        </g>
      `;
    }

    return `
      <svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        ${defs}
        ${bodyMarkup}
        ${stripesMarkup}
        ${sleevesMarkup}
        ${collarMarkup}
        ${badgeMarkup}
        ${sponsorMarkup}
        ${flockageMarkup}
      </svg>
    `;
  };

  const renderedSvgString = useMemo(() => buildSvgString(view), [
    view,
    bodyColor,
    bodyColor2,
    collarColor,
    sleevesColor,
    stripesColor,
    pattern,
    collar,
    textColor,
    fontFamily,
    playerName,
    playerNumber,
    clubBadgeUrl,
    badgeCoords
  ]);

  // ── AJOUT AU PANIER AVEC SAUVEGARDE DE LA PERSONNALISATION ──
  const handleAddToCart = async () => {
    const frontSvg = buildSvgString('front');
    const backSvg = buildSvgString('back');
    const previewDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(frontSvg)}`;

    const extraConfig = {
      bodyColor,
      bodyColor2,
      collarColor,
      sleevesColor,
      stripesColor,
      pattern,
      collar,
      playerName,
      playerNumber,
      textColor,
      fontFamily,
      badgeAttached: !!clubBadgeUrl,
      clubBadgeUrl,
      badgePosition,
      badgeSize,
      size,
      quantity,
      unitPrice,
      totalPrice
    };

    let customizationId = null;

    // 1. Sauvegarde en Base de données (API /api/customizations)
    try {
      const token = localStorage.getItem('jogalook-token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/customizations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          template_id: template?.id || id,
          title: `${template?.name || 'Maillot Custom'} - ${playerName || 'Personnalisé'} ${playerNumber ? '#' + playerNumber : ''}`.trim(),
          svg_content: frontSvg,
          svg_front: frontSvg,
          svg_back: backSvg,
          preview_image_url: previewDataUri,
          custom_name: playerName || null,
          custom_number: playerNumber || null,
          font_family: fontFamily,
          primary_color: bodyColor,
          secondary_color: bodyColor2 || stripesColor,
          price: unitPrice,
          size,
          quantity,
          extra_config: extraConfig
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.id) {
          customizationId = json.data.id;
        }
      }
    } catch (err) {
      console.warn('Sauvegarde distante de la personnalisation (fallback local) :', err);
    }

    // 2. Ajout au panier avec image vectorielle et tous les détails
    addToCart({
      id: customizationId ? `custom-${customizationId}` : `custom-${template?.id || id}-${Date.now()}`,
      customization_id: customizationId,
      name: `${template?.name || 'Maillot Custom'} - ${playerName || 'Personnalisé'}`,
      price: unitPrice,
      quantity,
      selectedSize: size,
      selectedColor: bodyColor,
      category: 'Maillot Personnalisé',
      image: previewDataUri,
      svg_front: frontSvg,
      svg_back: backSvg,
      extra_details: extraConfig
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  if (loading) {
    return (
      <div className="figma-editor-loading">
        <div className="editor-spinner"></div>
        <p>Chargement du modèle vectoriel...</p>
      </div>
    );
  }

  return (
    <div className={`figma-editor-page ${activeTab ? 'has-active-tab' : ''}`}>
      {/* ── 1. TOP HEADER ── */}
      <header className="figma-top-bar">
        <div className="top-bar-left">
          <button className="top-bar-back-btn" onClick={() => navigate('/custom')} title="Retour aux templates">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="top-bar-back-text">Templates</span>
          </button>

          <div className="top-bar-divider"></div>

          <div className="top-bar-title-group">
            <span className="template-name-tag">{template?.name || 'Maillot Custom'}</span>
            <span className="template-status-pill">{template?.is_free ? 'Template Inclus' : `${template?.price} €`}</span>
          </div>
        </div>

        {/* View Switcher (Face / Dos / Rotation) */}
        <div className="top-bar-center">
          <div className="view-toggle-pill">
            <button
              className={`view-pill-btn ${view === 'front' ? 'active' : ''}`}
              onClick={() => setView('front')}
            >
              Face
            </button>
            <button
              className={`view-pill-btn ${view === 'back' ? 'active' : ''}`}
              onClick={() => setView('back')}
            >
              Dos
            </button>
          </div>

          <button className="rotate-flip-btn" onClick={handleRotate} title="Tourner le maillot (Face / Dos)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
        </div>

        {/* Price & Action */}
        <div className="top-bar-right">
          <div className="live-price-box">
            <span className="live-price-label">Total</span>
            <span className="live-price-amount">{totalPrice} €</span>
          </div>

          <button className="btn-add-cart-primary" onClick={handleAddToCart} title="Ajouter au panier">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className="btn-add-cart-text">Ajouter au panier</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {addedToast && (
        <div className="cart-toast-notification">
          <CheckIcon size={18} color="#fff" />
          <span>Maillot personnalisé ajouté au panier !</span>
          <Link to="/panier" className="toast-link">Voir le panier →</Link>
        </div>
      )}

      {/* ── 2. CANVAS CENTRAL DU MAILLOT DYNAMIQUE ── */}
      <main className="figma-canvas-area" onClick={() => { if (activeTab) setActiveTab(null); closeContextMenu(); }}>
        <div
          className={`jersey-canvas-container ${isRotating ? 'is-flipping' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="canvas-grid-bg"></div>

          {/* Rendu Vectoriel Dynamique */}
          <div
            className="canvas-jersey-svg"
            onClick={handleSvgTap}
            onTouchEnd={handleSvgTap}
            dangerouslySetInnerHTML={{ __html: renderedSvgString }}
          />
        </div>
      </main>

      {/* ── MENU CONTEXTUEL TAP-TO-EDIT (au clic direct sur une pièce) ── */}
      {contextMenu.visible && (
        <div
          className="layer-context-menu"
          style={{
            '--ctx-x': `${Math.min(contextMenu.x, window.innerWidth - 240)}px`,
            '--ctx-y': `${Math.max(contextMenu.y - 10, 60)}px`,
          }}
        >
          <div className="ctx-menu-header">
            <span className="ctx-menu-label">{contextMenu.label}</span>
            <button className="ctx-menu-close" onClick={closeContextMenu}>✕</button>
          </div>

          {/* Options de changement de motif si on touche le corps ou les rayures */}
          {(contextMenu.targetKey === 'body' || contextMenu.targetKey === 'stripes') && (
            <div className="ctx-menu-section">
              <span className="ctx-section-title">Motif du maillot</span>
              <div className="ctx-patterns-row">
                {patterns.map((p) => (
                  <button
                    key={p.value}
                    className={`ctx-pattern-btn ${pattern === p.value ? 'active' : ''}`}
                    onClick={() => setPattern(p.value)}
                    title={p.name}
                  >
                    <span>{p.icon}</span>
                    <small>{p.name}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options de style de col si on touche le col */}
          {contextMenu.targetKey === 'collar' && (
            <div className="ctx-menu-section">
              <span className="ctx-section-title">Forme du col</span>
              <div className="ctx-collar-row">
                {collarStyles.map((c) => (
                  <button
                    key={c.value}
                    className={`chip-btn ${collar === c.value ? 'active' : ''}`}
                    onClick={() => setCollar(c.value)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nuancier rapide pour l'élément touché */}
          <div className="ctx-menu-section">
            <span className="ctx-section-title">Couleur</span>
            <div className="ctx-menu-swatches">
              {baseColors.map((c) => {
                const currentVal =
                  contextMenu.targetKey === 'body' ? bodyColor :
                  contextMenu.targetKey === 'body2' ? bodyColor2 :
                  contextMenu.targetKey === 'collar' ? collarColor :
                  contextMenu.targetKey === 'sleeves' ? sleevesColor :
                  stripesColor;

                return (
                  <button
                    key={c.hex}
                    className={`ctx-swatch ${currentVal === c.hex ? 'ctx-swatch--active' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => applyTargetColor(contextMenu.targetKey, c.hex)}
                    title={c.name}
                  />
                );
              })}
            </div>

            <div className="ctx-menu-custom-color">
              <label>
                <span>Nuance personnalisée</span>
                <input
                  type="color"
                  value={
                    contextMenu.targetKey === 'body' ? bodyColor :
                    contextMenu.targetKey === 'body2' ? bodyColor2 :
                    contextMenu.targetKey === 'collar' ? collarColor :
                    contextMenu.targetKey === 'sleeves' ? sleevesColor :
                    stripesColor
                  }
                  onChange={(e) => applyTargetColor(contextMenu.targetKey, e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour fermer le menu contextuel */}
      {contextMenu.visible && (
        <div className="ctx-menu-overlay" onClick={closeContextMenu} />
      )}

      {/* ── 3. FLOATING POPOVER / BOTTOM SHEET ── */}
      {activeTab && (
        <div className="figma-popover-container">
          <div className="figma-popover-card">
            <div className="sheet-drag-handle" onClick={() => setActiveTab(null)} title="Fermer ou réduire" />
            
            <div className="popover-header">
              <h4>
                {activeTab === 'colors' && '🎨 Couleurs & Styles des Pièces'}
                {activeTab === 'flockage' && '✍️ Flockage (Nom & Numéro)'}
                {activeTab === 'badge' && '🛡️ Blason & Logo du Club'}
                {activeTab === 'size' && '📏 Taille & Commande'}
              </h4>
              <button className="popover-close-btn" onClick={() => setActiveTab(null)}>✕</button>
            </div>

            <div className="popover-body">
              {/* TAB 1: COULEURS ET PIÈCES INDÉPENDANTES */}
              {activeTab === 'colors' && showColorsTab && (
                <div className="tool-section-grid">
                  {/* Sélecteur rapide de composant à éditer */}
                  <div className="color-parts-nav">
                    <button
                      className={`part-nav-btn ${activeColorSubTab === 'pattern' ? 'active' : ''}`}
                      onClick={() => setActiveColorSubTab('pattern')}
                    >
                      Motif ({patterns.find(p => p.value === pattern)?.name})
                    </button>
                    <button
                      className={`part-nav-btn ${activeColorSubTab === 'body' ? 'active' : ''}`}
                      onClick={() => setActiveColorSubTab('body')}
                    >
                      👕 Corps
                    </button>
                    {(pattern === 'gradient' || pattern === 'half') && (
                      <button
                        className={`part-nav-btn ${activeColorSubTab === 'body2' ? 'active' : ''}`}
                        onClick={() => setActiveColorSubTab('body2')}
                      >
                        👕 2ème Couleur
                      </button>
                    )}
                    <button
                      className={`part-nav-btn ${activeColorSubTab === 'collar' ? 'active' : ''}`}
                      onClick={() => setActiveColorSubTab('collar')}
                    >
                      👔 Col
                    </button>
                    <button
                      className={`part-nav-btn ${activeColorSubTab === 'sleeves' ? 'active' : ''}`}
                      onClick={() => setActiveColorSubTab('sleeves')}
                    >
                      💪 Manches
                    </button>
                    {(pattern === 'stripes' || pattern === 'slash' || pattern === 'checker') && (
                      <button
                        className={`part-nav-btn ${activeColorSubTab === 'stripes' ? 'active' : ''}`}
                        onClick={() => setActiveColorSubTab('stripes')}
                      >
                        🎨 Motifs
                      </button>
                    )}
                  </div>

                  {/* 1.1 Motif du maillot */}
                  {activeColorSubTab === 'pattern' && (
                    <div className="tool-group">
                      <label className="tool-label">Sélectionnez le motif vectoriel</label>
                      <div className="patterns-cards-grid">
                        {patterns.map((p) => (
                          <button
                            key={p.value}
                            className={`pattern-card-btn ${pattern === p.value ? 'active' : ''}`}
                            onClick={() => setPattern(p.value)}
                          >
                            <span className="pattern-card-icon">{p.icon}</span>
                            <span className="pattern-card-label">{p.name}</span>
                          </button>
                        ))}
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <label className="tool-label">Style de col</label>
                        <div className="chip-row">
                          {collarStyles.map((c) => (
                            <button
                              key={c.value}
                              className={`chip-btn ${collar === c.value ? 'active' : ''}`}
                              onClick={() => setCollar(c.value)}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1.2 Couleur Principale Corps */}
                  {activeColorSubTab === 'body' && (
                    <div className="tool-group">
                      <label className="tool-label">Couleur Principale du Maillot</label>
                      <div className="color-swatch-row">
                        {baseColors.map((c) => (
                          <button
                            key={c.hex}
                            className={`swatch-btn ${bodyColor === c.hex ? 'selected' : ''}`}
                            style={{ backgroundColor: c.hex }}
                            onClick={() => setBodyColor(c.hex)}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1.3 Couleur Secondaire Corps (Dégradé / Moitié) */}
                  {activeColorSubTab === 'body2' && (
                    <div className="tool-group">
                      <label className="tool-label">Deuxième Couleur (Dégradé / Moitié)</label>
                      <div className="color-swatch-row">
                        {baseColors.map((c) => (
                          <button
                            key={c.hex}
                            className={`swatch-btn ${bodyColor2 === c.hex ? 'selected' : ''}`}
                            style={{ backgroundColor: c.hex }}
                            onClick={() => setBodyColor2(c.hex)}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1.4 Couleur du Col (Indépendante) */}
                  {activeColorSubTab === 'collar' && (
                    <div className="tool-group">
                      <label className="tool-label">Couleur Spécifique du Col</label>
                      <div className="color-swatch-row">
                        {baseColors.map((c) => (
                          <button
                            key={c.hex}
                            className={`swatch-btn ${collarColor === c.hex ? 'selected' : ''}`}
                            style={{ backgroundColor: c.hex }}
                            onClick={() => setCollarColor(c.hex)}
                            title={c.name}
                          />
                        ))}
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <label className="tool-label">Forme du col</label>
                        <div className="chip-row">
                          {collarStyles.map((c) => (
                            <button
                              key={c.value}
                              className={`chip-btn ${collar === c.value ? 'active' : ''}`}
                              onClick={() => setCollar(c.value)}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1.5 Couleur des Manches (Indépendante) */}
                  {activeColorSubTab === 'sleeves' && (
                    <div className="tool-group">
                      <label className="tool-label">Couleur Spécifique des Manches & Bordures</label>
                      <div className="color-swatch-row">
                        {baseColors.map((c) => (
                          <button
                            key={c.hex}
                            className={`swatch-btn ${sleevesColor === c.hex ? 'selected' : ''}`}
                            style={{ backgroundColor: c.hex }}
                            onClick={() => setSleevesColor(c.hex)}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1.6 Couleur des Motifs / Rayures (Indépendante) */}
                  {activeColorSubTab === 'stripes' && (
                    <div className="tool-group">
                      <label className="tool-label">Couleur des Bandes & Motifs</label>
                      <div className="color-swatch-row">
                        {baseColors.map((c) => (
                          <button
                            key={c.hex}
                            className={`swatch-btn ${stripesColor === c.hex ? 'selected' : ''}`}
                            style={{ backgroundColor: c.hex }}
                            onClick={() => setStripesColor(c.hex)}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bouton pour harmoniser les finitions en un clic si souhaité */}
                  <div className="harmonize-box">
                    <span className="harmonize-label">💡 Option rapide : Harmoniser toutes les finitions (Col + Manches + Bandes)</span>
                    <div className="harmonize-swatches">
                      {['#ffffff', '#111111', '#ffd700', '#e63946', '#1d3557', '#2a9d8f'].map((hex) => (
                        <button
                          key={hex}
                          className="harmonize-swatch-btn"
                          style={{ backgroundColor: hex }}
                          onClick={() => handleHarmonizeAccents(hex)}
                          title={`Tout passer en ${hex}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FLOCKAGE */}
              {activeTab === 'flockage' && showFlockageTab && (
                <div className="tool-section-grid">
                  <div className="tool-view-hint">
                    <span>💡 Astuce : Le flockage s'affiche au dos du maillot.</span>
                    {view !== 'back' && (
                      <button className="btn-switch-view-hint" onClick={() => setView('back')}>
                        Afficher le Dos →
                      </button>
                    )}
                  </div>

                  <div className="tool-row-2col">
                    {editable.name_zone !== false && (
                      <div className="tool-group">
                        <label className="tool-label">Nom du joueur (+9.99€)</label>
                        <input
                          type="text"
                          className="tool-input-text"
                          placeholder="EX: MBAPPÉ"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                          maxLength={15}
                        />
                      </div>
                    )}

                    {editable.number_zone !== false && (
                      <div className="tool-group">
                        <label className="tool-label">Numéro (+4.99€)</label>
                        <input
                          type="text"
                          className="tool-input-text input-number-center"
                          placeholder="10"
                          value={playerNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length <= 2) setPlayerNumber(val);
                          }}
                          maxLength={2}
                        />
                      </div>
                    )}
                  </div>

                  <div className="tool-group">
                    <label className="tool-label">Police de caractère</label>
                    <select
                      className="tool-select"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                    >
                      {fontFamilies.map((f) => (
                        <option key={f.value} value={f.value}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="tool-group">
                    <label className="tool-label">Couleur du flockage</label>
                    <div className="color-swatch-row">
                      {['#ffffff', '#111111', '#ffd700', '#e63946', '#1d3557', '#2a9d8f'].map((hex) => (
                        <button
                          key={hex}
                          className={`swatch-btn ${textColor === hex ? 'selected' : ''}`}
                          style={{ backgroundColor: hex }}
                          onClick={() => setTextColor(hex)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BLASON DU CLUB */}
              {activeTab === 'badge' && showBadgeTab && (
                <div className="tool-section-grid">
                  <div className="tool-view-hint">
                    <span>💡 Astuce : Le blason s'affiche sur la face avant du maillot.</span>
                    {view !== 'front' && (
                      <button className="btn-switch-view-hint" onClick={() => setView('front')}>
                        Afficher la Face →
                      </button>
                    )}
                  </div>

                  <div className="tool-group">
                    <label className="tool-label">Charger une image (PNG, SVG, JPG)</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleBadgeUpload}
                    />

                    <div className="upload-badge-dropzone" onClick={() => fileInputRef.current?.click()}>
                      {clubBadgeUrl ? (
                        <div className="uploaded-badge-preview">
                          <img src={clubBadgeUrl} alt="Blason club" />
                          <span>Changer l'image</span>
                        </div>
                      ) : (
                        <div className="upload-empty-prompt">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                          </svg>
                          <span>Cliquez pour importer votre blason</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {clubBadgeUrl && (
                    <>
                      <div className="tool-group">
                        <label className="tool-label">Position du blason</label>
                        <div className="chip-row">
                          <button
                            className={`chip-btn ${badgePosition === 'left' ? 'active' : ''}`}
                            onClick={() => setBadgePosition('left')}
                          >
                            Poitrine Gauche
                          </button>
                          <button
                            className={`chip-btn ${badgePosition === 'center' ? 'active' : ''}`}
                            onClick={() => setBadgePosition('center')}
                          >
                            Centre
                          </button>
                          <button
                            className={`chip-btn ${badgePosition === 'right' ? 'active' : ''}`}
                            onClick={() => setBadgePosition('right')}
                          >
                            Poitrine Droite
                          </button>
                        </div>
                      </div>

                      <div className="tool-group">
                        <label className="tool-label">Taille du blason</label>
                        <div className="chip-row">
                          {['small', 'medium', 'large'].map((s) => (
                            <button
                              key={s}
                              className={`chip-btn ${badgeSize === s ? 'active' : ''}`}
                              onClick={() => setBadgeSize(s)}
                            >
                              {s === 'small' ? 'Petit' : s === 'medium' ? 'Moyen' : 'Grand'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        className="btn-remove-badge"
                        onClick={() => setClubBadgeUrl(null)}
                      >
                        Supprimer le blason
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* TAB 4: TAILLE & COMMANDE */}
              {activeTab === 'size' && (
                <div className="tool-section-grid">
                  <div className="tool-group">
                    <label className="tool-label">Taille</label>
                    <div className="chip-row">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                        <button
                          key={sz}
                          className={`chip-btn ${size === sz ? 'active' : ''}`}
                          onClick={() => setSize(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="tool-group">
                    <label className="tool-label">Quantité</label>
                    <div className="quantity-pill-row">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                      <span>{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
                    </div>
                  </div>

                  <div className="mini-summary-box">
                    <div className="summary-line">
                      <span>Maillot de base</span>
                      <span>{basePrice.toFixed(2)} €</span>
                    </div>
                    {playerName && (
                      <div className="summary-line">
                        <span>Nom "{playerName}"</span>
                        <span>+9.99 €</span>
                      </div>
                    )}
                    {playerNumber && (
                      <div className="summary-line">
                        <span>Numéro "{playerNumber}"</span>
                        <span>+4.99 €</span>
                      </div>
                    )}
                    {clubBadgeUrl && (
                      <div className="summary-line">
                        <span>Blason Club personnalisé</span>
                        <span>+4.99 €</span>
                      </div>
                    )}
                    <div className="summary-line total-line">
                      <span>Total ({quantity} ex.)</span>
                      <span>{totalPrice} €</span>
                    </div>
                  </div>

                  <button className="btn-add-cart-popover" onClick={handleAddToCart}>
                    Ajouter au panier ({totalPrice} €)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. FIGMA-STYLE FLOATING BOTTOM DOCK ── */}
      <nav className="figma-bottom-dock">
        {showColorsTab && (
          <button
            className={`dock-tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'colors' ? null : 'colors')}
          >
            <span className="dock-tab-icon">🎨</span>
            <span className="dock-tab-label">Couleurs & Pièces</span>
          </button>
        )}

        {showFlockageTab && (
          <button
            className={`dock-tab-btn ${activeTab === 'flockage' ? 'active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'flockage' ? null : 'flockage')}
          >
            <span className="dock-tab-icon">✍️</span>
            <span className="dock-tab-label">Flockage</span>
          </button>
        )}

        {showBadgeTab && (
          <button
            className={`dock-tab-btn ${activeTab === 'badge' ? 'active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'badge' ? null : 'badge')}
          >
            <span className="dock-tab-icon">🛡️</span>
            <span className="dock-tab-label">Blason</span>
          </button>
        )}

        <button
          className={`dock-tab-btn ${activeTab === 'size' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'size' ? null : 'size')}
        >
          <span className="dock-tab-icon">📏</span>
          <span className="dock-tab-label">Taille ({size})</span>
        </button>
      </nav>
    </div>
  );
}
