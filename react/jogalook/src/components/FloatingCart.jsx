import { useState } from 'react';
import { useCart } from '../context/CartContext';
import CheckoutModal from './CheckoutModal';

function FloatingCart() {
  const { cartCount, cartPulse } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <>
      <div className={`floating-cart-wrapper ${cartPulse ? 'vibrate' : ''}`}>
        <button
          type="button"
          className="floating-cart-button"
          onClick={() => setIsCheckoutOpen(true)}
          aria-label="Commander"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="floating-cart-count">{cartCount}</span>
        </button>
      </div>

      <CheckoutModal
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
}

export default FloatingCart;

