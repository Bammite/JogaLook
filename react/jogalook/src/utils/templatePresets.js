/**
 * PRESETS ET DÉFINITIONS DES TEMPLATES DE MAILLOTS JOGALOOK
 * Exploitation des calques SVG, variables CSS (--jersey-base, --jersey-accent, etc.)
 */

// Import des SVG locaux réels via Vite (traités comme des chaînes brutes)
import faceBlanc from '../assets/tamplate/maillot/blanc/face.svg?raw';
import dosBlanc from '../assets/tamplate/maillot/blanc/dos.svg?raw';

export const MOCK_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Maillot Domicile Classic (Rayures)',
    description: 'Design classique à rayures verticales bicolores et finitions brodées.',
    is_free: true,
    price: 49.99,
    usage_count: 142,
    baseColor: '#e63946',
    accentColor: '#1d3557',
    pattern: 'stripes',
    collar: 'round',
    defaultName: 'MBAPPÉ',
    defaultNumber: '10',
    editable_elements: { body: true, collar: true, sleeves: true, stripes: true, badge: true, name_zone: true, number_zone: true },
    layers_config: { body_id: 'jersey-body', collar_id: 'jersey-collar', sleeves_id: 'jersey-sleeves', stripes_id: 'jersey-stripes', badge_zone_id: 'badge-zone', name_zone_id: 'name-zone', number_zone_id: 'number-zone' },
    svg_front: `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-tpl-1" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <!-- Corps Principal -->
      <path id="jersey-body" d="M60 40 L100 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L70 340 L70 110 L60 140 L20 120 Z" fill="var(--jersey-base, #e63946)" stroke="#0f172a" stroke-width="2.5" filter="url(#shadow-tpl-1)"/>
      <!-- Rayures Verticales -->
      <g id="jersey-stripes">
        <rect x="95" y="20" width="22" height="320" fill="var(--jersey-accent, #1d3557)"/>
        <rect x="139" y="20" width="22" height="320" fill="var(--jersey-accent, #1d3557)"/>
        <rect x="183" y="20" width="22" height="320" fill="var(--jersey-accent, #1d3557)"/>
      </g>
      <!-- Col Rond -->
      <path id="jersey-collar" d="M120 20 Q150 50 180 20" fill="none" stroke="#ffffff" stroke-width="8"/>
      <!-- Bordures Manches -->
      <g id="jersey-sleeves">
        <path d="M20 120 L60 140" stroke="#ffffff" stroke-width="6"/>
        <path d="M280 120 L240 140" stroke="#ffffff" stroke-width="6"/>
      </g>
      <line x1="70" y1="337" x2="230" y2="337" stroke="#ffffff" stroke-width="6"/>
      <!-- Blason -->
      <g id="badge-zone">
        <circle cx="108" cy="94" r="14" fill="#ffd700"/>
      </g>
      <!-- Sponsor -->
      <text x="150" y="190" text-anchor="middle" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="22" font-weight="bold" letter-spacing="3">JOGALOOK</text>
    </svg>`,
    svg_back: `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-tpl-1-b" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <!-- Corps Dos -->
      <path id="jersey-body-back" d="M60 40 L100 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L70 340 L70 110 L60 140 L20 120 Z" fill="var(--jersey-base, #e63946)" stroke="#0f172a" stroke-width="2.5" filter="url(#shadow-tpl-1-b)"/>
      <g id="jersey-stripes-back">
        <rect x="95" y="20" width="22" height="320" fill="var(--jersey-accent, #1d3557)"/>
        <rect x="139" y="20" width="22" height="320" fill="var(--jersey-accent, #1d3557)"/>
        <rect x="183" y="20" width="22" height="320" fill="var(--jersey-accent, #1d3557)"/>
      </g>
      <path id="jersey-collar-back" d="M120 20 Q150 35 180 20" fill="none" stroke="#ffffff" stroke-width="8"/>
      <!-- Flockage Nom -->
      <g id="name-zone">
        <text x="150" y="110" text-anchor="middle" fill="var(--jersey-text, #ffffff)" font-family="var(--jersey-font, 'Impact', sans-serif)" font-size="22" font-weight="bold" letter-spacing="4">MBAPPÉ</text>
      </g>
      <!-- Flockage Numéro -->
      <g id="number-zone">
        <text x="150" y="230" text-anchor="middle" fill="var(--jersey-text, #ffffff)" font-family="var(--jersey-font, 'Impact', sans-serif)" font-size="90" font-weight="900">10</text>
      </g>
    </svg>`
  },

  {
    id: 'tpl-2',
    name: 'Maillot Extérieur Gradient (Dégradé)',
    description: 'Style futuriste avec dégradé fluide dynamique et col contrasté en V.',
    is_free: true,
    price: 49.99,
    usage_count: 98,
    baseColor: '#1d3557',
    accentColor: '#457b9d',
    pattern: 'gradient',
    collar: 'vneck',
    defaultName: 'BINETOU',
    defaultNumber: '07',
    editable_elements: { body: true, collar: true, sleeves: true, stripes: false, badge: true, name_zone: true, number_zone: true },
    layers_config: { body_id: 'jersey-body', collar_id: 'jersey-collar', sleeves_id: 'jersey-sleeves', stripes_id: 'jersey-stripes', badge_zone_id: 'badge-zone', name_zone_id: 'name-zone', number_zone_id: 'number-zone' },
    svg_front: `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-tpl-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--jersey-base, #1d3557)"/>
          <stop offset="100%" stop-color="var(--jersey-accent, #457b9d)"/>
        </linearGradient>
        <filter id="shadow-tpl-2" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <!-- Corps Dégradé -->
      <path id="jersey-body" d="M60 40 L100 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L70 340 L70 110 L60 140 L20 120 Z" fill="url(#grad-tpl-2)" stroke="#0f172a" stroke-width="2.5" filter="url(#shadow-tpl-2)"/>
      <!-- Col V -->
      <path id="jersey-collar" d="M120 20 L150 60 L180 20" fill="none" stroke="#f4a261" stroke-width="8"/>
      <!-- Bordures Manches -->
      <g id="jersey-sleeves">
        <path d="M20 120 L60 140" stroke="#f4a261" stroke-width="6"/>
        <path d="M280 120 L240 140" stroke="#f4a261" stroke-width="6"/>
      </g>
      <!-- Blason -->
      <g id="badge-zone">
        <circle cx="108" cy="94" r="14" fill="#f4a261"/>
      </g>
      <!-- Sponsor -->
      <text x="150" y="190" text-anchor="middle" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="22" font-weight="bold" letter-spacing="3">JOGALOOK</text>
    </svg>`,
    svg_back: `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-tpl-2-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--jersey-base, #1d3557)"/>
          <stop offset="100%" stop-color="var(--jersey-accent, #457b9d)"/>
        </linearGradient>
        <filter id="shadow-tpl-2-b" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <path id="jersey-body-back" d="M60 40 L100 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L70 340 L70 110 L60 140 L20 120 Z" fill="url(#grad-tpl-2-b)" stroke="#0f172a" stroke-width="2.5" filter="url(#shadow-tpl-2-b)"/>
      <path id="jersey-collar-back" d="M120 20 L150 45 L180 20" fill="none" stroke="#f4a261" stroke-width="8"/>
      <!-- Flockage Nom -->
      <g id="name-zone">
        <text x="150" y="110" text-anchor="middle" fill="var(--jersey-text, #ffffff)" font-family="var(--jersey-font, 'Impact', sans-serif)" font-size="22" font-weight="bold" letter-spacing="4">BINETOU</text>
      </g>
      <!-- Flockage Numéro -->
      <g id="number-zone">
        <text x="150" y="230" text-anchor="middle" fill="var(--jersey-text, #ffffff)" font-family="var(--jersey-font, 'Impact', sans-serif)" font-size="90" font-weight="900">07</text>
      </g>
    </svg>`
  },

  {
    id: 'tpl-3',
    name: 'Maillot Édition Spéciale Slash (Diagonale)',
    description: 'Bande diagonale audacieuse apportant du dynamisme et du charisme sur le terrain.',
    is_free: false,
    price: 54.99,
    usage_count: 215,
    baseColor: '#111111',
    accentColor: '#e63946',
    pattern: 'half',
    collar: 'round',
    defaultName: 'GEORGE',
    defaultNumber: '09',
    editable_elements: { body: true, collar: true, sleeves: true, stripes: true, badge: true, name_zone: true, number_zone: true },
    layers_config: { body_id: 'jersey-body', collar_id: 'jersey-collar', sleeves_id: 'jersey-sleeves', stripes_id: 'jersey-stripes', badge_zone_id: 'badge-zone', name_zone_id: 'name-zone', number_zone_id: 'number-zone' },
    svg_front: `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-tpl-3" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <!-- Corps Noir -->
      <path id="jersey-body" d="M60 40 L100 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L70 340 L70 110 L60 140 L20 120 Z" fill="var(--jersey-base, #111111)" stroke="#0f172a" stroke-width="2.5" filter="url(#shadow-tpl-3)"/>
      <!-- Bande Diagonale Slash -->
      <g id="jersey-stripes">
        <polygon points="70,100 230,220 230,260 70,140" fill="var(--jersey-accent, #e63946)"/>
      </g>
      <!-- Col Rond Rouge -->
      <path id="jersey-collar" d="M120 20 Q150 50 180 20" fill="none" stroke="var(--jersey-accent, #e63946)" stroke-width="8"/>
      <!-- Bordures Manches -->
      <g id="jersey-sleeves">
        <path d="M20 120 L60 140" stroke="var(--jersey-accent, #e63946)" stroke-width="6"/>
        <path d="M280 120 L240 140" stroke="var(--jersey-accent, #e63946)" stroke-width="6"/>
      </g>
      <!-- Blason -->
      <g id="badge-zone">
        <circle cx="108" cy="94" r="14" fill="var(--jersey-accent, #e63946)"/>
      </g>
      <!-- Sponsor -->
      <text x="150" y="190" text-anchor="middle" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="22" font-weight="bold" letter-spacing="3">JOGALOOK</text>
    </svg>`,
    svg_back: `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-tpl-3-b" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <path id="jersey-body-back" d="M60 40 L100 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L70 340 L70 110 L60 140 L20 120 Z" fill="var(--jersey-base, #111111)" stroke="#0f172a" stroke-width="2.5" filter="url(#shadow-tpl-3-b)"/>
      <g id="jersey-stripes-back">
        <polygon points="70,100 230,220 230,260 70,140" fill="var(--jersey-accent, #e63946)"/>
      </g>
      <path id="jersey-collar-back" d="M120 20 Q150 35 180 20" fill="none" stroke="var(--jersey-accent, #e63946)" stroke-width="8"/>
      <!-- Flockage Nom -->
      <g id="name-zone">
        <text x="150" y="110" text-anchor="middle" fill="var(--jersey-text, #ffffff)" font-family="var(--jersey-font, 'Impact', sans-serif)" font-size="22" font-weight="bold" letter-spacing="4">GEORGE</text>
      </g>
      <!-- Flockage Numéro -->
      <g id="number-zone">
        <text x="150" y="230" text-anchor="middle" fill="var(--jersey-text, #ffffff)" font-family="var(--jersey-font, 'Impact', sans-serif)" font-size="90" font-weight="900">09</text>
      </g>
    </svg>`
  },

  {
    id: 'tpl-4',
    name: 'Maillot Duo Bicolore (Deux Moitiés)',
    description: 'Découpe bicolore moderne et équilibrée inspirée des grands clubs européens.',
    is_free: true,
    price: 49.99,
    usage_count: 76,
    baseColor: '#2a9d8f',
    accentColor: '#e9c46a',
    pattern: 'half',
    collar: 'polo',
    defaultName: 'LUCAS',
    defaultNumber: '11',
    editable_elements: { body: true, collar: true, sleeves: true, stripes: false, badge: true, name_zone: true, number_zone: true },
    layers_config: { body_id: 'jersey-body', collar_id: 'jersey-collar', sleeves_id: 'jersey-sleeves', stripes_id: 'jersey-stripes', badge_zone_id: 'badge-zone', name_zone_id: 'name-zone', number_zone_id: 'number-zone' },
    svg_front: `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-tpl-4" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <!-- Moitié Gauche -->
      <path d="M60 40 L100 20 L150 20 L150 340 L70 340 L70 110 L60 140 L20 120 Z" fill="var(--jersey-base, #2a9d8f)" stroke="#0f172a" stroke-width="2.5" filter="url(#shadow-tpl-4)"/>
      <!-- Moitié Droite -->
      <path d="M150 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L150 340 Z" fill="var(--jersey-accent, #e9c46a)" stroke="#0f172a" stroke-width="2.5" filter="url(#shadow-tpl-4)"/>
      <!-- Col Polo Noir -->
      <path id="jersey-collar" d="M110 20 L150 70 L190 20 L170 20 L150 50 L130 20 Z" fill="#111111"/>
      <!-- Blason -->
      <g id="badge-zone">
        <circle cx="108" cy="94" r="14" fill="#111111"/>
      </g>
      <!-- Sponsor -->
      <text x="150" y="190" text-anchor="middle" fill="#111111" font-family="Impact, Arial Black, sans-serif" font-size="22" font-weight="bold" letter-spacing="3">JOGALOOK</text>
    </svg>`,
    svg_back: `<svg viewBox="0 0 300 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-tpl-4-b" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <!-- Moitié Gauche Dos -->
      <path d="M60 40 L100 20 L150 20 L150 340 L70 340 L70 110 L60 140 L20 120 Z" fill="var(--jersey-base, #2a9d8f)" stroke="#0f172a" stroke-width="2.5" filter="url(#shadow-tpl-4-b)"/>
      <!-- Moitié Droite Dos -->
      <path d="M150 20 L200 20 L240 40 L280 120 L240 140 L230 110 L230 340 L150 340 Z" fill="var(--jersey-accent, #e9c46a)" stroke="#0f172a" stroke-width="2.5" filter="url(#shadow-tpl-4-b)"/>
      <path id="jersey-collar-back" d="M110 20 L150 45 L190 20 Z" fill="#111111"/>
      <!-- Flockage Nom -->
      <g id="name-zone">
        <text x="150" y="110" text-anchor="middle" fill="var(--jersey-text, #111111)" font-family="var(--jersey-font, 'Impact', sans-serif)" font-size="22" font-weight="bold" letter-spacing="4">LUCAS</text>
      </g>
      <!-- Flockage Numéro -->
      <g id="number-zone">
        <text x="150" y="230" text-anchor="middle" fill="var(--jersey-text, #111111)" font-family="var(--jersey-font, 'Impact', sans-serif)" font-size="90" font-weight="900">11</text>
      </g>
    </svg>`
  },

  // ── TEMPLATE RÉEL — SVG IMPORTÉ DEPUIS LES ASSETS (interprétation automatique) ──
  {
    id: 'tpl-blanc-001',
    name: 'Maillot Blanc Épuré (Pro)',
    description: 'Template professionnel haute fidélité. Corps en blanc cassé, col contrasté, manches sombres. Entièrement personnalisable grâce au moteur d\'interprétation SVG.',
    is_free: true,
    price: 49.99,
    usage_count: 0,
    // Couleurs de base extraites visuellement depuis le SVG réel
    baseColor: '#E9EDF0',
    accentColor: '#252626',
    collarColor: '#262727',
    sleevesColor: '#252626',
    stripesColor: '#252626',
    pattern: 'solid',
    collar: 'round',
    defaultName: '',
    defaultNumber: '',
    // Interprétation automatique activée : pas besoin d'IDs dans le SVG source
    requires_interpretation: true,
    editable_elements: {
      body: true,
      collar: true,
      sleeves: true,
      stripes: true,
      badge: true,
      name_zone: true,
      number_zone: true
    },
    // layers_config sera déduit automatiquement par l'interpréteur SVG
    layers_config: {
      body_id: 'jersey-body',
      collar_id: 'jersey-collar',
      sleeves_id: 'jersey-sleeves',
      stripes_id: 'jersey-stripes',
      badge_zone_id: 'badge-zone',
      name_zone_id: 'name-zone',
      number_zone_id: 'number-zone'
    },
    // SVG réels importés depuis les assets (517×543 face, 517×539 dos)
    svg_front: faceBlanc,
    svg_back: dosBlanc,
  },

  // ── TEMPLATE PHOTO / MOCKUP RÉALISTE (FLOCKAGE DYNAMIQUE DOS) ──
  {
    id: 'tpl-mockup-001',
    name: 'Maillot Pro Black Edition (Photo HD)',
    description: 'Modèle haute définition en tissu aéré réaliste. Personnalisez directement le flocage officiel du nom et du numéro au dos par-dessus la photo.',
    template_type: 'MOCKUP',
    is_free: false,
    price: 59.99,
    usage_count: 84,
    // Photos réalistes Face et Dos vierge (sans aucun marquage résiduel)
    image_front: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80',
    image_back: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=600&q=80',
    flocking_config: {
      name: { x_percent: 50, y_percent: 24, font_family: 'Impact', font_size: 32, default_color: '#ffffff', letter_spacing: 4 },
      number: { x_percent: 50, y_percent: 50, font_family: 'Impact', font_size: 115, default_color: '#ffffff' },
      allowed_colors: ['#ffffff', '#ffd700', '#e63946', '#00b4d8', '#111111']
    },
    defaultName: 'MBAPPÉ',
    defaultNumber: '10',
    editable_elements: {
      body: false,
      collar: false,
      sleeves: false,
      stripes: false,
      badge: false,
      name_zone: true,
      number_zone: true
    },
    layers_config: {
      name_zone_id: 'name-zone',
      number_zone_id: 'number-zone'
    }
  }
];
