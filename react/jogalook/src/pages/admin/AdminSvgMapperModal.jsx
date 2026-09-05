import { useState, useEffect, useMemo, useRef } from 'react';
import { interpretSvg, extractOriginalColors } from '../../utils/svgInterpreter';
import { parseSvgViewBox, normalizeSvgForDisplay } from '../../utils/svgUtils';
import './AdminSvgMapper.css';

const DEFAULT_BADGE_PRESET = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='%231d3557' stroke='%23ffd700' stroke-width='4'/><polygon points='50,15 61,38 85,41 68,57 72,81 50,70 28,81 32,57 15,41 39,38' fill='%23ffd700'/></svg>";

const ROLE_OPTIONS = [
  { id: 'body', label: '👕 Corps Principal', semanticId: 'jersey-body', color: '#e63946' },
  { id: 'collar', label: '👔 Col du Maillot', semanticId: 'jersey-collar', color: '#1d3557' },
  { id: 'sleeves', label: '💪 Manches & Épaules', semanticId: 'jersey-sleeves', color: '#2a9d8f' },
  { id: 'stripes', label: '🎨 Bandes & Motifs', semanticId: 'jersey-stripes', color: '#f4a261' },
  { id: 'existing-text', label: '👁️ Texte/Dessin à masquer', semanticId: 'jersey-existing-text', color: '#94a3b8' },
  { id: 'decoration', label: '🔒 Décoration fixe (ne change pas)', semanticId: 'jersey-decoration', color: '#64748b' },
];

const TEST_PALETTES = [
  { name: 'Rouge Flash', hex: '#e63946' },
  { name: 'Bleu Marine', hex: '#1d3557' },
  { name: 'Blanc Pur', hex: '#ffffff' },
  { name: 'Noir Carbone', hex: '#111111' },
  { name: 'Vert Émeraude', hex: '#2a9d8f' },
  { name: 'Jaune Or', hex: '#ffd700' },
  { name: 'Violet Royal', hex: '#7b2d8e' },
];

