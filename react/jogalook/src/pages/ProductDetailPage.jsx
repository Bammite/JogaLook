import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import CheckoutModal from '../components/CheckoutModal';
import {
  BoltIcon,
  PencilIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  StoreIcon,
  TruckIcon,
  RefreshIcon,
  ShieldCheckIcon,
} from '../components/icons/AppIcons';
import './ProductDetailPage.css';

const FALLBACK_PRODUCT = {
  id: 'fallback-1',
  name: 'Maillot Premium',
  description: 'Maillot de haute qualité pour les sportifs exigeants. Tissu respirant, coupe ajustée, disponible en plusieurs coloris.',
  base_price: 89.99,
  image_url: 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=800&h=900&fit=crop',
  is_customizable: true,
  categories: { name: 'Football' },
  shops: { name: 'JogaLook Store' },
  product_variants: [
    { id: 'v1', size: 'S', color_name: 'Noir', color_hex: '#1F2937', stock_quantity: 10 },
    { id: 'v2', size: 'M', color_name: 'Blanc', color_hex: '#F8FAFC', stock_quantity: 5 },
    { id: 'v3', size: 'L', color_name: 'Rouge', color_hex: '#DC2626', stock_quantity: 8 },
    { id: 'v4', size: 'XL', color_name: 'Noir', color_hex: '#1F2937', stock_quantity: 0 },
  ],
};

const SIZES_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

