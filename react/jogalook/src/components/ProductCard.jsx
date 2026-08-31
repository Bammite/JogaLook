import { Link } from 'react-router-dom';
import './ProductCard.css';
import { useCart } from '../context/CartContext';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const name = product?.name || 'Produit';
  const team = product?.team || product?.category || 'Collection';
  const price = Number(product?.price ?? product?.base_price ?? 0);
  const oldPrice = product?.oldPrice ? Number(product.oldPrice) : null;
  const image = product?.image || product?.image_url || 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=400&h=500&fit=crop';
  const badge = product?.badge || (product?.is_customizable ? { type: 'new', text: 'Personnalisable' } : null);
  const colors = Array.isArray(product?.colors) && product.colors.length ? product.colors : ['#1F2937', '#F8FAFC', '#D1D5DB'];
  const detailUrl = product?.id ? `/catalogue/${product.id}` : '/catalogue';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
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
            {colors.map((color, i) => (
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
        <div className="product-price">
          <span className="current-price">{Math.round(price).toLocaleString('fr-FR')} FCFA</span>
          {oldPrice && <span className="old-price">{Math.round(oldPrice).toLocaleString('fr-FR')} FCFA</span>}
        </div>
        <button className="add-to-cart-btn" type="button" onClick={handleAddToCart}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          Ajouter au panier
        </button>
      </div>
    </Link>
  );
}

export default ProductCard;