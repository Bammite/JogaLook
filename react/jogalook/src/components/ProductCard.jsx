import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';
import { useCart } from '../context/CartContext';
import SizePickerModal from './SizePickerModal';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const name = product?.name || 'Produit';
  const team = product?.team || product?.category || 'Collection';
  const price = Number(product?.price ?? product?.base_price ?? 0);
  const oldPrice = product?.oldPrice ? Number(product.oldPrice) : null;
  const image = product?.image || product?.image_url || 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=400&h=500&fit=crop';
  const badge = product?.badge || (product?.is_customizable ? { type: 'new', text: 'Personnalisable' } : null);
  const detailUrl = product?.id ? `/catalogue/${product.id}` : '/catalogue';

  // Variantes du produit
  const variants = product?.product_variants ?? [];
  const hasVariants = variants.filter(v => !v.deleted_at && v.size).length > 0;

  // Couleurs uniques pour les dots décoratifs
  const uniqueColorHexes = [...new Set(
    variants.filter(v => v.color_hex).map(v => v.color_hex)
  )].slice(0, 4);
  const colors = uniqueColorHexes.length > 0
    ? uniqueColorHexes
    : (Array.isArray(product?.colors) && product.colors.length ? product.colors : null);

  // État du modal de sélection de taille
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const [selectedSize, setSelectedSize]   = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasVariants) {
      // Ouvrir le modal de sélection de taille
      setSelectedSize(null);
      setSelectedColor(null);
      setSizePickerOpen(true);
    } else {
      // Pas de variante → ajouter directement
      addToCart(product);
      showFeedback();
    }
  };

  const handleConfirmFromModal = () => {
    // Calculer le prix effectif selon la variante choisie
    const matched = variants.find(
      v => v.size === selectedSize && (!selectedColor || v.color_hex === selectedColor)
    );
    const effectivePrice = matched?.price_override
      ? Number(matched.price_override)
      : price;

    addToCart({
      ...product,
      price: effectivePrice,
      selectedSize,
      selectedColor,
      variantId: matched?.id ?? null,
    });
    showFeedback();
  };

  const showFeedback = () => {
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <Link to={detailUrl} className="product-card" aria-label={`Voir ${name}`}>
        <div className="product-image-wrapper">
          {badge && <span className={`product-badge ${badge.type}`}>{badge.text}</span>}
          <img src={image} alt={name} className="product-image" loading="lazy" />
          <div className="product-actions">
            <button className="action-btn" aria-label="Ajouter aux favoris" onClick={handleWishlist}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <Link
              to={detailUrl}
              className="action-btn"
              aria-label="Vue rapide"
              onClick={e => e.stopPropagation()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </Link>
          </div>
        </div>
        <div className="product-info">
          <span className="product-team">{team}</span>
          <h3 className="product-name">{name}</h3>
          {colors && (
            <div className="product-colors">
              {colors.slice(0, 3).map((color, i) => (
                <span
                  key={i}
                  className="color-dot"
                  style={{ background: color }}
                  title={color}
                />
              ))}
              {colors.length > 3 && (
                <span className="color-more">+{colors.length - 3}</span>
              )}
            </div>
          )}
          {/* Tailles disponibles (aperçu) */}
          {hasVariants && (
            <div className="product-sizes-preview">
              {[...new Set(variants.filter(v => v.size && v.stock_quantity > 0).map(v => v.size))]
                .slice(0, 5)
                .map(size => (
                  <span key={size} className="size-chip">{size}</span>
                ))}
            </div>
          )}
          <div className="product-price">
            <span className="current-price">{Math.round(price).toLocaleString('fr-FR')} FCFA</span>
            {oldPrice && <span className="old-price">{Math.round(oldPrice).toLocaleString('fr-FR')} FCFA</span>}
          </div>
          <button
            className={`add-to-cart-btn ${addedFeedback ? 'add-to-cart-btn--added' : ''}`}
            type="button"
            onClick={handleAddToCart}
          >
            {addedFeedback ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Ajouté !
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {hasVariants ? 'Choisir ma taille' : 'Ajouter au panier'}
              </>
            )}
          </button>
        </div>
      </Link>

      {/* Modal sélection de taille */}
      <SizePickerModal
        product={product}
        open={sizePickerOpen}
        onClose={() => setSizePickerOpen(false)}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
        onSelectSize={setSelectedSize}
        onSelectColor={setSelectedColor}
        onConfirm={handleConfirmFromModal}
      />
    </>
  );
}

export default ProductCard;