import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'jogalook-cart';

const getStoredCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(getStoredCart);
  const [cartPulse, setCartPulse] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!cartPulse) return undefined;
    const timeout = window.setTimeout(() => setCartPulse(false), 600);
    return () => window.clearTimeout(timeout);
  }, [cartPulse]);

  const addToCart = (product) => {
    const addQty = Math.max(1, Number(product?.quantity || 1));
    const normalizedProduct = {
      id: String(product?.id ?? product?.product_id ?? product?.name ?? Math.random().toString(36).slice(2)),
      name: product?.name || 'Produit',
      price: Number(product?.price ?? product?.base_price ?? 0),
      image: product?.image || product?.image_url || 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=400&h=500&fit=crop',
      category: product?.category || product?.team || 'Collection',
      selectedSize:  product?.selectedSize  || null,
      selectedColor: product?.selectedColor || null,
      customization_id: product?.customization_id || null,
      template_id: product?.template_id || null,
      template_type: product?.template_type || null,
      preview_front: product?.preview_front || product?.image || null,
      preview_back: product?.preview_back || null,
      svg_front: product?.svg_front || null,
      svg_back: product?.svg_back || null,
      extra_details: product?.extra_details || null,
    };

    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.id === normalizedProduct.id);

      if (existing) {
        return currentItems.map((item) =>
          item.id === normalizedProduct.id
            ? { ...item, quantity: item.quantity + addQty }
            : item
        );
      }

      return [...currentItems, { ...normalizedProduct, quantity: addQty }];
    });

    setCartPulse(true);
  };

  /** Met à jour la quantité d'un article (retire l'article si qty <= 0) */
  const updateQuantity = (id, qty) => {
    setItems((current) =>
      qty <= 0
        ? current.filter((item) => item.id !== id)
        : current.map((item) => item.id === id ? { ...item, quantity: qty } : item)
    );
  };

  /** Supprime un article du panier */
  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  /** Vide complètement le panier */
  const clearCart = () => setItems([]);

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, addToCart, updateQuantity, removeItem, clearCart, cartCount, total, cartPulse }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}
