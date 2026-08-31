import { CloseIcon } from './AdminIcons';

export function AdminModal({ open, onClose, title, children, size = 'lg', footer = null, loading = false }) {
  if (!open) return null;

  const widthMap = {
    sm: '420px',
    md: '640px',
    lg: '900px',
    xl: '1100px',
  };

  return (
    <div
      onClick={loading ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 14, 24, 0.55)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        style={{
          position: 'relative',
          width: widthMap[size] || widthMap.lg,
          maxWidth: '96vw',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--admin-card, #FFFFFF)',
          color: 'var(--text, #333333)',
          border: '1px solid var(--admin-border, #E4E7EC)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Loading Overlay */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              borderRadius: '16px',
            }}
          >
            <div className="admin-spinner" style={{ width: '40px', height: '40px', marginBottom: '12px' }} />
            <p style={{ fontWeight: 600, color: 'var(--primary, #F15A24)', margin: 0, fontSize: '0.95rem' }}>
              Enregistrement en cours...
            </p>
          </div>
        )}

        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--admin-border, #E4E7EC)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary, #1A1A2E)' }}>{title}</h2>
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--sm"
            onClick={onClose}
            disabled={loading}
            style={{ padding: '6px 12px', borderRadius: '8px' }}
          >
            <CloseIcon />
            <span className="admin-btn--outline-text">Fermer</span>
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div
            style={{
              padding: '12px 20px 16px',
              borderTop: '1px solid var(--admin-border, #E4E7EC)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
