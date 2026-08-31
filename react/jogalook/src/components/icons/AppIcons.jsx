import React from 'react';

/**
 * Bibliothèque d'icônes vectorielles centralisée pour JogaLook.
 * Toutes les icônes acceptent :
 * - size: number | string (défaut: 18)
 * - color: string (défaut: 'currentColor')
 * - strokeWidth: number (défaut: 2)
 * - className: string
 */

const baseSvg = (path, { size = 18, color = 'currentColor', strokeWidth = 2, className = '', viewBox = '0 0 24 24', fill = 'none', ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`jogalook-icon ${className}`.trim()}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    {...rest}
  >
    {path}
  </svg>
);

// ── SPORTS ICONS ─────────────────────────────────────────────────────────────

export const FootballIcon = (props) => baseSvg(
  <>
    <circle cx="12" cy="12" r="10" />
    <polygon points="12,7 16,10 14.5,15 9.5,15 8,10" fill={props.color === 'currentColor' ? 'rgba(0,0,0,0.1)' : 'none'} />
    <line x1="12" y1="7" x2="12" y2="2" />
    <line x1="16" y1="10" x2="20.5" y2="7.5" />
    <line x1="14.5" y1="15" x2="18" y2="19" />
    <line x1="9.5" y1="15" x2="6" y2="19" />
    <line x1="8" y1="10" x2="3.5" y2="7.5" />
  </>,
  props
);

export const BasketballIcon = (props) => baseSvg(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
    <path d="M4.93 19.07a10 10 0 0 0 14.14 0" />
  </>,
  props
);

export const RugbyIcon = (props) => baseSvg(
  <>
    <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)" />
    <line x1="5" y1="5" x2="19" y2="19" />
    <line x1="8" y1="12" x2="12" y2="8" />
    <line x1="12" y1="16" x2="16" y2="12" />
  </>,
  props
);

export const RunningIcon = (props) => baseSvg(
  <>
    <circle cx="17" cy="4" r="2" />
    <path d="M15 8l-4 4 3 4-2 6" />
    <path d="M11 12l-4-2-3 3" />
    <path d="M7 17l4-2 2-3" />
  </>,
  props
);

export const TennisIcon = (props) => baseSvg(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M5.5 5.5a10 10 0 0 0 0 13" />
    <path d="M18.5 5.5a10 10 0 0 1 0 13" />
  </>,
  props
);

export const FitnessIcon = (props) => baseSvg(
  <>
    <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" />
  </>,
  props
);

export const JerseyIcon = (props) => baseSvg(
  <>
    <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a2 2 0 0 0 1.63 1.64L6 11.12V21a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9.88l1.51-.32a2 2 0 0 0 1.63-1.64l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  </>,
  props
);

// ── ACTIONS & COMMERCE ───────────────────────────────────────────────────────

export const BoltIcon = (props) => baseSvg(
  <>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={props.fill || 'none'} />
  </>,
  props
);

export const FlameIcon = (props) => baseSvg(
  <>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
  </>,
  props
);

export const StarIcon = (props) => baseSvg(
  <>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={props.fill || 'none'} />
  </>,
  props
);

export const CartIcon = (props) => baseSvg(
  <>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </>,
  props
);

export const TruckIcon = (props) => baseSvg(
  <>
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </>,
  props
);

export const ShieldCheckIcon = (props) => baseSvg(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </>,
  props
);

export const RefreshIcon = (props) => baseSvg(
  <>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </>,
  props
);

export const ShopIcon = (props) => baseSvg(
  <>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </>,
  props
);

export const StoreIcon = (props) => baseSvg(
  <>
    <path d="M2 3h20" />
    <path d="M21 3v5a4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1-4 4 4 4 0 0 1-4-4V3" />
    <path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" />
    <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
  </>,
  props
);

export const CreditCardIcon = (props) => baseSvg(
  <>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </>,
  props
);

export const BankIcon = (props) => baseSvg(
  <>
    <line x1="3" y1="21" x2="21" y2="21" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <polygon points="12 3 2 10 22 10 12 3" />
    <line x1="6" y1="10" x2="6" y2="21" />
    <line x1="10" y1="10" x2="10" y2="21" />
    <line x1="14" y1="10" x2="14" y2="21" />
    <line x1="18" y1="10" x2="18" y2="21" />
  </>,
  props
);

export const MobileMoneyIcon = (props) => baseSvg(
  <>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
    <path d="M9 8h6M9 12h6" />
  </>,
  props
);

export const PencilIcon = (props) => baseSvg(
  <>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </>,
  props
);

export const PaletteIcon = (props) => baseSvg(
  <>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" />
  </>,
  props
);

// ── UI, FEEDBACK & MEDIA ─────────────────────────────────────────────────────

export const CheckIcon = (props) => baseSvg(
  <>
    <polyline points="20 6 9 17 4 12" />
  </>,
  props
);

export const CheckCircleIcon = (props) => baseSvg(
  <>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </>,
  props
);

export const AlertTriangleIcon = (props) => baseSvg(
  <>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </>,
  props
);

export const AlertCircleIcon = (props) => baseSvg(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </>,
  props
);

export const XCircleIcon = (props) => baseSvg(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </>,
  props
);

export const XIcon = (props) => baseSvg(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>,
  props
);

export const InfoIcon = (props) => baseSvg(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </>,
  props
);

export const LockIcon = (props) => baseSvg(
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>,
  props
);

export const SettingsIcon = (props) => baseSvg(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>,
  props
);

export const LogOutIcon = (props) => baseSvg(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>,
  props
);

export const CameraIcon = (props) => baseSvg(
  <>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </>,
  props
);

export const FolderIcon = (props) => baseSvg(
  <>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </>,
  props
);

export const UploadIcon = (props) => baseSvg(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </>,
  props
);

export const CopyIcon = (props) => baseSvg(
  <>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>,
  props
);

export const TrashIcon = (props) => baseSvg(
  <>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </>,
  props
);

export const EyeIcon = (props) => baseSvg(
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </>,
  props
);

export const NewspaperIcon = (props) => baseSvg(
  <>
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M10 6h8v4h-8V6Z" />
  </>,
  props
);

export const SearchIcon = (props) => baseSvg(
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>,
  props
);

export const TagIcon = (props) => baseSvg(
  <>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </>,
  props
);

export const CloudIcon = (props) => baseSvg(
  <>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </>,
  props
);

export const SparklesIcon = (props) => baseSvg(
  <>
    <path d="M12 3l1.912 5.885L20 10.8l-4.956 3.6L16.956 20 12 16.385 7.044 20l1.912-5.6L4 10.8l6.088-1.915L12 3z" />
  </>,
  props
);

export const InstagramIcon = (props) => baseSvg(
  <>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </>,
  props
);

export const TiktokIcon = (props) => baseSvg(
  <>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </>,
  props
);

export const PinIcon = (props) => baseSvg(
  <>
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
  </>,
  props
);
