import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CheckIcon } from '../components/icons/AppIcons';
import { MOCK_TEMPLATES } from '../utils/templatePresets';
import { normalizeSvgForDisplay, calculateDynamicPlacements, prepareTemplateForEditing } from '../utils/svgUtils';
import './CustomEditorPage.css';

const BADGE_PRESETS = [
  {
    id: 'shield',
    name: 'Écusson Club',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50 8 L85 24 V52 C85 74 50 94 50 94 C50 94 15 74 15 52 V24 Z' fill='%23f15a24' stroke='%23ffffff' stroke-width='4'/><circle cx='50' cy='46' r='18' fill='%23ffffff'/><path d='M50 34 L54 42 L63 43 L56 50 L58 58 L50 53 L42 58 L44 50 L37 43 L46 42 Z' fill='%231d3557'/></svg>"
  },
  {
    id: 'lion',
    name: 'Lion Royal',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='%231d3557' stroke='%23ffd700' stroke-width='4'/><path d='M50 20 L58 35 L75 38 L62 50 L65 67 L50 58 L35 67 L38 50 L25 38 L42 35 Z' fill='%23ffd700'/></svg>"
  },
  {
    id: 'eagle',
    name: 'Aigle Sport',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='50,10 90,40 75,90 25,90 10,40' fill='%23e63946' stroke='%23ffffff' stroke-width='4'/><text x='50' y='60' text-anchor='middle' font-family='Impact' font-size='32' fill='%23ffffff'>JL</text></svg>"
  },
  {
    id: 'star',
    name: 'Étoile Champion',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='%230f172a' stroke='%2300b4d8' stroke-width='4'/><polygon points='50,18 59,38 80,41 65,56 69,76 50,66 31,76 35,56 20,41 41,38' fill='%2300b4d8'/></svg>"
  }
];

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
  // ── Styles Foot Pro & Athletic ──
  { name: 'Bebas Neue (Football Pro / Officiel)', value: "'Bebas Neue', sans-serif" },
  { name: 'Impact (Classique Musclé)', value: "'Impact', 'Arial Black', sans-serif" },
  { name: 'Anton (Massif / Premier League)', value: "'Anton', sans-serif" },
  { name: 'Oswald (Élancé / Serie A)', value: "'Oswald', sans-serif" },
  { name: 'Barlow Condensed (Moderne Pro)', value: "'Barlow Condensed', sans-serif" },
  { name: 'Teko (Athlétique Haute Lisibilité)', value: "'Teko', sans-serif" },
  { name: 'Russo One (Puissant / Power Sport)', value: "'Russo One', sans-serif" },
  { name: 'Staatliches (Urbain / Street Football)', value: "'Staatliches', sans-serif" },
  { name: 'Archivo Black (Robuste & Plein)', value: "'Archivo Black', sans-serif" },

  // ── Styles Esport & Moderne ──
  { name: 'Montserrat (Clean / Géométrique)', value: "'Montserrat', sans-serif" },
  { name: 'Chakra Petch (Racing & Esport)', value: "'Chakra Petch', sans-serif" },
  { name: 'Orbitron (Futuriste / Gaming)', value: "'Orbitron', sans-serif" },

  // ── Styles Rétro & Signature ──
  { name: 'Playfair (Vintage / Luxe)', value: "'Playfair Display', serif" },
  { name: 'Georgia (Rétro / Héritage)', value: "'Georgia', serif" },
  { name: 'Permanent Marker (Graffiti / Street)', value: "'Permanent Marker', cursive" },
  { name: 'Courier New (Technique / Monospace)', value: "'Courier New', monospace" },
];

const flockingPalette = [
  { name: 'Blanc Pur', hex: '#ffffff' },
  { name: 'Noir Carbone', hex: '#111111' },
  { name: 'Or Métal', hex: '#ffd700' },
  { name: 'Argent / Gris', hex: '#cbd5e1' },
  { name: 'Rouge Cardinal', hex: '#e63946' },
  { name: 'Bordeaux Profond', hex: '#800020' },
  { name: 'Orange Vif', hex: '#f97316' },
  { name: 'Jaune Fluo', hex: '#ccff00' },
  { name: 'Vert Pelouse', hex: '#16a34a' },
  { name: 'Vert Fluo', hex: '#00ff66' },
  { name: 'Bleu Royal', hex: '#2563eb' },
  { name: 'Bleu Ciel', hex: '#38bdf8' },
  { name: 'Bleu Marine', hex: '#0f172a' },
  { name: 'Violet Électrique', hex: '#7c3aed' },
  { name: 'Rose Fluo', hex: '#f43f5e' },
  { name: 'Cuivre Ambré', hex: '#b45309' },
];