function sortSizes(variants) {
  return [...variants].sort((a, b) => {
    const ai = SIZES_ORDER.indexOf(a.size);
    const bi = SIZES_ORDER.indexOf(b.size);
    if (ai === -1 && bi === -1) return (a.size || '').localeCompare(b.size || '');
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Selected variant options
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          // Try with slug fallback
          const res2 = await fetch(`/api/products?slug=${id}`);
          if (!res2.ok) throw new Error('not found');
          const json2 = await res2.json();
          const p = json2.data?.[0];
          if (!p) throw new Error('not found');
          setProduct(p);
        } else {
          const json = await res.json();
          if (!json.success || !json.data) throw new Error('not found');
          setProduct(json.data);
        }
      } catch {
        // Use fallback if API not connected
        if (id === 'fallback-1' || !id) {
          setProduct(FALLBACK_PRODUCT);
        } else {
          setProduct(FALLBACK_PRODUCT); // Show demo even for unknown IDs
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Derive unique colors and sizes from variants
  const variants = product?.product_variants ?? [];
  const sortedVariants = sortSizes(variants);

  const uniqueColors = [...new Map(
    sortedVariants.map(v => [v.color_hex, { hex: v.color_hex, name: v.color_name }])
  ).values()].filter(c => c.hex);

  const uniqueSizes = [...new Set(sortedVariants.map(v => v.size).filter(Boolean))];

  // Filter sizes by selected color (and vice-versa)
  const availableSizesForColor = selectedColor
    ? sortedVariants.filter(v => v.color_hex === selectedColor && v.stock_quantity > 0).map(v => v.size)
    : uniqueSizes.filter(sz => sortedVariants.find(v => v.size === sz && v.stock_quantity > 0));

  const availableColorsForSize = selectedSize
    ? sortedVariants.filter(v => v.size === selectedSize && v.stock_quantity > 0).map(v => v.color_hex)
    : uniqueColors.filter(c => sortedVariants.find(v => v.color_hex === c.hex && v.stock_quantity > 0)).map(c => c.hex);

  // Find the exact matching variant
  const matchedVariant = sortedVariants.find(
    v => v.color_hex === selectedColor && v.size === selectedSize
  ) ?? null;

  const inStock = matchedVariant ? matchedVariant.stock_quantity > 0 : false;
  const effectivePrice = matchedVariant?.price_override
    ? Number(matchedVariant.price_override)
    : Number(product?.base_price ?? 0);

  const canAddToCart = selectedColor && selectedSize && inStock;

  // Gallery images (use product_images if available, fallback to image_url)
  const images = (product?.product_images && product.product_images.length > 0)
    ? [...product.product_images]
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map(img => (typeof img === 'string' ? img : img.url))
        .filter(Boolean)
    : [product?.image_url || 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=800&h=900&fit=crop'];

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        ...product,
        price: effectivePrice,
        selectedSize,
        selectedColor,
        variantId: matchedVariant?.id,
      });
    }
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2200);
  };

  const handleReserveNow = () => {
    if (!canAddToCart) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        ...product,
        price: effectivePrice,
        selectedSize,
        selectedColor,
        variantId: matchedVariant?.id,
      });
    }
    setIsCheckoutOpen(true);
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="pdp-loading">
        <div className="pdp-spinner" />
        <p>Chargement du produit…</p>
      </div>
      <Footer />
    </>
  );

  if (notFound) return (
    <>
      <Navbar />
      <div className="pdp-not-found">
        <AlertCircleIcon size={48} color="#94A3B8" />
        <h2>Produit introuvable</h2>
        <p>Ce produit n&apos;existe pas ou a été supprimé.</p>
        <Link to="/catalogue" className="pdp-back-btn">← Retour au catalogue</Link>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <main className="pdp-root">
        {/* Breadcrumb */}
        <nav className="pdp-breadcrumb" aria-label="Fil d'Ariane">
          <Link to="/">Accueil</Link>
          <span>›</span>
          <Link to="/catalogue">Catalogue</Link>
          <span>›</span>
          <span>{product?.name}</span>
        </nav>

        <div className="pdp-layout">
          {/* ─── GALLERY ─── */}
          <section className="pdp-gallery" aria-label="Images du produit">
            <div className="pdp-gallery__main">
              <img
                src={images[activeImage] || images[0]}
                alt={product?.name}
                className="pdp-gallery__img"
              />
              {product?.is_customizable && (
                <span className="pdp-gallery__badge">
                  <PencilIcon size={13} /> Personnalisable
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="pdp-gallery__thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`pdp-gallery__thumb${activeImage === i ? ' pdp-gallery__thumb--active' : ''}`}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ─── INFOS ─── */}
          <section className="pdp-info" aria-label="Informations produit">
            {/* Category / Shop */}
            <div className="pdp-info__meta">
              {product?.categories?.name && (
                <span className="pdp-info__category">{product.categories.name}</span>
              )}
              {product?.shops?.name && (
                <span className="pdp-info__shop">{product.shops.name}</span>
              )}
            </div>

            <h1 className="pdp-info__title">{product?.name}</h1>

            {/* Price */}
            <div className="pdp-info__price-row">
              <span className="pdp-info__price">{Math.round(effectivePrice).toLocaleString('fr-FR')} FCFA</span>
              {matchedVariant?.price_override && (
                <span className="pdp-info__price-base">Prix de base : {Math.round(Number(product.base_price)).toLocaleString('fr-FR')} FCFA</span>
              )}
            </div>

            {/* Description */}
            {product?.description && (
              <p className="pdp-info__desc">{product.description}</p>
            )}

            <div className="pdp-divider" />

            {/* Color selector */}
            {uniqueColors.length > 0 && (
              <div className="pdp-selector">
                <p className="pdp-selector__label">
                  Couleur : <strong>{uniqueColors.find(c => c.hex === selectedColor)?.name || 'Sélectionner'}</strong>
                </p>
                <div className="pdp-colors">
                  {uniqueColors.map(color => {
                    const available = availableColorsForSize.includes(color.hex);
                    return (
                      <button
                        key={color.hex}
                        className={`pdp-color-btn${selectedColor === color.hex ? ' pdp-color-btn--active' : ''}${!available ? ' pdp-color-btn--unavail' : ''}`}
                        onClick={() => available && setSelectedColor(color.hex)}
                        title={color.name}
                        aria-label={color.name}
                        style={{ '--color': color.hex }}
                      >
                        <span className="pdp-color-dot" style={{ background: color.hex }} />
                        {!available && <span className="pdp-color-cross">✕</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size selector */}
            {uniqueSizes.length > 0 && (
              <div className="pdp-selector">
                <p className="pdp-selector__label">
                  Taille : <strong>{selectedSize || 'Sélectionner'}</strong>
                </p>
                <div className="pdp-sizes">
                  {sortedVariants
                    .filter((v, i, arr) => arr.findIndex(x => x.size === v.size) === i)
                    .map(v => {
                      const available = availableSizesForColor.includes(v.size);
                      return (
                        <button
                          key={v.size}
                          className={`pdp-size-btn${selectedSize === v.size ? ' pdp-size-btn--active' : ''}${!available ? ' pdp-size-btn--unavail' : ''}`}
                          onClick={() => available && setSelectedSize(v.size)}
                          disabled={!available}
                          aria-label={`Taille ${v.size}`}
                        >
                          {v.size}
                        </button>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* Stock info */}
            {selectedColor && selectedSize && (
              <div className={`pdp-stock${inStock ? ' pdp-stock--in' : ' pdp-stock--out'}`}>
                {inStock
                  ? <><CheckCircleIcon size={16} /> En stock ({matchedVariant.stock_quantity} disponible{matchedVariant.stock_quantity > 1 ? 's' : ''})</>
                  : <><XCircleIcon size={16} /> Rupture de stock pour cette combinaison</>
                }
              </div>
            )}

            {/* Quantity */}
            <div className="pdp-qty-row">
              <div className="pdp-qty">
                <button
                  className="pdp-qty__btn"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  aria-label="Réduire la quantité"
                >−</button>
                <span className="pdp-qty__val">{quantity}</span>
                <button
                  className="pdp-qty__btn"
                  onClick={() => setQuantity(q => Math.min(matchedVariant?.stock_quantity ?? 10, q + 1))}
                  aria-label="Augmenter la quantité"
                >+</button>
              </div>
            </div>

            {/* CTA */}
            <div className="pdp-cta">
              <button
                className={`pdp-add-btn${addedFeedback ? ' pdp-add-btn--success' : ''}`}
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                id="add-to-cart-btn"
              >
                {addedFeedback ? (
                  <>
                    <CheckIcon size={18} /> Ajouté au panier !
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    {canAddToCart ? 'Ajouter au panier' : 'Choisir couleur & taille'}
                  </>
                )}
              </button>

              <button
                type="button"
                className="pdp-add-btn"
                style={{ background: 'var(--secondary, #1A1A2E)' }}
                onClick={handleReserveNow}
                disabled={!canAddToCart}
              >
                <BoltIcon size={16} /> Réserver / Payer
              </button>

              {product?.is_customizable && (
                <Link to="/custom" className="pdp-custom-btn">
                  <PencilIcon size={16} /> Personnaliser
                </Link>
              )}
            </div>

            {/* Shop info */}
            {product?.shops?.name && (
              <p className="pdp-shop-info">
                <StoreIcon size={16} /> Vendu par <strong>{product.shops.name}</strong>
              </p>
            )}

            {/* Features */}
            <div className="pdp-features">
              <div className="pdp-feature">
                <span className="pdp-feature-icon"><TruckIcon size={22} color="var(--primary, #F15A24)" /></span>
                <div>
                  <strong>Livraison rapide</strong>
                  <span>Expédié sous 24-48h</span>
                </div>
              </div>
              <div className="pdp-feature">
                <span className="pdp-feature-icon"><RefreshIcon size={22} color="var(--primary, #F15A24)" /></span>
                <div>
                  <strong>Retours gratuits</strong>
                  <span>30 jours pour changer d'avis</span>
                </div>
              </div>
              <div className="pdp-feature">
                <span className="pdp-feature-icon"><ShieldCheckIcon size={22} color="var(--primary, #F15A24)" /></span>
                <div>
                  <strong>Garantie qualité</strong>
                  <span>Produits certifiés JogaLook</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <CheckoutModal
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
}
