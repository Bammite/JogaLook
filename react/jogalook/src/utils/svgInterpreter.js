/**
 * svgInterpreter.js
 *
 * Système d'interprétation sémantique des SVG de maillots exportés depuis Figma/Illustrator.
 * Ces SVG sont "anonymes" : leurs <path> n'ont pas d'id sémantique.
 *
 * Ce module analyse la géométrie (bounding box, centroïde, aire relative) de chaque élément
 * SVG pour en déduire le rôle (corps, manches, col, liseré, zone badge, zone flockage)
 * et injecte les bons id="jersey-body", id="jersey-sleeves", etc.
 *
 * Algorithme purement géométrique — aucune dépendance externe.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. PARSEUR SVG LÉGER (sans DOM natif ni DOMParser)
//    Analyse le SVG comme texte pour extraire les éléments graphiques.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrait le viewBox du SVG (width, height, minX, minY)
 */
function extractViewBox(svgString) {
  const vbMatch = svgString.match(/viewBox=[\"']\s*([\d.\-]+)\s+([\d.\-]+)\s+([\d.]+)\s+([\d.]+)\s*[\"']/i);
  if (vbMatch) {
    return {
      minX: parseFloat(vbMatch[1]) || 0,
      minY: parseFloat(vbMatch[2]) || 0,
      width: parseFloat(vbMatch[3]) || 300,
      height: parseFloat(vbMatch[4]) || 360,
    };
  }
  const wm = svgString.match(/\bwidth=[\"']([\d.]+)/i);
  const hm = svgString.match(/\bheight=[\"']([\d.]+)/i);
  return {
    minX: 0,
    minY: 0,
    width: wm ? parseFloat(wm[1]) : 300,
    height: hm ? parseFloat(hm[1]) : 360,
  };
}

/**
 * Extrait tous les éléments graphiques de premier niveau d'un SVG :
 * <path>, <rect>, <circle>, <polygon>, <text>, <g>
 * Retourne un tableau d'objets { tag, raw, attrs }
 */
function extractTopLevelElements(svgString) {
  // Extraire uniquement le contenu interne du <svg> (pas les <defs> ni <style>)
  const innerMatch = svgString.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/i);
  if (!innerMatch) return [];

  const inner = innerMatch[1];
  const elements = [];

  // Regex pour capturer les éléments de premier niveau (self-closing ou avec contenu)
  // On itère sur chaque tag et on extrait ses attributs
  const tagPattern = /<(path|rect|circle|ellipse|polygon|polyline|line|text|g)(\b[^>]*?)(\/?>)([\s\S]*?(?=<(?:path|rect|circle|ellipse|polygon|polyline|line|text|g)\b|<\/svg>)|)/gi;

  let match;
  while ((match = tagPattern.exec(inner)) !== null) {
    const tag = match[1].toLowerCase();
    const attrStr = match[2] || '';
    const selfClose = match[3] === '/>';
    const rawContent = selfClose ? '' : match[4] || '';

    const attrs = parseAttrs(attrStr);

    elements.push({
      tag,
      attrs,
      raw: match[0],
      selfClose,
      innerContent: rawContent,
      originalIndex: elements.length,
    });
  }

  return elements;
}

/**
 * Parse une chaîne d'attributs HTML/SVG en objet clé-valeur
 */
function parseAttrs(attrStr) {
  const attrs = {};
  const re = /(\w[\w\-]*)=[\"']([^\"']*)[\"']/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) {
    attrs[m[1]] = m[2];
  }
  // Récupérer aussi fill sans guillemets si présent
  const fillNoQuote = attrStr.match(/\bfill=([^\s>\"']+)/);
  if (fillNoQuote && !attrs.fill) {
    attrs.fill = fillNoQuote[1];
  }
  return attrs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CALCUL DE BOUNDING BOX APPROXIMATIF À PARTIR D'UN PATH "d"
//    Approximation rapide par analyse des commandes SVG Path
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrait tous les points numériques d'un path SVG "d" en respectant la grammaire
 * des commandes (H, V, M, L, C, S, Q, A, Z) pour éviter les décalages d'indices.
 * Retourne { minX, minY, maxX, maxY, cx, cy, area }
 */
function approximateBbox(pathD) {
  if (!pathD) return null;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let curX = 0, curY = 0;

  // Extraire commande par commande avec ses arguments numériques
  const cmdRegex = /([a-df-z])([^a-df-z]*)/gi;
  let match;

  while ((match = cmdRegex.exec(pathD)) !== null) {
    const cmd = match[1];
    const isRel = cmd === cmd.toLowerCase();
    const type = cmd.toUpperCase();
    const argStr = match[2];
    const numRe = /-?[\d]+\.?[\d]*(?:e[-+]?\d+)?/gi;
    const args = [];
    let nm;
    while ((nm = numRe.exec(argStr)) !== null) {
      args.push(parseFloat(nm[0]));
    }

    if (type === 'H') {
      for (let i = 0; i < args.length; i++) {
        curX = isRel ? curX + args[i] : args[i];
        if (curX < minX) minX = curX;
        if (curX > maxX) maxX = curX;
      }
    } else if (type === 'V') {
      for (let i = 0; i < args.length; i++) {
        curY = isRel ? curY + args[i] : args[i];
        if (curY < minY) minY = curY;
        if (curY > maxY) maxY = curY;
      }
    } else if (type === 'M' || type === 'L' || type === 'T') {
      for (let i = 0; i + 1 < args.length; i += 2) {
        curX = isRel ? curX + args[i] : args[i];
        curY = isRel ? curY + args[i + 1] : args[i + 1];
        if (curX < minX) minX = curX;
        if (curX > maxX) maxX = curX;
        if (curY < minY) minY = curY;
        if (curY > maxY) maxY = curY;
      }
    } else if (type === 'C') {
      for (let i = 0; i + 5 < args.length; i += 6) {
        const p1x = isRel ? curX + args[i] : args[i];
        const p1y = isRel ? curY + args[i + 1] : args[i + 1];
        const p2x = isRel ? curX + args[i + 2] : args[i + 2];
        const p2y = isRel ? curY + args[i + 3] : args[i + 3];
        curX = isRel ? curX + args[i + 4] : args[i + 4];
        curY = isRel ? curY + args[i + 5] : args[i + 5];
        minX = Math.min(minX, p1x, p2x, curX);
        maxX = Math.max(maxX, p1x, p2x, curX);
        minY = Math.min(minY, p1y, p2y, curY);
        maxY = Math.max(maxY, p1y, p2y, curY);
      }
    } else if (type === 'S' || type === 'Q') {
      for (let i = 0; i + 3 < args.length; i += 4) {
        const p1x = isRel ? curX + args[i] : args[i];
        const p1y = isRel ? curY + args[i + 1] : args[i + 1];
        curX = isRel ? curX + args[i + 2] : args[i + 2];
        curY = isRel ? curY + args[i + 3] : args[i + 3];
        minX = Math.min(minX, p1x, curX);
        maxX = Math.max(maxX, p1x, curX);
        minY = Math.min(minY, p1y, curY);
        maxY = Math.max(maxY, p1y, curY);
      }
    } else if (type === 'A') {
      for (let i = 0; i + 6 < args.length; i += 7) {
        curX = isRel ? curX + args[i + 5] : args[i + 5];
        curY = isRel ? curY + args[i + 6] : args[i + 6];
        if (curX < minX) minX = curX;
        if (curX > maxX) maxX = curX;
        if (curY < minY) minY = curY;
        if (curY > maxY) maxY = curY;
      }
    }
  }

  if (minX === Infinity || minY === Infinity) return null;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const area = Math.max(0, maxX - minX) * Math.max(0, maxY - minY);

  return { minX, minY, maxX, maxY, cx, cy, area };
}

/**
 * Bounding box pour un <rect>
 */
function rectBbox(attrs) {
  const x = parseFloat(attrs.x || 0);
  const y = parseFloat(attrs.y || 0);
  const w = parseFloat(attrs.width || 0);
  const h = parseFloat(attrs.height || 0);
  return {
    minX: x, minY: y, maxX: x + w, maxY: y + h,
    cx: x + w / 2, cy: y + h / 2, area: w * h,
  };
}

/**
 * Bounding box pour un <circle>
 */
function circleBbox(attrs) {
  const cx = parseFloat(attrs.cx || attrs.x || 0);
  const cy = parseFloat(attrs.cy || attrs.y || 0);
  const r = parseFloat(attrs.r || 0);
  return {
    minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r,
    cx, cy, area: Math.PI * r * r,
  };
}

/**
 * Bounding box pour un <polygon> ou <polyline>
 */
function polygonBbox(attrs) {
  const pts = (attrs.points || '').trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
  if (pts.length < 4) return null;
  const xs = [], ys = [];
  for (let i = 0; i + 1 < pts.length; i += 2) {
    xs.push(pts[i]);
    ys.push(pts[i + 1]);
  }
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, area: (maxX - minX) * (maxY - minY) };
}

/**
 * Calcule le bounding box selon le tag de l'élément
 */
function getBbox(el) {
  switch (el.tag) {
    case 'path': return approximateBbox(el.attrs.d);
    case 'rect': return rectBbox(el.attrs);
    case 'circle':
    case 'ellipse': return circleBbox(el.attrs);
    case 'polygon':
    case 'polyline': return polygonBbox(el.attrs);
    case 'text': {
      const x = parseFloat(el.attrs.x || 0);
      const y = parseFloat(el.attrs.y || 0);
      const fs = parseFloat(el.attrs['font-size'] || el.attrs.fontSize || 16);
      return { minX: x - 50, minY: y - fs, maxX: x + 50, maxY: y, cx: x, cy: y - fs / 2, area: 100 * fs };
    }
    case 'g': {
      // Pour un groupe, on prend le bbox global de son contenu
      const inner = el.innerContent || '';
      const childD = (inner.match(/d="([^"]*)"/g) || []).map(s => s.replace(/^d="/, '').replace(/"$/, '')).join(' ');
      return approximateBbox(childD);
    }
    default: return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CLASSIFICATEUR SÉMANTIQUE
//    Attribue un rôle à chaque élément selon sa géométrie relative dans le viewBox
// ─────────────────────────────────────────────────────────────────────────────

const ROLES = {
  BODY: 'jersey-body',
  SLEEVES: 'jersey-sleeves',
  COLLAR: 'jersey-collar',
  COLLAR_INNER: 'jersey-collar-inner',
  STRIPES: 'jersey-stripes',
  BADGE_ZONE: 'badge-zone',
  NAME_ZONE: 'name-zone',
  NUMBER_ZONE: 'number-zone',
  OUTLINE: 'jersey-outline',
  DECORATION: 'jersey-decoration',
  TEXT_EXISTING: 'jersey-existing-text',
  UNKNOWN: 'jersey-unknown',
};

/**
 * Classifie un élément SVG selon sa géométrie relative dans le viewBox.
 *
 * @param {object} el   - Élément SVG { tag, attrs, bbox }
 * @param {object} vb   - ViewBox { minX, minY, width, height }
 * @param {number} totalBodyArea - Aire approximative du viewBox
 * @param {number} index - Index de l'élément dans le SVG
 * @param {string} side  - 'front' | 'back'
 * @returns {string} Role from ROLES
 */
function classifyElement(el, vb, totalViewboxArea, index, side) {
  const bbox = el.bbox;
  if (!bbox) return ROLES.UNKNOWN;

  // Coordonnées relatives (0-1)
  const relCX = (bbox.cx - vb.minX) / vb.width;
  const relCY = (bbox.cy - vb.minY) / vb.height;
  const relArea = bbox.area / totalViewboxArea;

  // Largeur et hauteur relatives du bbox
  const relW = (bbox.maxX - bbox.minX) / vb.width;
  const relH = (bbox.maxY - bbox.minY) / vb.height;

  // Cas des éléments <text> déjà présents dans le SVG (comme HOKA, 11)
  if (el.tag === 'text') {
    // Texte en haut (premier tiers) → zone nom/sponsor
    if (relCY < 0.40) return ROLES.TEXT_EXISTING;
    // Texte en bas (dernier tiers) → zone numéro
    if (relCY >= 0.40) return ROLES.TEXT_EXISTING;
  }

  // Cas du <g> avec du texte (zone de flockage)
  if (el.tag === 'g') {
    const hasText = el.innerContent && el.innerContent.includes('<text');
    const hasPath = el.innerContent && el.innerContent.includes('<path');
    if (hasText && !hasPath) {
      if (relCY < 0.40) return ROLES.NAME_ZONE;
      return ROLES.NUMBER_ZONE;
    }
  }

  // ─── Règle 1 : Corps principal ─────────────────────────────────────────────
  // Le plus grand élément plein, centré horizontalement, occupe l'essentiel du viewBox
  if (relArea > 0.35 && relCX > 0.25 && relCX < 0.75) {
    return ROLES.BODY;
  }

  // ─── Règle 2 : Col (en haut, centré, petit) ───────────────────────────────
  if (relCY < 0.18 && relCX > 0.3 && relCX < 0.7 && relArea < 0.10) {
    // Le col peut être rempli (polo) ou juste un contour
    const fill = el.attrs.fill || '';
    const isOutline = fill === 'none' || fill === '' || el.attrs.stroke;
    if (isOutline) return ROLES.COLLAR;
    // Plus clair → intérieur du col
    return ROLES.COLLAR;
  }

  // ─── Règle 3 : Manches (zones latérales, au-dessus du milieu) ─────────────
  // Centroïde très à gauche (< 30%) ou très à droite (> 70%)
  if (relCY < 0.55 && relArea < 0.25) {
    if (relCX < 0.30) return ROLES.SLEEVES;
    if (relCX > 0.70) return ROLES.SLEEVES;
  }

  // ─── Règle 4 : Liseré/bande bas (en bas du maillot, large horizontalement) ─
  if (relCY > 0.87 && relW > 0.4) {
    return ROLES.STRIPES;
  }

  // ─── Règle 6 : Textes et numéros vectorisés (ex: HOKA ou 11 dessinés sous forme de <path>) ──
  if (side === 'back' && relCX > 0.25 && relCX < 0.75 && relArea < 0.25) {
    // Zone nom (haut du dos)
    if (relCY >= 0.18 && relCY <= 0.38) {
      return ROLES.TEXT_EXISTING;
    }
    // Zone numéro (milieu du dos)
    if (relCY > 0.38 && relCY <= 0.75) {
      return ROLES.TEXT_EXISTING;
    }
  }

  // ─── Règle 7 : Zone Badge (petite zone sur la poitrine gauche, face) ───────
  if (side === 'front' && relCY > 0.15 && relCY < 0.40 && relCX < 0.45 && relArea < 0.05) {
    return ROLES.BADGE_ZONE;
  }

  // ─── Règle 8 : Col intérieur (juste sous le col, plus clair) ─────────────
  if (relCY < 0.20 && relCX > 0.3 && relCX < 0.7 && relArea < 0.05) {
    return ROLES.COLLAR_INNER;
  }

  // ─── Règle 9 : Décoration générale ────────────────────────────────────────
  return ROLES.DECORATION;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. REWRITER SVG — Injection des IDs sémantiques
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère un id unique pour un rôle donné (gère les doublons : sleeves-left, sleeves-right, etc.)
 */
function buildSemanticId(role, seen, cx, vbMidX) {
  const count = (seen[role] || 0);
  seen[role] = count + 1;

  // Pour les manches, on distingue gauche/droite
  if (role === ROLES.SLEEVES) {
    return cx < vbMidX ? 'jersey-sleeves-left' : 'jersey-sleeves-right';
  }

  // Pour col et autres avec doublons, on suffixe
  if (count > 0) {
    return `${role}-${count + 1}`;
  }

  return role;
}

/**
 * Construit un attribut d'ouverture <tag ... id="..." class="..."> enrichi
 */
function buildOpenTag(el, semanticId, originalColor) {
  const { tag, attrs } = el;

  // Construire les attrs enrichis
  const enrichedAttrs = { ...attrs };
  enrichedAttrs.id = semanticId;
  enrichedAttrs.class = `jersey-layer ${semanticId}`;

  // Stocker la couleur d'origine comme data-attribute pour référence
  if (originalColor) {
    enrichedAttrs['data-original-fill'] = originalColor;
  }

  // Sérialiser les attrs
  const attrStr = Object.entries(enrichedAttrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  return `<${tag} ${attrStr}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FONCTION PRINCIPALE D'INTERPRÉTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Détecte si un SVG a déjà des IDs sémantiques (jersey-body, jersey-collar, etc.)
 */
export function hasSvgSemanticIds(svgString) {
  if (!svgString) return false;
  return (
    svgString.includes('id="jersey-body"') ||
    svgString.includes("id='jersey-body'") ||
    svgString.includes('id="jersey-collar"') ||
    svgString.includes('id="badge-zone"') ||
    svgString.includes('id="name-zone"') ||
    svgString.includes('id="number-zone"')
  );
}

/**
 * Interprète un SVG "anonyme" (sans IDs sémantiques) et retourne un SVG enrichi
 * avec les IDs sémantiques nécessaires au moteur de rendu.
 *
 * @param {string} svgString - Le code SVG brut
 * @param {string} side      - 'front' | 'back'
 * @returns {{ enrichedSvg: string, analysis: object }} SVG enrichi + rapport d'analyse
 */
export function interpretSvg(svgString, side = 'front') {
  if (!svgString || !svgString.includes('<svg')) {
    return { enrichedSvg: svgString, analysis: { elements: [], side, interpreted: false } };
  }

  const vb = extractViewBox(svgString);
  const totalViewboxArea = vb.width * vb.height;
  const vbMidX = vb.minX + vb.width / 2;

  // Extraire les éléments graphiques
  const elements = extractTopLevelElements(svgString);

  // Calculer le bbox de chaque élément
  const analysed = elements.map((el, i) => ({
    ...el,
    bbox: getBbox(el),
  }));

  // Trier par aire décroissante pour classifier d'abord les grands éléments
  // (le corps est forcément le plus grand)
  const sorted = [...analysed].sort((a, b) => {
    const aArea = a.bbox?.area || 0;
    const bArea = b.bbox?.area || 0;
    return bArea - aArea;
  });

  // Classifier chaque élément
  const seenRoles = {};
  sorted.forEach((el, i) => {
    el.role = classifyElement(el, vb, totalViewboxArea, i, side);
    // Assigner l'ID sémantique en tenant compte de la position cx
    el.semanticId = buildSemanticId(el.role, seenRoles, el.bbox?.cx || 0, vbMidX);
  });

  // Remettre dans l'ordre original
  const finalElements = analysed.map(orig => {
    const classified = sorted.find(s => s.originalIndex === orig.originalIndex);
    return { ...orig, role: classified?.role, semanticId: classified?.semanticId };
  });

  // Regrouper les éléments par rôle pour construire une analyse
  const analysis = {
    side,
    vb,
    interpreted: true,
    elementCount: finalElements.length,
    roleMap: finalElements.reduce((acc, el) => {
      const r = el.role || ROLES.UNKNOWN;
      if (!acc[r]) acc[r] = [];
      acc[r].push({ index: el.originalIndex, tag: el.tag, semanticId: el.semanticId, originalFill: el.attrs.fill });
      return acc;
    }, {}),
  };

  // ─── RÉÉCRITURE DU SVG ─────────────────────────────────────────────────────
  // Stratégie : on reconstruit le SVG en remplaçant chaque élément raw par son
  // équivalent enrichi (avec id, class, data-original-fill).
  // Les <defs> et <style> sont conservés intacts.

  let enrichedSvg = svgString;

  // Traiter les éléments en ordre inverse pour préserver les offsets de chaîne
  const toReplace = [...finalElements]
    .filter(el => el.role && el.semanticId && el.raw)
    .reverse();

  for (const el of toReplace) {
    if (!el.raw) continue;

    const originalFill = el.attrs?.fill;
    const openTag = buildOpenTag(el, el.semanticId, originalFill);

    let newRaw;
    if (el.selfClose) {
      newRaw = openTag + '/>';
    } else {
      newRaw = openTag + '>' + (el.innerContent || '') + `</${el.tag}>`;
    }

    // Remplacement de la première occurrence du raw original
    enrichedSvg = enrichedSvg.replace(el.raw, newRaw);
  }

  // ─── REGROUPEMENT SÉMANTIQUE ────────────────────────────────────────────────
  // Grouper les manches (gauche + droite) dans un seul <g id="jersey-sleeves">
  // pour que le moteur CSS #jersey-sleeves path { stroke: ... } fonctionne.
  enrichedSvg = groupSemanticLayers(enrichedSvg, side);

  // ─── ZONES FLOCKAGE (DOS) ──────────────────────────────────────────────────
  // Sur le dos, si pas encore de zones name-zone / number-zone, les ajouter
  // et masquer les textes existants du SVG original
  if (side === 'back') {
    enrichedSvg = injectFlockageZones(enrichedSvg, vb, analysis);
  }

  // ─── ZONE BADGE (FACE) ─────────────────────────────────────────────────────
  if (side === 'front') {
    enrichedSvg = injectBadgeZone(enrichedSvg, analysis);
  }

  return { enrichedSvg, analysis };
}

/**
 * Regroupe les éléments de même rôle dans des <g id="..."> sémantiques.
 * Cela permet au moteur CSS de cibler : #jersey-sleeves path { stroke: ... }
 */
function groupSemanticLayers(svgString, side) {
  // Regrouper les manches gauche + droite dans #jersey-sleeves
  // On cherche les éléments id="jersey-sleeves-left" et id="jersey-sleeves-right"
  // et on les enveloppe dans un <g id="jersey-sleeves">

  let result = svgString;

  // Regex pour les éléments avec id commençant par jersey-sleeves
  const leftPattern = /(<(?:path|g|rect|polygon|circle)[^>]*id="jersey-sleeves-left"[^>]*\/?>(?:[\s\S]*?<\/(?:path|g|rect|polygon|circle)>)?)/i;
  const rightPattern = /(<(?:path|g|rect|polygon|circle)[^>]*id="jersey-sleeves-right"[^>]*\/?>(?:[\s\S]*?<\/(?:path|g|rect|polygon|circle)>)?)/i;

  const leftMatch = result.match(leftPattern);
  const rightMatch = result.match(rightPattern);

  if (leftMatch && rightMatch && !result.includes('id="jersey-sleeves"')) {
    // Envelopper les deux dans un groupe
    result = result.replace(leftMatch[0], `__LEFT_SLEEVE__`);
    result = result.replace(rightMatch[0], `__RIGHT_SLEEVE__`);

    const sleeveGroup = `<g id="jersey-sleeves">\n  ${leftMatch[0]}\n  ${rightMatch[0]}\n</g>`;
    result = result.replace('__LEFT_SLEEVE__', sleeveGroup);
    result = result.replace('__RIGHT_SLEEVE__', '');
  } else if (leftMatch && !rightMatch && !result.includes('id="jersey-sleeves"')) {
    // Un seul élément sleeve trouvé — le renommer
    result = result.replace(
      /id="jersey-sleeves-left"/,
      'id="jersey-sleeves"'
    );
  }

  return result;
}

/**
 * Sur le dos : masque les textes SVG existants (nom/numéro en dur)
 * et injecte des zones <g id="name-zone"> et <g id="number-zone"> vides.
 */
function injectFlockageZones(svgString, vb, analysis) {
  let result = svgString;

  const hasNameZone = result.includes('id="name-zone"');
  const hasNumberZone = result.includes('id="number-zone"');

  // Masquer les textes existants marqués comme jersey-existing-text
  // (qui avaient ROLES.TEXT_EXISTING)
  result = result.replace(
    /(id="jersey-existing-text[^"]*"[^>]*>)([\s\S]*?)(<\/text>)/gi,
    '$1<!-- hidden by interpreter -->$3'
  );

  // Masquer aussi les textes dans des groupes existants
  const existingTextItems = analysis.roleMap?.[ROLES.TEXT_EXISTING] || [];
  existingTextItems.forEach(item => {
    if (item.semanticId) {
      result = result.replace(
        new RegExp(`(<[^>]*id="${item.semanticId}"[^>]*>)([\\s\\S]*?)(<\\/text>)`, 'i'),
        '$1<!-- hidden -->'
      );
    }
  });

  const cx = Math.round(vb.minX + vb.width / 2);

  // Injecter name-zone si absent
  if (!hasNameZone) {
    const nameY = Math.round(vb.minY + vb.height * 0.30);
    const nameZoneTag = `\n<g id="name-zone"></g>`;
    result = result.replace(/<\/svg>/i, `${nameZoneTag}\n</svg>`);
  }

  // Injecter number-zone si absent
  if (!hasNumberZone) {
    const numberZoneTag = `\n<g id="number-zone"></g>`;
    result = result.replace(/<\/svg>/i, `${numberZoneTag}\n</svg>`);
  }

  return result;
}

/**
 * Sur la face : injecte <g id="badge-zone"></g> vide si absent.
 */
function injectBadgeZone(svgString, analysis) {
  let result = svgString;
  if (!result.includes('id="badge-zone"')) {
    result = result.replace(/<\/svg>/i, `\n<g id="badge-zone"></g>\n</svg>`);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. EXTRACTION DES COULEURS D'ORIGINE
//    Permet d'initialiser les sliders de customisation avec les bonnes teintes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrait la palette de couleurs d'origine d'un SVG interprété.
 * Retourne { bodyColor, sleevesColor, collarColor, stripesColor }
 */
export function extractOriginalColors(analysis) {
  const colors = {
    bodyColor: null,
    sleevesColor: null,
    collarColor: null,
    stripesColor: null,
  };

  const { roleMap } = analysis;
  if (!roleMap) return colors;

  // Corps
  const bodyItems = roleMap[ROLES.BODY] || [];
  if (bodyItems.length > 0) {
    colors.bodyColor = normalizeColor(bodyItems[0].originalFill);
  }

  // Manches (prendre la première manche trouvée)
  const sleeveItems = [
    ...(roleMap['jersey-sleeves-left'] || roleMap[ROLES.SLEEVES] || []),
  ];
  if (sleeveItems.length > 0) {
    colors.sleevesColor = normalizeColor(sleeveItems[0].originalFill);
  }

  // Col
  const collarItems = roleMap[ROLES.COLLAR] || [];
  if (collarItems.length > 0) {
    colors.collarColor = normalizeColor(collarItems[0].originalFill);
  }

  // Liseré/Bandes
  const stripesItems = roleMap[ROLES.STRIPES] || [];
  if (stripesItems.length > 0) {
    colors.stripesColor = normalizeColor(stripesItems[0].originalFill);
  }

  return colors;
}

/**
 * Normalise une couleur SVG (#hex, rgb, name) en hex.
 * Retourne la couleur d'entrée si déjà en hex, sinon null.
 */
function normalizeColor(color) {
  if (!color) return null;
  if (color.startsWith('#')) return color;
  // Couleurs nommées communes
  const namedColors = {
    white: '#ffffff', black: '#000000', red: '#ff0000',
    blue: '#0000ff', green: '#008000', none: null,
  };
  if (namedColors[color.toLowerCase()] !== undefined) {
    return namedColors[color.toLowerCase()];
  }
  return color;
}
