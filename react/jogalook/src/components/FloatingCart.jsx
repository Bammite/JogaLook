import { useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import CheckoutModal from './CheckoutModal';

function FloatingCart() {
  const { items, cartCount, total, cartPulse, updateQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const formattedTotal = useMemo(() => `${Math.round(total).toLocaleString('fr-FR')} FCFA`, [total]);

  const handleOpenCheckout = () => {
    setOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <div className={`floating-cart-wrapper ${cartPulse ? 'vibrate' : ''}`}>
        <button
          type="button"
          className="floating-cart-button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Voir le panier"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="floating-cart-count">{cartCount}</span>
        </button>

        {open && (
          <div className="floating-cart-panel">
            <div className="floating-cart-header">
              <h3>Mon panier</h3>
              <button type="button" className="floating-cart-close" onClick={() => setOpen(false)} aria-label="Fermer le panier">
                ×
              </button>
            </div>

            {items.length === 0 ? (
              <div className="floating-cart-empty">
                <p>Votre panier est vide.</p>
              </div>
            ) : (
              <>
                <div className="floating-cart-items">
                  {items.map((item) => (
                    <div key={item.id} className="floating-cart-item">
                      <img src={item.image} alt={item.name} />
                      <div className="floating-cart-item-info">
                        <strong>{item.name}</strong>
                        {item.selectedSize && <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Taille: {item.selectedSize}</span>}
                        <span>{item.quantity} x {Math.round(Number(item.price)).toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span className="floating-cart-item-total">{(item.quantity * Math.round(Number(item.price))).toLocaleString('fr-FR')} FCFA</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => item.quantity <= 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}
                            style={{ padding: '2px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                            aria-label="Diminuer"
                          >−</button>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{ padding: '2px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                            aria-label="Augmenter"
                          >+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="floating-cart-footer">
                  <div>
                    <span>Total</span>
                    <strong>{formattedTotal}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
                    <a
                      href="/panier"
                      className="floating-cart-checkout"
                      style={{ background: 'var(--secondary, #1A1A2E)', textAlign: 'center', flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => setOpen(false)}
                    >
                      Voir le panier
                    </a>
                    <button
                      type="button"
                      className="floating-cart-checkout"
                      style={{ flex: 1 }}
                      onClick={handleOpenCheckout}
                    >
                      Commander
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <CheckoutModal
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
}

export default FloatingCart;

