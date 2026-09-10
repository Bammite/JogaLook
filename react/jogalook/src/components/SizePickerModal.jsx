import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './SizePickerModal.css';

const SIZES_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

function sortVariants(variants) {
  return [...variants].sort((a, b) => {
    const ai = SIZES_ORDER.indexOf(a.size);
    const bi = SIZES_ORDER.indexOf(b.size);
    if (ai === -1 && bi === -1) return (a.size || '').localeCompare(b.size || '');
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

/**
 * SizePickerModal — modal intermédiaire de sélection de taille/couleur
 *
 * Props:
 *   product        — objet produit complet (avec product_variants)
 *   open           — boolean
 *   onClose        — () => void
 *   selectedSize   — string | null
 *   selectedColor  — string | null
 *   onSelectSize   — (size) => void
 *   onSelectColor  — (colorHex) => void
 *   onConfirm      — () => void  (ajoute au panier)
 */
export default function SizePickerModal({
  product,
  open,
  onClose,
  selectedSize,
  selectedColor,
  onSelectSize,
  onSelectColor,
  onConfirm,
}) {
  const overlayRef = useRef(null);

  // Fermer avec Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open || !product) return null;

  const variants = sortVariants((product.product_variants ?? []).filter(v => !v.deleted_at));
  const basePrice = Number(product.base_price ?? 0);

  // Tailles uniques
  const uniqueSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

  // Couleurs uniques (filtrées par la taille sélectionnée)
  const colorsForSize = selectedSize
    ? variants.filter(v => v.size === selectedSize && v.stock_quantity > 0)
        .map(v => ({ hex: v.color_hex, name: v.color_name }))
        .filter(c => c.hex)
        .filter((c, i, arr) => arr.findIndex(x => x.hex === c.hex) === i)
    : [];

  // Variante exacte matchée
  const matchedVariant = variants.find(
    v => v.size === selectedSize && (!selectedColor || v.color_hex === selectedColor)
  ) ?? null;

  const effectivePrice = matchedVariant?.price_override
    ? Number(matchedVariant.price_override)
    : basePrice;

  const inStock = matchedVariant ? matchedVariant.stock_quantity > 0 : false;
  const stockQty = matchedVariant?.stock_quantity ?? 0;

  // Un produit sans variante = taille unique, on confirme directement
  const hasVariants = uniqueSizes.length > 0;

  // La couleur est requise seulement si la taille sélectionnée a plusieurs couleurs
  const colorRequired = colorsForSize.length > 1;
  const canConfirm = hasVariants
    ? (selectedSize && inStock && (!colorRequired || selectedColor))
    : true;

  // Vérifier si une taille est dispo (au moins un variant avec stock > 0)
  const isSizeAvailable = (size) =>
    variants.some(v => v.size === size && v.stock_quantity > 0);

  const image = product.image_url || 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=200&h=200&fit=crop';
  const detailUrl = `/catalogue/${product.id}`;

  return (
    <div
      className="spm-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Choisir une taille pour ${product.name}`}
    >
      <div className="spm-modal">
        {/* Header */}
        <div className="spm-header">
          <div className="spm-product-info">
            <img src={image} alt={product.name} className="spm-thumb" />
            <div>
              <h3 className="spm-product-name">{product.name}</h3>
              <div className="spm-price">
                {effectivePrice > 0
                  ? <span className="spm-price-current">{Math.round(effectivePrice).toLocaleString('fr-FR')} FCFA</span>
                  : <span className="spm-price-current">{Math.round(basePrice).toLocaleString('fr-FR')} FCFA</span>
                }
                {matchedVariant?.price_override && Number(matchedVariant.price_override) !== basePrice && (
                  <span className="spm-price-base">Prix de base : {Math.round(basePrice).toLocaleString('fr-FR')} FCFA</span>
                )}
              </div>
            </div>
          </div>
          <button className="spm-close" onClick={onClose} aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="spm-body">
          {!hasVariants ? (
            <p className="spm-no-variants">Ce produit est disponible en taille unique.</p>
          ) : (
            <>
              {/* Sélection taille */}
              <div className="spm-section">
                <div className="spm-section-label">
                  Choisissez une taille
                  {selectedSize && (
                    <span className="spm-selected-tag">{selectedSize}</span>
                  )}
                </div>
                <div className="spm-sizes">
                  {uniqueSizes.map(size => {
                    const available = isSizeAvailable(size);
                    const isSelected = selectedSize === size;
                    // Prix spécifique pour cette taille (premier variant avec stock)
                    const variantForSize = variants.find(v => v.size === size && v.stock_quantity > 0);
                    const sizePrice = variantForSize?.price_override
                      ? Number(variantForSize.price_override)
                      : null;

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!available}
                        onClick={() => {
                          onSelectSize(size);
                          onSelectColor(null); // reset couleur quand on change de taille
                        }}
                        className={[
                          'spm-size-btn',
                          isSelected ? 'spm-size-btn--selected' : '',
                          !available ? 'spm-size-btn--unavailable' : '',
                        ].filter(Boolean).join(' ')}
                        title={!available ? 'Rupture de stock' : ''}
                      >
                        <span className="spm-size-label">{size}</span>
                        {sizePrice && sizePrice !== basePrice && (
                          <span className="spm-size-price">
                            {Math.round(sizePrice).toLocaleString('fr-FR')}
                          </span>
                        )}
                        {!available && <span className="spm-size-cross">✕</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sélection couleur (seulement si taille choisie ET plusieurs couleurs) */}
              {selectedSize && colorsForSize.length > 1 && (
                <div className="spm-section">
                  <div className="spm-section-label">
                    Couleur
                    {selectedColor && (
                      <span className="spm-selected-tag">
                        {colorsForSize.find(c => c.hex === selectedColor)?.name || selectedColor}
                      </span>
                    )}
                  </div>
                  <div className="spm-colors">
                    {colorsForSize.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => onSelectColor(c.hex)}
                        className={['spm-color-btn', selectedColor === c.hex ? 'spm-color-btn--selected' : ''].join(' ')}
                        title={c.name || c.hex}
                      >
                        <span className="spm-color-dot" style={{ background: c.hex }} />
                        <span className="spm-color-name">{c.name || c.hex}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Indicateur stock */}
              {selectedSize && matchedVariant && (
                <div className={`spm-stock ${inStock ? 'spm-stock--ok' : 'spm-stock--out'}`}>
                  {inStock
                    ? stockQty <= 5
                      ? `⚠️ Plus que ${stockQty} en stock !`
                      : `✓ En stock`
                    : `✕ Rupture de stock pour cette taille`}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="spm-footer">
          <Link to={detailUrl} className="spm-view-detail" onClick={onClose}>
            Voir le produit
          </Link>
          <button
            className="spm-confirm-btn"
            disabled={!canConfirm}
            onClick={() => {
              if (canConfirm) {
                onConfirm();
                onClose();
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}