export default function CustomEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
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

  // Flockage Position (X, Y) & Size States (Initialisés avec flocking_config du template)
  const [nameXPercent, setNameXPercent] = useState(50);
  const [nameYPercent, setNameYPercent] = useState(26);
  const [numberXPercent, setNumberXPercent] = useState(50);
  const [numberYPercent, setNumberYPercent] = useState(52);
  const [nameFontSize, setNameFontSize] = useState(28);
  const [numberFontSize, setNumberFontSize] = useState(110);
  const [letterSpacing, setLetterSpacing] = useState(4);

  // Club Badge / Logo States
  const [clubBadgeUrl, setClubBadgeUrl] = useState(null);
  const [badgePosition, setBadgePosition] = useState('left'); // 'left' | 'center' | 'right'
  const [badgeSize, setBadgeSize] = useState('medium'); // 'small' | 'medium' | 'large'

  // Order Details
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  // Modale de confirmation si le user n'a fait aucune personnalisation
  const [showNoCustomConfirm, setShowNoCustomConfirm] = useState(false);


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

      // 1. Tenter de charger depuis l'API backend /api/templates/:id
      try {
        const res = await fetch(`/api/templates/${id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            foundTemplate = json.data;
          }
        }
      } catch (err) {
        console.warn('Template API single fetch error:', err);
      }

      // 2. Si non trouvé, tenter de charger depuis la liste complète /api/templates
      if (!foundTemplate) {
        try {
          const resList = await fetch('/api/templates');
          if (resList.ok) {
            const jsonList = await resList.json();
            if (jsonList.success && Array.isArray(jsonList.data)) {
              foundTemplate = jsonList.data.find((t) => String(t.id) === String(id));
            }
          }
        } catch (err) {
          console.warn('Template API list fetch error:', err);
        }
      }

      // 3. Chercher dans les presets uniquement si l'id correspond exactement
      if (!foundTemplate) {
        foundTemplate = MOCK_TEMPLATES.find((t) => String(t.id) === String(id)) || null;
      }

      if (!foundTemplate) {
        setTemplate(null);
        setLoading(false);
        return;
      }

      const activeTpl = foundTemplate;
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
      setClubBadgeUrl(activeTpl.badge_url || null);

      // Charger les préférences de positionnement et typographie enregistrées en BD
      const flockConf = activeTpl.flocking_config || {};
      setNameXPercent(flockConf.name?.x_percent ?? 50);
      setNameYPercent(flockConf.name?.y_percent ?? 26);
      setNumberXPercent(flockConf.number?.x_percent ?? 50);
      setNumberYPercent(flockConf.number?.y_percent ?? 52);
      setNameFontSize(flockConf.name?.font_size || 28);
      setNumberFontSize(flockConf.number?.font_size || 110);
      setLetterSpacing(flockConf.name?.letter_spacing || 4);

      if (flockConf.name?.default_color) {
        setTextColor(flockConf.name.default_color);
      }
      if (flockConf.name?.font_family) {
        setFontFamily(flockConf.name.font_family);
      }

      // Si template de type MOCKUP (Photo HD + Flockage), basculer sur l'onglet flockage
      const isMock = activeTpl.template_type === 'MOCKUP' || (!activeTpl.svg_front && !!activeTpl.image_front);
      if (isMock) {
        setActiveTab('flockage');
      }

      setLoading(false);
    }

    loadTemplate();
  }, [id]);

  // Détection du mode Mockup Photo HD
  const isMockup = template?.template_type === 'MOCKUP' || (!template?.svg_front && !!template?.image_front);

  // Permissions d'édition issues du template
  const editable = template?.editable_elements || {
    body: !isMockup,
    collar: !isMockup,
    sleeves: !isMockup,
    stripes: !isMockup,
    badge: !isMockup,
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

  const showColorsTab = !isMockup && (editable.body !== false || editable.collar !== false || editable.sleeves !== false || editable.stripes !== false);
  const showFlockageTab = editable.name_zone !== false || editable.number_zone !== false;
  const showBadgeTab = !isMockup && (editable.badge !== false);

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

  // Price Calculation : le prix du maillot personnalisé est strictement celui défini à la création du template
  const formatFCFA = (value) => `${Math.round(Number(value) || 0).toLocaleString('fr-FR')} FCFA`;
  const unitPrice = template ? (template.is_free ? 0 : (parseFloat(template.price) || 0)) : 0;
  const totalPrice = unitPrice * quantity;

  // ── MOTEUR DE RENDU FIDÈLE ET RESPONSIVE (FACE & DOS) ──
  const buildSvgString = (side) => {
    const isFront = side === 'front';

    // 0. Si le template est de type MOCKUP (Photo HD + Flockage Dynamique)
    if (isMockup) {
      const imgSrc = isFront
        ? (template?.image_front || template?.thumbnail_url || '')
        : (template?.image_back || template?.image_front || template?.thumbnail_url || '');

      const nameX = (500 * nameXPercent) / 100;
      const nameY = (500 * nameYPercent) / 100;
      const numX = (500 * numberXPercent) / 100;
      const numY = (500 * numberYPercent) / 100;
      const nameFs = nameFontSize;
      const numFs = numberFontSize;
      const letterSp = letterSpacing;

      return `<svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <image href="${imgSrc}" x="0" y="0" width="500" height="500" preserveAspectRatio="xMidYMid meet" />
        ${!isFront ? `
          <g id="mockup-flockage">
            <text x="${nameX}" y="${nameY}" text-anchor="middle" fill="${textColor}" stroke="none" font-family="${fontFamily}" font-size="${nameFs}" font-weight="bold" letter-spacing="${letterSp}">${playerName || ''}</text>
            <text x="${numX}" y="${numY}" text-anchor="middle" fill="${textColor}" stroke="none" font-family="${fontFamily}" font-size="${numFs}" font-weight="900">${playerNumber || ''}</text>
          </g>
        ` : ''}
      </svg>`;
    }

    // 1. Récupérer le code SVG vectoriel propre au template chargé
    let rawSvg = isFront
      ? (template?.svg_front || template?.svg_content || '')
      : (template?.svg_back || template?.svg_front || template?.svg_content || '');

    // Fallback si le template n'a pas encore de SVG valide
    if (!rawSvg || !rawSvg.includes('<svg')) {
      rawSvg = `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path id="${isFront ? 'jersey-body' : 'jersey-body-back'}" d="M60 40 L100 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L70 340 L70 110 L60 140 L20 120 Z" fill="${bodyColor}" stroke="#0f172a" stroke-width="2.5"/>
        <g id="${isFront ? 'jersey-collar' : 'jersey-collar-back'}"><path d="M120 20 Q150 50 180 20" fill="none" stroke="${collarColor}" stroke-width="8"/></g>
        <g id="${isFront ? 'jersey-sleeves' : 'jersey-sleeves-back'}"><path d="M20 120 L60 140" stroke="${sleevesColor}" stroke-width="6"/><path d="M280 120 L240 140" stroke="${sleevesColor}" stroke-width="6"/></g>
        ${isFront ? '<g id="badge-zone"><circle cx="108" cy="94" r="14" fill="#ffd700"/></g>' : ''}
        ${!isFront ? '<g id="name-zone"></g><g id="number-zone"></g>' : ''}
      </svg>`;
    }

    // Préparer le SVG pour l'édition :
    // - Si anonyme (sans IDs sémantiques) → interprète et injecte les IDs automatiquement
    // - Si déjà sémantique → normalise simplement (responsive 100%)
    const prepared = prepareTemplateForEditing(rawSvg, isFront ? 'front' : 'back');
    let processed = prepared.svg;

    // Calculer les coordonnées dynamiques adaptées au viewBox réel du SVG (ex: 520x542, 518x532, 300x360)
    const { viewBox: vb, badgeCoords: dynBadge, flockingCoords: dynFlock } = calculateDynamicPlacements(processed, {
      badgePosition,
      badgeSize
    });

    // 2. Remplacement des variables CSS dans le SVG du template
    processed = processed
      .replace(/var\(--jersey-base[^)]*\)/g, bodyColor)
      .replace(/var\(--jersey-accent[^)]*\)/g, stripesColor || sleevesColor || collarColor)
      .replace(/var\(--jersey-text[^)]*\)/g, textColor)
      .replace(/var\(--jersey-font[^)]*\)/g, fontFamily);

    // 3. Définition des dégradés dynamiques et patterns proportionnels
    const scaleFactor = vb.width / 300;
    const dynamicDefs = `
      <linearGradient id="dyn-gradient-${side}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bodyColor}" />
        <stop offset="100%" stop-color="${bodyColor2 || stripesColor}" />
      </linearGradient>
      <pattern id="dyn-checker-${side}" width="${Math.round(36 * scaleFactor)}" height="${Math.round(36 * scaleFactor)}" patternUnits="userSpaceOnUse">
        <rect width="${Math.round(18 * scaleFactor)}" height="${Math.round(18 * scaleFactor)}" fill="${bodyColor}" />
        <rect x="${Math.round(18 * scaleFactor)}" width="${Math.round(18 * scaleFactor)}" height="${Math.round(18 * scaleFactor)}" fill="${stripesColor}" />
        <rect y="${Math.round(18 * scaleFactor)}" width="${Math.round(18 * scaleFactor)}" height="${Math.round(18 * scaleFactor)}" fill="${stripesColor}" />
        <rect x="${Math.round(18 * scaleFactor)}" y="${Math.round(18 * scaleFactor)}" width="${Math.round(18 * scaleFactor)}" height="${Math.round(18 * scaleFactor)}" fill="${bodyColor}" />
      </pattern>
    `;

    if (processed.includes('</defs>')) {
      processed = processed.replace('</defs>', `${dynamicDefs}</defs>`);
    } else {
      processed = processed.replace(/<svg[^>]*>/i, `$&\n<defs>${dynamicDefs}</defs>`);
    }

    // 4. Injection des styles dynamiques ciblant précisément les calques du template
    const bodyId = isFront ? (layers.body_id || 'jersey-body') : `${layers.body_id || 'jersey-body'}-back`;
    const collarId = isFront ? (layers.collar_id || 'jersey-collar') : `${layers.collar_id || 'jersey-collar'}-back`;
    const sleevesId = isFront ? (layers.sleeves_id || 'jersey-sleeves') : `${layers.sleeves_id || 'jersey-sleeves'}-back`;
    const stripesId = isFront ? (layers.stripes_id || 'jersey-stripes') : `${layers.stripes_id || 'jersey-stripes'}-back`;
    const badgeZoneId = layers.badge_zone_id || 'badge-zone';

    let bodyFillRule = `fill: ${bodyColor} !important;`;
    if (pattern === 'gradient') {
      bodyFillRule = `fill: url(#dyn-gradient-${side}) !important;`;
    } else if (pattern === 'checker') {
      bodyFillRule = `fill: url(#dyn-checker-${side}) !important;`;
    }

    const badgeDisplayRule = isFront
      ? (clubBadgeUrl ? `#${badgeZoneId} { display: block !important; }` : `#${badgeZoneId} { display: none !important; }`)
      : '';

    const dynamicStyle = `
      <style>
        #${bodyId}, #${layers.body_id || 'jersey-body'},
        #${bodyId} path, #${layers.body_id || 'jersey-body'} path,
        #${bodyId} polygon, #${layers.body_id || 'jersey-body'} polygon,
        #${bodyId} rect, #${layers.body_id || 'jersey-body'} rect {
          ${bodyFillRule}
        }
        #${collarId}, #${layers.collar_id || 'jersey-collar'},
        #${collarId} path, #${layers.collar_id || 'jersey-collar'} path,
        #${collarId} polygon, #${layers.collar_id || 'jersey-collar'} polygon {
          fill: ${collarColor} !important;
          stroke: ${collarColor} !important;
        }
        #${collarId}[fill="none"], #${layers.collar_id || 'jersey-collar'}[fill="none"],
        #${collarId} path[fill="none"], #${layers.collar_id || 'jersey-collar'} path[fill="none"] {
          fill: none !important;
        }
        #${sleevesId}, #${layers.sleeves_id || 'jersey-sleeves'},
        #${sleevesId} path, #${layers.sleeves_id || 'jersey-sleeves'} path,
        #${sleevesId} polygon, #${layers.sleeves_id || 'jersey-sleeves'} polygon,
        #${sleevesId} rect, #${layers.sleeves_id || 'jersey-sleeves'} rect,
        #${sleevesId} line, #${layers.sleeves_id || 'jersey-sleeves'} line {
          fill: ${sleevesColor} !important;
          stroke: ${sleevesColor} !important;
        }
        #${sleevesId}[fill="none"], #${layers.sleeves_id || 'jersey-sleeves'}[fill="none"],
        #${sleevesId} path[fill="none"], #${layers.sleeves_id || 'jersey-sleeves'} path[fill="none"],
        #${sleevesId} line, #${layers.sleeves_id || 'jersey-sleeves'} line {
          fill: none !important;
        }
        #${stripesId}, #${layers.stripes_id || 'jersey-stripes'},
        #${stripesId} path, #${layers.stripes_id || 'jersey-stripes'} path,
        #${stripesId} rect, #${layers.stripes_id || 'jersey-stripes'} rect,
        #${stripesId} polygon, #${layers.stripes_id || 'jersey-stripes'} polygon {
          ${pattern === 'solid' ? 'display: none !important;' : `fill: ${stripesColor} !important; stroke: ${stripesColor} !important; display: block;`}
        }
        ${badgeDisplayRule}
        ${!isFront ? `
        [id^="jersey-existing-text"], .jersey-existing-text {
          display: none !important;
        }` : ''}
      </style>
    `;

    // Si le template n'a pas déjà un dégradé natif (comme grad-tpl-2), on applique le style
    if (!processed.includes('url(#grad-tpl-') || pattern !== 'gradient') {
      processed = processed.replace(/<svg[^>]*>/i, `$&\n${dynamicStyle}`);
    }

    // 5. Blason (Face avant) - GESTION PRÉSENCE / ABSENCE DU LOGO
    if (isFront) {
      const badgeRegex = new RegExp(`(<g[^>]*id=["']${badgeZoneId}["'][^>]*>)([\\s\\S]*?)(<\\/g>)`, 'i');

      if (clubBadgeUrl) {
        // Logo présent : injecter le blason dimensionné et positionné
        const badgeElem = `<image href="${clubBadgeUrl}" x="${dynBadge.x}" y="${dynBadge.y}" width="${dynBadge.width}" height="${dynBadge.height}" preserveAspectRatio="xMidYMid meet" />`;
        if (badgeRegex.test(processed)) {
          processed = processed.replace(badgeRegex, `$1${badgeElem}$3`);
        } else {
          processed = processed.replace(/<\/svg>/i, `<g id="${badgeZoneId}">${badgeElem}</g>\n</svg>`);
        }
      } else {
        // Logo absent : vider le contenu du badge pour qu'aucun logo résiduel ne soit visible
        if (badgeRegex.test(processed)) {
          processed = processed.replace(badgeRegex, `$1$3`);
        }
      }
    }

    // 6. Flockage Nom & Numéro (Dos) - POSITIONNEMENT PROPORTIONNEL AU VIEWBOX
    if (!isFront) {
      const nameText = playerName || 'JOUEUR';
      const numberText = playerNumber || '10';
      const nameOpacity = playerName ? '1' : '0.4';
      const numberOpacity = playerNumber ? '1' : '0.4';

      const flockXName = (vb.width * nameXPercent) / 100;
      const flockYName = (vb.height * nameYPercent) / 100;
      const flockXNumber = (vb.width * numberXPercent) / 100;
      const flockYNumber = (vb.height * numberYPercent) / 100;
      const flockNameSize = Math.round(dynFlock.nameFontSize * (nameFontSize / 28));
      const flockNumSize = Math.round(dynFlock.numberFontSize * (numberFontSize / 110));

      const nameElem = `<text x="${flockXName}" y="${flockYName}" text-anchor="middle" fill="${textColor}" stroke="none" opacity="${nameOpacity}" font-family="${fontFamily}" font-size="${flockNameSize}" font-weight="bold" letter-spacing="${letterSpacing}">${nameText}</text>`;
      const numberElem = `<text x="${flockXNumber}" y="${flockYNumber}" text-anchor="middle" fill="${textColor}" stroke="none" opacity="${numberOpacity}" font-family="${fontFamily}" font-size="${flockNumSize}" font-weight="900">${numberText}</text>`;

      const nameRegex = new RegExp(`(<g[^>]*id=["']${layers.name_zone_id || 'name-zone'}["'][^>]*>)([\\s\\S]*?)(<\\/g>)`, 'i');
      const numberRegex = new RegExp(`(<g[^>]*id=["']${layers.number_zone_id || 'number-zone'}["'][^>]*>)([\\s\\S]*?)(<\\/g>)`, 'i');

      if (nameRegex.test(processed)) {
        processed = processed.replace(nameRegex, `$1${nameElem}$3`);
      } else {
        processed = processed.replace(/<\/svg>/i, `<g id="${layers.name_zone_id || 'name-zone'}">${nameElem}</g>\n</svg>`);
      }

      if (numberRegex.test(processed)) {
        processed = processed.replace(numberRegex, `$1${numberElem}$3`);
      } else {
        processed = processed.replace(/<\/svg>/i, `<g id="${layers.number_zone_id || 'number-zone'}">${numberElem}</g>\n</svg>`);
      }
    }

    return processed;
  };

  const renderedSvgString = useMemo(() => buildSvgString(view), [
    template,
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
    nameXPercent,
    nameYPercent,
    numberXPercent,
    numberYPercent,
    nameFontSize,
    numberFontSize,
    letterSpacing,
    clubBadgeUrl,
    badgePosition,
    badgeSize,
    layers
  ]);

  // ── VÉRIFIER SI LE USER N'A FAIT AUCUNE PERSONNALISATION ──
  const hasNoCustomization = () => {
    const hasFlocking = playerName.trim() !== '' || playerNumber.trim() !== '';
    const hasBadge = Boolean(clubBadgeUrl);

    if (hasFlocking || hasBadge) return false;

    if (isMockup) {
      // Sur les mockups, seuls le flocage et le blason sont personnalisables
      return true;
    }

    // Pour les SVG vectoriels, comparer avec les valeurs initiales du template chargé
    const tpl = template || {};
    const defaultBodyColor   = tpl.baseColor    || '#e63946';
    const defaultBodyColor2  = tpl.accentColor  || '#1d3557';
    const defaultCollarColor = tpl.collarColor  || (tpl.collar === 'polo' ? '#111111' : '#ffffff');
    const defaultSleeves     = tpl.sleevesColor || tpl.accentColor || '#ffffff';
    const defaultStripes     = tpl.stripesColor || tpl.accentColor || '#1d3557';
    const defaultPattern     = tpl.pattern      || 'solid';
    const defaultCollar      = tpl.collar       || 'round';

    const colorsChanged = (
      bodyColor   !== defaultBodyColor   ||
      bodyColor2  !== defaultBodyColor2  ||
      collarColor !== defaultCollarColor ||
      sleevesColor !== defaultSleeves    ||
      stripesColor !== defaultStripes    ||
      pattern      !== defaultPattern    ||
      collar       !== defaultCollar
    );

    return !colorsChanged;
  };

  // ── AJOUT AU PANIER AVEC SAUVEGARDE DE LA PERSONNALISATION ──
  const handleAddToCart = async () => {
    // Vérifier si aucune personnalisation n'a été faite → demander confirmation
    if (hasNoCustomization()) {
      setShowNoCustomConfirm(true);
      return;
    }
    await doAddToCart();
  };

  // Logique effective d'ajout au panier (appelée après confirmation éventuelle)
  const doAddToCart = async () => {
    const frontSvg = buildSvgString('front');
    const backSvg = buildSvgString('back');

    // Pour les mockups :
    // - Face : URL directe de l'image (rapide, sans wrapper SVG)
    // - Dos : SVG complet intégrant l'image d'arrière-plan ET le flocage dynamique
    const frontPreview = isMockup
      ? (template?.image_front || template?.thumbnail_url || frontSvg)
      : frontSvg;

    const backPreview = backSvg;

    // preview_image_url en base : on n'envoie que l'URL externe du template (pas de data-URL géante)
    const dbPreviewUrl = isMockup
      ? (template?.image_front || template?.thumbnail_url || null)
      : null; // Pour SVG vectoriel, pas d'URL externe disponible

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
      nameXPercent,
      nameYPercent,
      numberXPercent,
      numberYPercent,
      nameFontSize,
      numberFontSize,
      letterSpacing,
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

      // On n'envoie pas svg_front/svg_back s'ils sont trop volumineux (>500KB)
      const svgFrontSafe = frontSvg && frontSvg.length < 500_000 ? frontSvg : null;
      const svgBackSafe = backSvg && backSvg.length < 500_000 ? backSvg : null;

      const res = await fetch('/api/customizations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: user?.id || null,
          template_id: template?.id || id,
          title: `${template?.name || 'Maillot Custom'} - ${playerName || 'Personnalisé'} ${playerNumber ? '#' + playerNumber : ''}`.trim(),
          svg_content: svgFrontSafe,
          svg_front: svgFrontSafe,
          svg_back: svgBackSafe,
          preview_image_url: dbPreviewUrl,
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

      const json = await res.json();
      if (res.ok && json.success && json.data?.id) {
        customizationId = json.data.id;
      } else {
        console.warn('Sauvegarde distante échouée :', json.message || res.status);
      }
    } catch (err) {
      console.warn('Sauvegarde distante de la personnalisation (fallback local) :', err);
    }

    // 2. Sauvegarde en cache local (localStorage 'jogalook-customizations')
    try {
      const localCustoms = JSON.parse(localStorage.getItem('jogalook-customizations') || '[]');
      const newCustomItem = {
        id: customizationId || `local-custom-${Date.now()}`,
        user_id: user?.id || null,
        template_id: template?.id || id,
        template_name: template?.name || 'Maillot personnalisé',
        template_type: template?.template_type || (isMockup ? 'MOCKUP' : 'SVG'),
        title: `${template?.name || 'Maillot Custom'} - ${playerName || 'Personnalisé'} ${playerNumber ? '#' + playerNumber : ''}`.trim(),
        svg_front: frontSvg,
        svg_back: backSvg,
        preview_front: frontPreview,
        preview_back: backPreview,
        custom_name: playerName || '',
        custom_number: playerNumber || '',
        font_family: fontFamily,
        primary_color: bodyColor,
        secondary_color: bodyColor2 || stripesColor,
        size,
        quantity,
        price: unitPrice,
        extra_config: extraConfig,
        created_at: new Date().toISOString()
      };
      const updatedCustoms = [newCustomItem, ...localCustoms.filter(c => c.id !== newCustomItem.id)].slice(0, 50);
      localStorage.setItem('jogalook-customizations', JSON.stringify(updatedCustoms));
    } catch (e) {
      console.warn('Erreur sauvegarde locale jogalook-customizations :', e);
    }

    // 3. Ajout au panier avec images Face & Dos et toutes les options
    addToCart({
      id: customizationId ? `custom-${customizationId}` : `custom-${template?.id || id}-${Date.now()}`,
      customization_id: customizationId,
      template_id: template?.id || id,
      template_type: template?.template_type || (isMockup ? 'MOCKUP' : 'SVG'),
      name: `${template?.name || 'Maillot Custom'} - ${playerName || 'Personnalisé'}`,
      price: unitPrice,
      quantity,
      selectedSize: size,
      selectedColor: bodyColor,
      category: 'Maillot Personnalisé',
      image: frontPreview,
      preview_front: frontPreview,
      preview_back: backPreview,
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

  if (!template) {
    return (
      <div className="figma-editor-loading" style={{ gap: '16px', padding: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 }}>Modèle introuvable</h2>
        <p style={{ color: '#64748b', margin: '0 0 16px', maxWidth: '400px' }}>
          Ce modèle de maillot n&apos;est pas disponible pour le moment.
        </p>
        <button
          className="btn-primary"
          style={{ padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', background: 'var(--primary, #F15A24)', color: '#fff', border: 'none', fontWeight: '700' }}
          onClick={() => navigate('/custom')}
        >
          ← Choisir un autre modèle
        </button>
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
            <span className="template-status-pill">{template?.is_free ? 'Template Inclus' : formatFCFA(template?.price)}</span>
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
            <span className="live-price-amount">{formatFCFA(totalPrice)}</span>
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

      {/* ── MODALE CONFIRMATION : Aucune personnalisation détectée ── */}
      {showNoCustomConfirm && (
        <div
          className="no-custom-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmation ajout sans personnalisation"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNoCustomConfirm(false); }}
        >
          <div className="no-custom-confirm-modal">
            {/* Icône d'avertissement */}
            <div className="no-custom-confirm-icon">🎨</div>

            <h2 className="no-custom-confirm-title">Aucune personnalisation</h2>
            <p className="no-custom-confirm-body">
              Vous n'avez pas encore personnalisé ce maillot.<br />
              Voulez-vous l'ajouter tel quel, ou continuer à le personnaliser ?
            </p>

            {/* Rappel des éléments personnalisables */}
            <ul className="no-custom-confirm-hints">
              {!isMockup && <li>🎨 Couleurs : corps, col, manches, motifs</li>}
              <li>✍️ Flocage : nom du joueur &amp; numéro</li>
              {!isMockup && <li>🛡️ Blason / logo de club</li>}
            </ul>

            <div className="no-custom-confirm-actions">
              <button
                type="button"
                className="no-custom-btn no-custom-btn--secondary"
                onClick={() => {
                  setShowNoCustomConfirm(false);
                  // Orienter directement vers l'onglet de personnalisation
                  setActiveTab(isMockup ? 'flockage' : 'colors');
                  if (isMockup) setView('back');
                }}
              >
                ✏️ Personnaliser d'abord
              </button>
              <button
                type="button"
                className="no-custom-btn no-custom-btn--primary"
                onClick={async () => {
                  setShowNoCustomConfirm(false);
                  await doAddToCart();
                }}
              >
                🛒 Ajouter tel quel
              </button>
            </div>
          </div>
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
                        <label className="tool-label">Nom du joueur (+10 000 FCFA)</label>
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
                        <label className="tool-label">Numéro (+5 000 FCFA)</label>
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
                    <label className="tool-label">Police de caractère ({fontFamilies.length} styles disponibles)</label>
                    <select
                      className="tool-select"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      style={{ fontSize: '0.92rem', fontWeight: 'bold' }}
                    >
                      {fontFamilies.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value, fontSize: '1rem' }}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tool-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <label className="tool-label" style={{ margin: 0 }}>Couleur du flockage (Personnalisable à 100%)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Sélecteur de couleur infini (Pipette libre) */}
                        <div
                          style={{
                            position: 'relative',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: '2px solid #cbd5e1',
                            backgroundColor: textColor,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                          title="Choisir n'importe quelle couleur (Pipette libre)"
                        >
                          <input
                            type="color"
                            value={textColor.startsWith('#') && textColor.length === 7 ? textColor : '#ffffff'}
                            onChange={(e) => setTextColor(e.target.value)}
                            style={{
                              position: 'absolute',
                              top: '-10px',
                              left: '-10px',
                              width: '50px',
                              height: '50px',
                              opacity: 0,
                              cursor: 'pointer'
                            }}
                          />
                        </div>
                        {/* Code HEX modifiable à la main */}
                        <input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          placeholder="#ffffff"
                          style={{
                            width: '84px',
                            padding: '4px 8px',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}
                          maxLength={7}
                        />
                      </div>
                    </div>

                    {/* Nuancier sport étendu avec 16 teintes officielles */}
                    <div className="color-swatch-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                      {flockingPalette.map((item) => (
                        <button
                          key={item.hex}
                          className={`swatch-btn ${textColor.toLowerCase() === item.hex.toLowerCase() ? 'selected' : ''}`}
                          style={{ backgroundColor: item.hex }}
                          onClick={() => setTextColor(item.hex)}
                          title={item.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Positionnement & Tailles Personnalisables (Préférences par défaut issues de la BD) */}
                  <div style={{ marginTop: '14px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>📐 Position & Taille du Flockage</span>
                      <button
                        type="button"
                        onClick={() => {
                          const flockConf = template?.flocking_config || {};
                          setNameXPercent(flockConf.name?.x_percent ?? 50);
                          setNameYPercent(flockConf.name?.y_percent ?? 26);
                          setNumberXPercent(flockConf.number?.x_percent ?? 50);
                          setNumberYPercent(flockConf.number?.y_percent ?? 52);
                          setNameFontSize(flockConf.name?.font_size || 28);
                          setNumberFontSize(flockConf.number?.font_size || 110);
                          setLetterSpacing(flockConf.name?.letter_spacing || 4);
                        }}
                        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.74rem', cursor: 'pointer', textDecoration: 'underline' }}
                        title="Rétablir les positions configurées par défaut pour ce modèle"
                      >
                        ↺ Réinitialiser
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Position X Nom */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Position X Nom</span>
                          <span style={{ color: '#f15a24', fontWeight: 700 }}>{nameXPercent}% {nameXPercent === 50 ? '(Centré)' : ''}</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="80"
                          value={nameXPercent}
                          onChange={(e) => setNameXPercent(parseInt(e.target.value, 10))}
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Hauteur Y Nom */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Hauteur Y Nom</span>
                          <span style={{ color: '#f15a24', fontWeight: 700 }}>{nameYPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="45"
                          value={nameYPercent}
                          onChange={(e) => setNameYPercent(parseInt(e.target.value, 10))}
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Position X Numéro */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Position X Numéro</span>
                          <span style={{ color: '#f15a24', fontWeight: 700 }}>{numberXPercent}% {numberXPercent === 50 ? '(Centré)' : ''}</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="80"
                          value={numberXPercent}
                          onChange={(e) => setNumberXPercent(parseInt(e.target.value, 10))}
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Hauteur Y Numéro */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Hauteur Y Numéro</span>
                          <span style={{ color: '#f15a24', fontWeight: 700 }}>{numberYPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="35"
                          max="75"
                          value={numberYPercent}
                          onChange={(e) => setNumberYPercent(parseInt(e.target.value, 10))}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Taille Nom</span>
                          <span style={{ color: '#f15a24', fontWeight: 700 }}>{nameFontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="48"
                          value={nameFontSize}
                          onChange={(e) => setNameFontSize(parseInt(e.target.value, 10))}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Taille Numéro</span>
                          <span style={{ color: '#f15a24', fontWeight: 700 }}>{numberFontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="160"
                          value={numberFontSize}
                          onChange={(e) => setNumberFontSize(parseInt(e.target.value, 10))}
                          style={{ width: '100%' }}
                        />
                      </div>
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

                  {/* Contrôle de Présence / Absence du Logo */}
                  <div className="tool-group">
                    <label className="tool-label">Option Blason & Logo</label>
                    <div className="badge-presence-toggle">
                      <button
                        type="button"
                        className={`toggle-option-btn ${!clubBadgeUrl ? 'active' : ''}`}
                        onClick={() => setClubBadgeUrl(null)}
                      >
                        <span>🚫 Sans blason</span>
                        <small>Épuré (Inclus)</small>
                      </button>
                      <button
                        type="button"
                        className={`toggle-option-btn ${clubBadgeUrl ? 'active' : ''}`}
                        onClick={() => {
                          if (!clubBadgeUrl) {
                            setClubBadgeUrl(template?.badge_url || BADGE_PRESETS[0].url);
                            setView('front');
                          }
                        }}
                      >
                        <span>🛡️ Avec blason</span>
                        <small>Personnalisé (+5 000 FCFA)</small>
                      </button>
                    </div>
                  </div>

                  {clubBadgeUrl ? (
                    <>
                      {/* Upload personnalisé */}
                      <div className="tool-group">
                        <label className="tool-label">Importer votre image (PNG, SVG, JPG)</label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handleBadgeUpload}
                        />

                        <div className="upload-badge-dropzone" onClick={() => fileInputRef.current?.click()}>
                          <div className="uploaded-badge-preview">
                            <img src={clubBadgeUrl} alt="Blason club" />
                            <span>Remplacer l'image</span>
                          </div>
                        </div>
                      </div>

                      {/* Blasons et Écussons Prédéfinis */}
                      <div className="tool-group">
                        <label className="tool-label">Ou sélectionner un blason officiel</label>
                        <div className="badge-presets-row">
                          {BADGE_PRESETS.map((bp) => (
                            <button
                              key={bp.id}
                              type="button"
                              className={`badge-preset-item ${clubBadgeUrl === bp.url ? 'active' : ''}`}
                              title={bp.name}
                              onClick={() => {
                                setClubBadgeUrl(bp.url);
                                setView('front');
                              }}
                            >
                              <img src={bp.url} alt={bp.name} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Position du blason */}
                      <div className="tool-group">
                        <label className="tool-label">Position sur la poitrine</label>
                        <div className="chip-row">
                          <button
                            className={`chip-btn ${badgePosition === 'left' ? 'active' : ''}`}
                            onClick={() => { setBadgePosition('left'); setView('front'); }}
                          >
                            Poitrine Gauche (Cœur)
                          </button>
                          <button
                            className={`chip-btn ${badgePosition === 'center' ? 'active' : ''}`}
                            onClick={() => { setBadgePosition('center'); setView('front'); }}
                          >
                            Centre
                          </button>
                          <button
                            className={`chip-btn ${badgePosition === 'right' ? 'active' : ''}`}
                            onClick={() => { setBadgePosition('right'); setView('front'); }}
                          >
                            Poitrine Droite
                          </button>
                        </div>
                      </div>

                      {/* Taille du blason */}
                      <div className="tool-group">
                        <label className="tool-label">Taille du blason</label>
                        <div className="chip-row">
                          {[
                            { key: 'small', label: 'Discret (Petit)' },
                            { key: 'medium', label: 'Standard (Moyen)' },
                            { key: 'large', label: 'Imposant (Grand)' }
                          ].map((s) => (
                            <button
                              key={s.key}
                              className={`chip-btn ${badgeSize === s.key ? 'active' : ''}`}
                              onClick={() => { setBadgeSize(s.key); setView('front'); }}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-remove-badge"
                        onClick={() => setClubBadgeUrl(null)}
                      >
                        🗑️ Retirer le blason du maillot
                      </button>
                    </>
                  ) : (
                    <div className="badge-absent-notice">
                      <p>Ce maillot est actuellement configuré <strong>sans blason</strong> sur la poitrine.</p>
                      <button
                        type="button"
                        className="chip-btn active"
                        style={{ padding: '8px 16px', borderRadius: '50px' }}
                        onClick={() => {
                          setClubBadgeUrl(template?.badge_url || BADGE_PRESETS[0].url);
                          setView('front');
                        }}
                      >
                        + Ajouter un blason
                      </button>
                    </div>
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
                      <span>Prix du modèle</span>
                      <span>{formatFCFA(unitPrice)}</span>
                    </div>
                    {playerName && (
                      <div className="summary-line">
                        <span>Nom "{playerName}"</span>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Inclus</span>
                      </div>
                    )}
                    {playerNumber && (
                      <div className="summary-line">
                        <span>Numéro "{playerNumber}"</span>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Inclus</span>
                      </div>
                    )}
                    {clubBadgeUrl && (
                      <div className="summary-line">
                        <span>Blason Club</span>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Inclus</span>
                      </div>
                    )}
                    <div className="summary-line total-line">
                      <span>Total ({quantity} ex.)</span>
                      <span>{formatFCFA(totalPrice)}</span>
                    </div>
                  </div>


                  <button className="btn-add-cart-popover" onClick={handleAddToCart}>
                    Ajouter au panier ({formatFCFA(totalPrice)})
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
