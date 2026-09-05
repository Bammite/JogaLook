/**
 * svgUtils.js
 * Utilitaires pour le redimensionnement responsive, la normalisation
 * et le calcul dynamique des coordonnées (blasons, flockages) selon le viewBox réel des SVG.
 */

import { interpretSvg, hasSvgSemanticIds, extractOriginalColors } from './svgInterpreter.js';

/**
 * Point d'entrée unique pour préparer un SVG à l'édition.
 * - Si le SVG a déjà des IDs sémantiques → normalise simplement pour l'affichage.
 * - Si le SVG est "anonyme" (exporté Figma/Illustrator sans IDs) → l'interprète,
 *   injecte les IDs sémantiques, puis normalise.
 *
 * @param {string} rawSvg - SVG brut
 * @param {'front'|'back'} side - Face du maillot
 * @returns {{ svg: string, colors: object, wasInterpreted: boolean, analysis: object }}
 */
export function prepareTemplateForEditing(rawSvg, side = 'front') {
  if (!rawSvg || !rawSvg.includes('<svg')) {
    return { svg: rawSvg || '', colors: {}, wasInterpreted: false, analysis: null };
  }

  let workingSvg = rawSvg;
  let colors = {};
  let wasInterpreted = false;
  let analysis = null;

  // ── Étape 1 : Interprétation sémantique si nécessaire ────────────────────
  if (!hasSvgSemanticIds(workingSvg)) {
    const result = interpretSvg(workingSvg, side);
    workingSvg = result.enrichedSvg;
    analysis = result.analysis;
    wasInterpreted = result.analysis?.interpreted || false;

    // Extraire les couleurs d'origine pour initialiser les contrôles
    if (analysis) {
      colors = extractOriginalColors(analysis);
    }
  }

  // ── Étape 2 : Normalisation responsive ───────────────────────────────────
  const normalizedSvg = normalizeSvgForDisplay(workingSvg);

  return { svg: normalizedSvg, colors, wasInterpreted, analysis };
}

/**
 * Extrait le viewBox d'une chaîne SVG ou le calcule depuis width/height
 */
export function parseSvgViewBox(svgString) {
  if (!svgString || typeof svgString !== 'string') {
    return { minX: 0, minY: 0, width: 300, height: 360 };
  }

  // 1. Chercher l'attribut viewBox="..."
  const vbMatch = svgString.match(/viewBox=["']\s*([0-9.\-]+)\s+([0-9.\-]+)\s+([0-9.]+)\s+([0-9.]+)\s*["']/i);
  if (vbMatch) {
    const minX = parseFloat(vbMatch[1]) || 0;
    const minY = parseFloat(vbMatch[2]) || 0;
    const width = parseFloat(vbMatch[3]) || 300;
    const height = parseFloat(vbMatch[4]) || 360;
    return { minX, minY, width, height };
  }

  // 2. Si pas de viewBox, chercher width="..." et height="..."
  const wMatch = svgString.match(/\bwidth=["']([0-9.]+)(?:px)?["']/i);
  const hMatch = svgString.match(/\bheight=["']([0-9.]+)(?:px)?["']/i);
  if (wMatch && hMatch) {
    const width = parseFloat(wMatch[1]) || 300;
    const height = parseFloat(hMatch[1]) || 360;
    return { minX: 0, minY: 0, width, height };
  }

  return { minX: 0, minY: 0, width: 300, height: 360 };
}

/**
 * Normalise un SVG brut pour qu'il s'adapte à 100% de son conteneur parent
 * sans déborder et sans distorsion d'aspect.
 */
export function normalizeSvgForDisplay(rawSvg) {
  if (!rawSvg || typeof rawSvg !== 'string') return '';
  let svg = rawSvg.trim();
  if (!svg.includes('<svg')) return rawSvg;

  const vb = parseSvgViewBox(svg);
  const viewBoxStr = `${vb.minX} ${vb.minY} ${vb.width} ${vb.height}`;

  // Réécrire la balise ouvrante <svg ...>
  svg = svg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
    let cleanAttrs = attrs
      .replace(/\bwidth=["'][^"']+["']/gi, '')
      .replace(/\bheight=["'][^"']+["']/gi, '')
      .replace(/\bviewBox=["'][^"']+["']/gi, '')
      .replace(/\bpreserveAspectRatio=["'][^"']+["']/gi, '')
      .trim();

    return `<svg width="100%" height="100%" viewBox="${viewBoxStr}" preserveAspectRatio="xMidYMid meet" ${cleanAttrs}>`;
  });

  return svg;
}

/**
 * Calcule les coordonnées proportionnelles et le sizing du Blason et du Flockage
 * adaptées à la taille et au viewBox du SVG en cours d'édition.
 */
export function calculateDynamicPlacements(rawSvg, options = {}) {
  const {
    badgePosition = 'left', // 'left' | 'center' | 'right'
    badgeSize = 'medium'     // 'small' | 'medium' | 'large'
  } = options;

  const vb = parseSvgViewBox(rawSvg);

  // Échelle relative par rapport à un maillot de référence 300x360
  const scaleX = vb.width / 300;
  const scaleY = vb.height / 360;
  const scale = (scaleX + scaleY) / 2;

  const centerX = vb.minX + vb.width * 0.5;

  // ── BLASON (Face Avant) ──
  // Hauteur poitrine : environ 27% depuis le haut du maillot
  const badgeChestY = vb.minY + vb.height * 0.27;

  // Taille du badge selon le paramètre
  const badgeBaseSizes = { small: 30, medium: 42, large: 56 };
  const badgeSideLen = (badgeBaseSizes[badgeSize] || 42) * scale;

  let badgeCenterX = centerX;
  if (badgePosition === 'left') {
    // Poitrine gauche (côté cœur de la personne portant le maillot, droite vue de face ou gauche selon convention)
    // Traditionnellement sur les maillots : le blason du club est à gauche vue de face (côté droit de l'image = sponsor/marque, côté gauche = blason)
    badgeCenterX = vb.minX + vb.width * 0.35;
  } else if (badgePosition === 'right') {
    badgeCenterX = vb.minX + vb.width * 0.65;
  } else {
    badgeCenterX = centerX;
  }

  const badgeCoords = {
    x: Math.round(badgeCenterX - badgeSideLen / 2),
    y: Math.round(badgeChestY - badgeSideLen / 2),
    width: Math.round(badgeSideLen),
    height: Math.round(badgeSideLen)
  };

  // ── FLOCKAGE NOM & NUMÉRO (Dos) ──
  const flockingCoords = {
    centerX: Math.round(centerX),
    nameY: Math.round(vb.minY + vb.height * 0.30),
    nameFontSize: Math.max(16, Math.round(22 * scale)),
    numberY: Math.round(vb.minY + vb.height * 0.63),
    numberFontSize: Math.max(60, Math.round(92 * scale))
  };

  return {
    viewBox: vb,
    badgeCoords,
    flockingCoords
  };
}