export function AdminSvgMapperModal({
  open,
  onClose,
  initialSvg,
  side = 'front', // 'front' | 'back'
  badgeUrl = '',
  onSave
}) {
  if (!open) return null;

  const [currentSide, setCurrentSide] = useState(side);
  const [svgInput, setSvgInput] = useState(initialSvg || '');
  const [mode, setMode] = useState('select'); // 'select' | 'badge' | 'flockage_name' | 'flockage_number'
  
  // Éléments extraits : { index, tag, raw, role, semanticId, originalFill, bbox }
  const [elements, setElements] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Positionnement Blason (Face)
  const [badgePos, setBadgePos] = useState({
    xPercent: 35,
    yPercent: 27,
    size: 'medium' // 'small' (32px), 'medium' (44px), 'large' (58px)
  });

  // Positionnement Flockage (Dos)
  const [flockPos, setFlockPos] = useState({
    nameYPercent: 28,
    numberYPercent: 62
  });

  // Sandbox de test couleur en direct
  const [testColors, setTestColors] = useState({
    body: '#e63946',
    sleeves: '#1d3557',
    collar: '#ffffff',
    stripes: '#ffd700',
  });

  const containerRef = useRef(null);

  // Initialisation à l'ouverture ou changement de side
  useEffect(() => {
    setCurrentSide(side);
    setSvgInput(initialSvg || '');
    parseAndInitSvg(initialSvg || '', side);
  }, [initialSvg, side, open]);

  // Analyse et extraction des éléments du SVG
  const parseAndInitSvg = (rawSvg, activeSide) => {
    if (!rawSvg || !rawSvg.includes('<svg')) {
      setElements([]);
      return;
    }

    // Exécuter l'auto-détecteur comme proposition initiale
    const { analysis } = interpretSvg(rawSvg, activeSide);
    
    // Extraire tous les tracés élémentaires (<path>, <rect>, <polygon>, etc.)
    const tagMatches = [...rawSvg.matchAll(/<(path|rect|polygon|circle|ellipse|line)\b([^>]*?)(\/?>)/gi)];
    
    const parsed = tagMatches.map((m, idx) => {
      const tag = m[1].toLowerCase();
      const attrStr = m[2];
      const fillMatch = attrStr.match(/fill=["']([^"']+)["']/i);
      const idMatch = attrStr.match(/id=["']([^"']+)["']/i);
      const existingId = idMatch ? idMatch[1] : '';

      // Tenter de déduire le rôle depuis l'ID existant ou depuis l'analyse automatique
      let role = null;
      let semanticId = existingId;

      if (existingId.includes('body')) role = 'body';
      else if (existingId.includes('collar')) role = 'collar';
      else if (existingId.includes('sleeves')) role = 'sleeves';
      else if (existingId.includes('stripes')) role = 'stripes';
      else if (existingId.includes('existing-text')) role = 'existing-text';
      else if (existingId.includes('decoration')) role = 'decoration';
      else {
        // Déduire depuis l'analyse automatique
        for (const [roleKey, items] of Object.entries(analysis?.roleMap || {})) {
          const matchItem = items.find(it => it.index === idx);
          if (matchItem) {
            if (roleKey === 'jersey-body') role = 'body';
            else if (roleKey === 'jersey-collar') role = 'collar';
            else if (roleKey === 'jersey-sleeves') role = 'sleeves';
            else if (roleKey === 'jersey-stripes') role = 'stripes';
            else if (roleKey === 'jersey-existing-text') role = 'existing-text';
            else if (roleKey === 'jersey-decoration') role = 'decoration';
            semanticId = matchItem.semanticId;
            break;
          }
        }
      }

      return {
        index: idx,
        tag,
        raw: m[0],
        attrStr,
        originalFill: fillMatch ? fillMatch[1] : 'none',
        role: role || null,
        semanticId: semanticId || ''
      };
    });

    setElements(parsed);

    // Initialiser les couleurs de test avec les couleurs d'origine
    const origColors = extractOriginalColors(analysis);
    setTestColors(prev => ({
      body: origColors.bodyColor || prev.body,
      sleeves: origColors.sleevesColor || prev.sleeves,
      collar: origColors.collarColor || prev.collar,
      stripes: origColors.stripesColor || prev.stripes,
    }));
  };

  // Attribution d'un rôle à l'élément sélectionné
  const assignRole = (roleKey) => {
    if (selectedIndex === null) return;
    const option = ROLE_OPTIONS.find(o => o.id === roleKey);

    setElements(prev => prev.map(el => {
      if (el.index !== selectedIndex) return el;
      if (!roleKey) {
        return { ...el, role: null, semanticId: '' };
      }
      return {
        ...el,
        role: roleKey,
        semanticId: option ? option.semanticId : roleKey
      };
    }));
  };

  // Auto-détection intelligente en un clic
  const handleAutoDetect = () => {
    const { analysis } = interpretSvg(svgInput, currentSide);
    setElements(prev => prev.map((el, idx) => {
      let role = null;
      let semanticId = '';
      for (const [roleKey, items] of Object.entries(analysis?.roleMap || {})) {
        const matchItem = items.find(it => it.index === idx);
        if (matchItem) {
          if (roleKey === 'jersey-body') role = 'body';
          else if (roleKey === 'jersey-collar') role = 'collar';
          else if (roleKey === 'jersey-sleeves') role = 'sleeves';
          else if (roleKey === 'jersey-stripes') role = 'stripes';
          else if (roleKey === 'jersey-existing-text') role = 'existing-text';
          else if (roleKey === 'jersey-decoration') role = 'decoration';
          semanticId = matchItem.semanticId;
          break;
        }
      }
      return { ...el, role, semanticId };
    }));
  };

  // Gestion du clic sur le canvas SVG (placement blason / flockage ou sélection d'élément)
  const handleCanvasClick = (e) => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const rect = svgEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const xPct = Math.round((clickX / rect.width) * 100);
    const yPct = Math.round((clickY / rect.height) * 100);

    if (mode === 'badge') {
      setBadgePos(prev => ({ ...prev, xPercent: xPct, yPercent: yPct }));
      return;
    }

    if (mode === 'flockage_name') {
      setFlockPos(prev => ({ ...prev, nameYPercent: yPct }));
      return;
    }

    if (mode === 'flockage_number') {
      setFlockPos(prev => ({ ...prev, numberYPercent: yPct }));
      return;
    }

    // Mode sélection : trouver quel path a été touché via e.target
    const target = e.target;
    if (target && target.hasAttribute('data-admin-idx')) {
      const idx = parseInt(target.getAttribute('data-admin-idx'), 10);
      setSelectedIndex(idx);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (mode !== 'select') return;
    const target = e.target;
    if (target && target.hasAttribute('data-admin-idx')) {
      const idx = parseInt(target.getAttribute('data-admin-idx'), 10);
      setHoveredIndex(idx);
    } else {
      setHoveredIndex(null);
    }
  };

  // Reconstruire le SVG interactif avec attributs data-admin-idx et styles de test en direct
  const renderedInteractiveSvg = useMemo(() => {
    if (!svgInput || !svgInput.includes('<svg')) return '';

    let working = normalizeSvgForDisplay(svgInput);
    const vb = parseSvgViewBox(working);

    // 1. Injecter data-admin-idx sur chaque tracé pour le rendre cliquable et assigné
    let matchIdx = 0;
    working = working.replace(/<(path|rect|polygon|circle|ellipse|line)\b([^>]*?)(\/?>)/gi, (full, tag, attrs, close) => {
      const currentIdx = matchIdx++;
      const elMeta = elements.find(el => el.index === currentIdx);
      const isSelected = selectedIndex === currentIdx;
      const isHovered = hoveredIndex === currentIdx;

      let extraClass = 'svg-mapper-item';
      if (isSelected) extraClass += ' svg-mapper-selected-element';
      if (elMeta?.role) extraClass += ` role-${elMeta.role}`;

      const assignedId = elMeta?.role
        ? `data-assigned-role="${elMeta.role}" id="${elMeta.semanticId || `elem-${currentIdx}`}"`
        : '';

      return `<${tag} ${attrs} data-admin-idx="${currentIdx}" class="${extraClass}" ${assignedId} ${close}`;
    });

    // 2. Injecter les styles en direct pour le bac à sable couleur et les surbrillances
    const liveTestCss = `
      <style>
        .svg-mapper-item {
          cursor: pointer;
          transition: filter 0.15s ease, stroke 0.15s ease;
        }
        .svg-mapper-item:hover {
          filter: drop-shadow(0 0 8px #00d2ff) !important;
          stroke: #00d2ff !important;
          stroke-width: 2.5px !important;
        }
        .svg-mapper-selected-element {
          filter: drop-shadow(0 0 12px #f15a24) !important;
          stroke: #f15a24 !important;
          stroke-width: 3.5px !important;
        }
        /* Rendu en direct des couleurs testées */
        [data-assigned-role="body"] {
          fill: ${testColors.body} !important;
        }
        [data-assigned-role="collar"] {
          fill: ${testColors.collar} !important;
          stroke: ${testColors.collar} !important;
        }
        [data-assigned-role="sleeves"] {
          fill: ${testColors.sleeves} !important;
          stroke: ${testColors.sleeves} !important;
        }
        [data-assigned-role="stripes"] {
          fill: ${testColors.stripes} !important;
          stroke: ${testColors.stripes} !important;
        }
        [data-assigned-role="existing-text"] {
          opacity: 0.15 !important;
          stroke: red !important;
          stroke-dasharray: 4,4 !important;
        }
      </style>
    `;

    // 3. Injecter l'indicateur visuel du Blason (Face)
    let badgeOverlay = '';
    if (currentSide === 'front') {
      const badgeX = vb.minX + (vb.width * badgePos.xPercent) / 100;
      const badgeY = vb.minY + (vb.height * badgePos.yPercent) / 100;
      const badgeRadius = badgePos.size === 'small' ? 16 : badgePos.size === 'large' ? 28 : 22;
      
      badgeOverlay = `
        <g id="badge-zone-marker" pointer-events="none">
          <circle cx="${badgeX}" cy="${badgeY}" r="${badgeRadius}" fill="#ffd700" opacity="0.35" stroke="#f15a24" stroke-width="2.5" stroke-dasharray="4,2"/>
          <circle cx="${badgeX}" cy="${badgeY}" r="4" fill="#f15a24"/>
          <text x="${badgeX}" y="${badgeY + badgeRadius + 14}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">🛡️ Blason</text>
        </g>
      `;
    }

    // 4. Injecter l'indicateur visuel du Flockage (Dos)
    let flockOverlay = '';
    if (currentSide === 'back') {
      const centerX = vb.minX + vb.width * 0.5;
      const nameY = vb.minY + (vb.height * flockPos.nameYPercent) / 100;
      const numberY = vb.minY + (vb.height * flockPos.numberYPercent) / 100;

      flockOverlay = `
        <g id="flock-markers" pointer-events="none">
          <text x="${centerX}" y="${nameY}" text-anchor="middle" font-family="Impact, sans-serif" font-size="20" font-weight="bold" fill="#0f172a" opacity="0.75" letter-spacing="3">JOUEUR</text>
          <line x1="${centerX - 50}" y1="${nameY + 4}" x2="${centerX + 50}" y2="${nameY + 4}" stroke="#f15a24" stroke-width="1.5" stroke-dasharray="3,3"/>
          <text x="${centerX}" y="${numberY}" text-anchor="middle" font-family="Impact, sans-serif" font-size="70" font-weight="900" fill="#0f172a" opacity="0.75">10</text>
        </g>
      `;
    }

    working = working.replace(/<\/svg>/i, `${liveTestCss}\n${badgeOverlay}\n${flockOverlay}\n</svg>`);
    return working;
  }, [svgInput, elements, selectedIndex, hoveredIndex, testColors, currentSide, badgePos, flockPos]);

  // Construction du SVG final nettoyé avec IDs réels et injection des calques
  const handleSaveAndInject = () => {
    if (!svgInput) return;

    let finalSvg = normalizeSvgForDisplay(svgInput);
    const vb = parseSvgViewBox(finalSvg);

    // 1. Injecter les IDs sémantiques sur chaque tracé selon les attributions
    let matchIdx = 0;
    finalSvg = finalSvg.replace(/<(path|rect|polygon|circle|ellipse|line)\b([^>]*?)(\/?>)/gi, (full, tag, attrs, close) => {
      const currentIdx = matchIdx++;
      const elMeta = elements.find(el => el.index === currentIdx);
      if (!elMeta || !elMeta.role) return full;

      // Nettoyer l'id existant s'il y en avait un
      let cleanAttrs = attrs.replace(/\bid=["'][^"']*["']/gi, '').trim();
      let semanticId = elMeta.semanticId;

      if (elMeta.role === 'body') semanticId = currentSide === 'front' ? 'jersey-body' : 'jersey-body-back';
      if (elMeta.role === 'collar') semanticId = currentSide === 'front' ? 'jersey-collar' : 'jersey-collar-back';
      if (elMeta.role === 'sleeves') semanticId = currentSide === 'front' ? 'jersey-sleeves' : 'jersey-sleeves-back';
      if (elMeta.role === 'stripes') semanticId = currentSide === 'front' ? 'jersey-stripes' : 'jersey-stripes-back';
      if (elMeta.role === 'existing-text') semanticId = `jersey-existing-text-${currentIdx}`;

      return `<${tag} id="${semanticId}" class="jersey-layer ${semanticId}" ${cleanAttrs} ${close}`;
    });

    // 2. Pour la Face Avant : injecter la balise badge-zone aux coordonnées choisies
    if (currentSide === 'front') {
      const badgeX = Math.round(vb.minX + (vb.width * badgePos.xPercent) / 100);
      const badgeY = Math.round(vb.minY + (vb.height * badgePos.yPercent) / 100);
      const badgeRadius = badgePos.size === 'small' ? 16 : badgePos.size === 'large' ? 28 : 22;

      const badgeZoneTag = `\n  <g id="badge-zone">\n    <circle cx="${badgeX}" cy="${badgeY}" r="${badgeRadius}" fill="#ffd700"/>\n  </g>`;

      if (finalSvg.includes('id="badge-zone"')) {
        finalSvg = finalSvg.replace(/<g[^>]*id=["']badge-zone["'][^>]*>[\s\S]*?<\/g>/i, badgeZoneTag.trim());
      } else {
        finalSvg = finalSvg.replace(/<\/svg>/i, `${badgeZoneTag}\n</svg>`);
      }
    }

    // 3. Pour le Dos : injecter name-zone et number-zone
    if (currentSide === 'back') {
      const centerX = Math.round(vb.minX + vb.width * 0.5);
      const nameY = Math.round(vb.minY + (vb.height * flockPos.nameYPercent) / 100);
      const numberY = Math.round(vb.minY + (vb.height * flockPos.numberYPercent) / 100);

      const flockTags = `\n  <g id="name-zone">\n    <text x="${centerX}" y="${nameY}" text-anchor="middle" fill="#ffffff" font-family="Impact, sans-serif" font-size="22" font-weight="bold" letter-spacing="4">JOUEUR</text>\n  </g>\n  <g id="number-zone">\n    <text x="${centerX}" y="${numberY}" text-anchor="middle" fill="#ffffff" font-family="Impact, sans-serif" font-size="90" font-weight="900">10</text>\n  </g>`;

      if (finalSvg.includes('id="name-zone"') || finalSvg.includes('id="number-zone"')) {
        finalSvg = finalSvg
          .replace(/<g[^>]*id=["']name-zone["'][^>]*>[\s\S]*?<\/g>/i, '')
          .replace(/<g[^>]*id=["']number-zone["'][^>]*>[\s\S]*?<\/g>/i, '');
      }
      finalSvg = finalSvg.replace(/<\/svg>/i, `${flockTags}\n</svg>`);
    }

    // Préparer la config des calques
    const layersConfig = {
      body_id: currentSide === 'front' ? 'jersey-body' : 'jersey-body-back',
      collar_id: currentSide === 'front' ? 'jersey-collar' : 'jersey-collar-back',
      sleeves_id: currentSide === 'front' ? 'jersey-sleeves' : 'jersey-sleeves-back',
      stripes_id: currentSide === 'front' ? 'jersey-stripes' : 'jersey-stripes-back',
      badge_zone_id: 'badge-zone',
      name_zone_id: 'name-zone',
      number_zone_id: 'number-zone'
    };

    onSave({
      finalSvg,
      layersConfig,
      side: currentSide
    });

    onClose();
  };

  const selectedElement = selectedIndex !== null ? elements.find(el => el.index === selectedIndex) : null;

  return (
    <div className="svg-mapper-overlay" onClick={onClose}>
      <div className="svg-mapper-window" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="svg-mapper-header">
          <div className="svg-mapper-header__title">
            <h3>🎨 Studio de Mapping & Identification SVG</h3>
            <span>{elements.length} éléments détectés</span>
          </div>

          <div className="svg-mapper-side-switch">
            <button
              type="button"
              className={`svg-mapper-side-btn ${currentSide === 'front' ? 'active' : ''}`}
              onClick={() => setCurrentSide('front')}
            >
              Face Avant
            </button>
            <button
              type="button"
              className={`svg-mapper-side-btn ${currentSide === 'back' ? 'active' : ''}`}
              onClick={() => setCurrentSide('back')}
            >
              Dos / Arrière
            </button>
          </div>

          <button type="button" className="svg-mapper-close-btn" onClick={onClose} title="Fermer">
            ✕
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="svg-mapper-toolbar">
          <div className="svg-mapper-modes">
            <button
              type="button"
              className={`svg-mapper-mode-btn ${mode === 'select' ? 'active' : ''}`}
              onClick={() => setMode('select')}
            >
              <span>🔍</span>
              <span>Identifier les éléments</span>
            </button>

            {currentSide === 'front' && (
              <button
                type="button"
                className={`svg-mapper-mode-btn ${mode === 'badge' ? 'active' : ''}`}
                onClick={() => setMode('badge')}
              >
                <span>🛡️</span>
                <span>Placer le Blason</span>
              </button>
            )}

            {currentSide === 'back' && (
              <>
                <button
                  type="button"
                  className={`svg-mapper-mode-btn ${mode === 'flockage_name' ? 'active' : ''}`}
                  onClick={() => setMode('flockage_name')}
                >
                  <span>✍️</span>
                  <span>Position Nom</span>
                </button>
                <button
                  type="button"
                  className={`svg-mapper-mode-btn ${mode === 'flockage_number' ? 'active' : ''}`}
                  onClick={() => setMode('flockage_number')}
                >
                  <span>🔢</span>
                  <span>Position Numéro</span>
                </button>
              </>
            )}
          </div>

          <div className="svg-mapper-actions">
            <button
              type="button"
              className="svg-mapper-btn svg-mapper-btn--magic"
              onClick={handleAutoDetect}
              title="Pré-remplit les rôles par analyse géométrique"
            >
              <span>✨</span>
              <span>Auto-détection IA / Géométrie</span>
            </button>
          </div>
        </div>

        {/* 2 COLUMNS BODY */}
        <div className="svg-mapper-body">
          
          {/* COLONNE GAUCHE : CANVAS SVG INTERACTIF */}
          <div className="svg-mapper-canvas-col">
            <div
              className="svg-mapper-canvas-wrapper"
              ref={containerRef}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
            >
              <div
                className="svg-mapper-svg-container"
                dangerouslySetInnerHTML={{ __html: renderedInteractiveSvg }}
              />

              <div className="svg-mapper-canvas-hint">
                {mode === 'select' && (hoveredIndex !== null ? '💡 Cliquez pour assigner cet élément' : 'Survolez un élément pour l’inspecter, cliquez pour l’assigner')}
                {mode === 'badge' && '🛡️ Cliquez sur la poitrine pour placer le blason'}
                {mode === 'flockage_name' && '✍️ Cliquez sur le haut du dos pour placer la ligne du nom'}
                {mode === 'flockage_number' && '🔢 Cliquez sur le milieu du dos pour placer le numéro'}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : ATTRIBUTIONS & SANDBOX TEST */}
          <div className="svg-mapper-sidebar">
            
            {/* PANNEAU ATTRIBUTION */}
            <div className="svg-mapper-panel-card">
              <div className="svg-mapper-panel-card__title">
                <span>Attribution de l'élément</span>
                {selectedElement ? (
                  <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>
                    Élément #{selectedElement.index + 1} ({selectedElement.tag})
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aucun sélectionné</span>
                )}
              </div>

              {selectedElement ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#475569' }}>
                    <span>Couleur d'origine :</span>
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: selectedElement.originalFill,
                        border: '1px solid rgba(0,0,0,0.2)',
                        display: 'inline-block'
                      }}
                    />
                    <code style={{ fontSize: '0.75rem' }}>{selectedElement.originalFill}</code>
                  </div>

                  <div className="svg-mapper-tag-grid">
                    {ROLE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`svg-mapper-tag-btn ${selectedElement.role === opt.id ? 'active' : ''}`}
                        onClick={() => assignRole(opt.id)}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>

                  {selectedElement.role && (
                    <button
                      type="button"
                      className="svg-mapper-btn svg-mapper-btn--ghost"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#ef4444' }}
                      onClick={() => assignRole(null)}
                    >
                      🗑️ Retirer l'assignation de cet élément
                    </button>
                  )}
                </>
              ) : (
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  Cliquez sur n'importe quel tracé du maillot dans le canvas de gauche pour lui assigner son rôle (Corps, Col, Manches, Liseré...).
                </p>
              )}
            </div>

            {/* CONTRÔLE TAILLE BLASON (Si Face) */}
            {currentSide === 'front' && (
              <div className="svg-mapper-panel-card">
                <div className="svg-mapper-panel-card__title">
                  <span>Taille du Blason</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>X: {badgePos.xPercent}% | Y: {badgePos.yPercent}%</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'small', label: 'Discret (Petit)' },
                    { id: 'medium', label: 'Standard (Moyen)' },
                    { id: 'large', label: 'Imposant (Grand)' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`svg-mapper-side-btn ${badgePos.size === s.id ? 'active' : ''}`}
                      style={{ flex: 1, border: '1px solid #cbd5e1' }}
                      onClick={() => setBadgePos(prev => ({ ...prev, size: s.id }))}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* LIVE COLOR TESTING SANDBOX */}
            <div className="svg-mapper-sandbox">
              <div className="svg-mapper-panel-card__title">
                <span>🧪 Test en direct des couleurs</span>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>Rendu temps réel</span>
              </div>

              {/* Corps */}
              <div className="svg-mapper-sandbox-row">
                <span>👕 Corps :</span>
                <div className="svg-mapper-color-swatches">
                  {TEST_PALETTES.map(p => (
                    <button
                      key={p.hex}
                      type="button"
                      className={`svg-mapper-swatch ${testColors.body === p.hex ? 'active' : ''}`}
                      style={{ background: p.hex }}
                      onClick={() => setTestColors(prev => ({ ...prev, body: p.hex }))}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>

              {/* Manches */}
              <div className="svg-mapper-sandbox-row">
                <span>💪 Manches :</span>
                <div className="svg-mapper-color-swatches">
                  {TEST_PALETTES.map(p => (
                    <button
                      key={p.hex}
                      type="button"
                      className={`svg-mapper-swatch ${testColors.sleeves === p.hex ? 'active' : ''}`}
                      style={{ background: p.hex }}
                      onClick={() => setTestColors(prev => ({ ...prev, sleeves: p.hex }))}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>

              {/* Col */}
              <div className="svg-mapper-sandbox-row">
                <span>👔 Col :</span>
                <div className="svg-mapper-color-swatches">
                  {TEST_PALETTES.map(p => (
                    <button
                      key={p.hex}
                      type="button"
                      className={`svg-mapper-swatch ${testColors.collar === p.hex ? 'active' : ''}`}
                      style={{ background: p.hex }}
                      onClick={() => setTestColors(prev => ({ ...prev, collar: p.hex }))}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>

              {/* Bandes */}
              <div className="svg-mapper-sandbox-row">
                <span>🎨 Bandes :</span>
                <div className="svg-mapper-color-swatches">
                  {TEST_PALETTES.map(p => (
                    <button
                      key={p.hex}
                      type="button"
                      className={`svg-mapper-swatch ${testColors.stripes === p.hex ? 'active' : ''}`}
                      style={{ background: p.hex }}
                      onClick={() => setTestColors(prev => ({ ...prev, stripes: p.hex }))}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="svg-mapper-footer">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Assignés : {elements.filter(e => e.role).length} / {elements.length} éléments
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="svg-mapper-btn svg-mapper-btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="button" className="svg-mapper-btn svg-mapper-btn--primary" onClick={handleSaveAndInject}>
              💾 Valider et Injecter dans le Template
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
