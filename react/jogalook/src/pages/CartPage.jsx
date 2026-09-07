import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  CartIcon,
  CheckCircleIcon,
  TrashIcon,
  AlertTriangleIcon,
  InfoIcon,
  CreditCardIcon,
  XIcon,
  LockIcon,
  MapPinIcon,
  NavigationIcon,
  PhoneCallIcon,
  StoreIcon,
} from '../components/icons/AppIcons';
import './CartPage.css';
import JerseyPreview from '../components/JerseyPreview';

/* ─── Villes disponibles ─── */
const CITIES = [
  { id: 'Dakar',       label: 'Dakar',       fee: 1000 },
  { id: 'Saint-Louis', label: 'Saint-Louis', fee: 5000 },
  { id: 'Kaolack',     label: 'Kaolack',     fee: 5000 },
  { id: 'Thies',       label: 'Thiès',       fee: 5000 },
];

/* ─── Modes de localisation / réception ─── */
const DELIVERY_MODES = [
  {
    id: 'gps',
    label: 'Position GPS actuelle',
    description: 'Localisation automatique par satellite'
  },
  {
    id: 'phone_call',
    label: 'Préciser par appel',
    description: 'Le livreur vous contacte avant la livraison'
  },
  {
    id: 'pickup',
    label: 'Retrait en boutique',
    description: 'Click & Collect gratuit (Dakar uniquement)',
    dakarOnly: true
  },
];

const PAYMENT_METHODS = [
  { id: 'wave',                   label: 'Wave (Sénégal)',              country: 'sn' },
  { id: 'orange_money',           label: 'Orange Money (Sénégal)',       country: 'sn' },
  { id: 'free_money',             label: 'Free Money (Sénégal)',         country: 'sn' },
  { id: 'wave_ci',                label: 'Wave (Côte d\'Ivoire)',       country: 'ci' },
  { id: 'orange_money_ci',        label: 'Orange Money (Côte d\'Ivoire)',country: 'ci' },
  { id: 'mtn_ci',                 label: 'MTN Mobile (Côte d\'Ivoire)',  country: 'ci' },
  { id: 'moov_ci',                label: 'Moov (Côte d\'Ivoire)',        country: 'ci' },
  { id: 'orange_money_burkina',   label: 'Orange Money (Burkina Faso)', country: 'bf' },
  { id: 'moov_burkina',           label: 'Moov Money (Burkina Faso)',   country: 'bf' },
  { id: 'card',                   label: 'Carte bancaire (Visa / MasterCard)', country: 'sn' },
];

// ─── Composant mini-aperçu Face/Dos pour les articles du panier ───────────
function CartItemPreview({ item, onOpenModal }) {
  const [side, setSide] = useState('front');
  const hasBack = Boolean(item.preview_back || item.svg_back);

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      onClick={() => onOpenModal && onOpenModal(side)}
      title="Cliquer pour voir en grand"
    >
      <JerseyPreview item={item} side={side} alt={item.name} />
      <span
        style={{
          position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.55)', color: '#fff',
          borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.6rem', pointerEvents: 'none', zIndex: 2
        }}
      >
        🔍
      </span>
      {hasBack && (
        <div
          style={{
            position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 2, background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '2px 4px', zIndex: 3
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSide('front');
            }}
            style={{
              border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 12, fontSize: '0.65rem',
              fontWeight: 700, background: side === 'front' ? '#f15a24' : 'transparent', color: '#fff'
            }}
          >Face</button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSide('back');
            }}
            style={{
              border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 12, fontSize: '0.65rem',
              fontWeight: 700, background: side === 'back' ? '#f15a24' : 'transparent', color: '#fff'
            }}
          >Dos</button>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Fenêtre modale de finalisation sur mobile / petits écrans ──
  const [isMobileCheckoutOpen, setIsMobileCheckoutOpen] = useState(false);

  // ── Sélection des articles à commander ──
  const [selectedIds, setSelectedIds] = useState(() => items.map(i => i.id));

  // Sync si des articles sont ajoutés/supprimés
  useEffect(() => {
    setSelectedIds(prev => {
      const validIds = new Set(items.map(i => i.id));
      const filtered = prev.filter(id => validIds.has(id));
      // Si un nouvel article arrive et rien n'était désélectionné, on le coche
      items.forEach(it => {
        if (!prev.includes(it.id) && !filtered.includes(it.id)) filtered.push(it.id);
      });
      return filtered;
    });
  }, [items]);

  // ── Formulaire client & paiement ──
  const [customerName, setCustomerName]       = useState('');
  const [phoneNumber, setPhoneNumber]         = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod]     = useState('wave');
  const [isCod, setIsCod]                     = useState(false); // Paiement à la livraison
  const [savePreference, setSavePreference]   = useState(true);

  // ── Localisation & Ville ──
  const [city, setCity]                       = useState('Dakar');
  const [deliveryMode, setDeliveryMode]       = useState('gps'); // 'gps' | 'phone_call' | 'pickup'
  const [gpsCoords, setGpsCoords]             = useState(null);
  const [isLocating, setIsLocating]           = useState(false);
  const [locationError, setLocationError]     = useState('');

  // ── Fiabilité & préférences ──
  const [codEligible, setCodEligible]         = useState(true);
  const [codReason, setCodReason]             = useState('');
  const [loadingPrefs, setLoadingPrefs]       = useState(false);

  // ── États d'envoi ──
  const [submitting, setSubmitting]           = useState(false);
  const [orderSuccess, setOrderSuccess]       = useState(null);
  const [errorMessage, setErrorMessage]       = useState('');

  // ── Retour après paiement PayBammite ──
  const [paymentReturn, setPaymentReturn]     = useState(null); // { status, verifying, data }

  // Si on quitte Dakar et que le mode était Retrait en boutique, basculer sur GPS
  useEffect(() => {
    if (city !== 'Dakar' && deliveryMode === 'pickup') {
      setDeliveryMode('gps');
    }
  }, [city, deliveryMode]);

  // Fonction pour capturer la géolocalisation GPS
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n’est pas supportée sur ce navigateur.');
      return;
    }
    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = position.coords;
        setGpsCoords({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy)
        });
        setLocationError('');
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Impossible d’obtenir votre position GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Autorisation GPS refusée. Veuillez réessayer.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Délai GPS dépassé. Veuillez réessayer.';
        }
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Génération de l'adresse formatée complète
  const getFormattedAddress = () => {
    if (deliveryMode === 'gps') {
      if (gpsCoords) {
        return `${city} | GPS: ${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)} (±${gpsCoords.accuracy}m) | https://maps.google.com/?q=${gpsCoords.lat.toFixed(6)},${gpsCoords.lng.toFixed(6)}`;
      }
      return `${city} | Position GPS demandée`;
    }
    if (deliveryMode === 'phone_call') {
      const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, '');
      return `${city} | Position à préciser par appel téléphonique (+221 ${cleanPhone || 'client'})`;
    }
    if (deliveryMode === 'pickup') {
      return `Dakar | Retrait en boutique (Boutique JogaLook - Point Relais Sacré-Cœur 3 / VDN Dakar)`;
    }
    return `${city} | Adresse de livraison`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment_status'); // 'success' | 'cancelled'
    const token  = params.get('token');

    if (!status) return;

    // Nettoyer l'URL sans rechargement
    window.history.replaceState({}, '', window.location.pathname);

    if (status === 'cancelled') {
      setPaymentReturn({ status: 'cancelled', verifying: false, data: null });
      return;
    }

    if (status === 'success') {
      if (token) {
        setPaymentReturn({ status: 'verifying', verifying: true, data: null });
        fetch('/service/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, status_hint: 'success' }),
        })
          .then(r => r.json())
          .then(json => {
            if (json.success) {
              const s = (json.data?.paybammite_status || json.data?.local_status || json.data?.order_status || '').toLowerCase();
              const isPaid = ['completed', 'success', 'paid'].includes(s);
              setPaymentReturn({ status: isPaid ? 'success' : 'pending', verifying: false, data: json.data });
              if (isPaid) {
                clearCart();
              }
            } else {
              setPaymentReturn({ status: 'success', verifying: false, data: null });
              clearCart();
            }
          })
          .catch(() => {
            setPaymentReturn({ status: 'success', verifying: false, data: null });
            clearCart();
          });
      } else {
        setPaymentReturn({ status: 'success', verifying: false, data: null });
        clearCart();
      }
    }
  }, [clearCart]);

  // ── Pré-remplissage avec les infos utilisateur (table userinfo) ──
  useEffect(() => {
    const localUser = user || JSON.parse(localStorage.getItem('jogalook-user') || 'null');
    const token = localStorage.getItem('jogalook-token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    if (localUser) {
      const fullName = [localUser.first_name, localUser.last_name].filter(Boolean).join(' ');
      if (fullName && !customerName) setCustomerName(fullName);
      if (localUser.phone && !phoneNumber) setPhoneNumber(localUser.phone);
    }

    const userIdQuery = localUser?.id ? `user_id=${localUser.id}` : '';
    const phoneQuery  = localUser?.phone ? `phone=${encodeURIComponent(localUser.phone)}` : '';
    const emailQuery  = localUser?.email ? `email=${encodeURIComponent(localUser.email)}` : '';
    const queryParts  = [userIdQuery, phoneQuery, emailQuery].filter(Boolean).join('&');

    setLoadingPrefs(true);
    fetch(`/service/payment/user-preferences?${queryParts}`, { headers })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          // 1. Priorité absolue aux données de la table userinfo (dernière commande)
          const info = res.data.user_info;
          if (info) {
            if (info.customer_name) setCustomerName(info.customer_name);
            if (info.phone_number) {
              const clean = String(info.phone_number).replace(/^(\+|00)?221/, '').replace(/[\s\-\.]/g, '');
              setPhoneNumber(clean);
            }
            if (info.delivery_address) {
              const rawAddr = info.delivery_address;
              setShippingAddress(rawAddr);
              if (rawAddr.includes('Saint-Louis')) setCity('Saint-Louis');
              else if (rawAddr.includes('Kaolack')) setCity('Kaolack');
              else if (rawAddr.includes('Thiès') || rawAddr.includes('Thies')) setCity('Thies');
              else setCity('Dakar');

              if (rawAddr.includes('GPS:')) {
                setDeliveryMode('gps');
                const match = rawAddr.match(/GPS:\s*([0-9\.\-]+),\s*([0-9\.\-]+)/);
                if (match) {
                  setGpsCoords({ lat: parseFloat(match[1]), lng: parseFloat(match[2]), accuracy: 15 });
                }
              } else if (rawAddr.toLowerCase().includes('appel') || rawAddr.toLowerCase().includes('phone')) {
                setDeliveryMode('phone_call');
              } else if (rawAddr.toLowerCase().includes('retrait') || rawAddr.toLowerCase().includes('boutique') || rawAddr.toLowerCase().includes('collect')) {
                setDeliveryMode('pickup');
              } else {
                setDeliveryMode('gps');
              }
            }
            if (info.payment_method) {
              if (info.payment_method === 'cash_on_delivery') {
                setIsCod(true);
              } else {
                setPaymentMethod(info.payment_method);
                setIsCod(false);
              }
            }
          } else if (res.data.saved_method) {
            // 2. Fallback sur user_payment_methods si disponible
            if (res.data.saved_method.customer_name) setCustomerName(res.data.saved_method.customer_name);
            if (res.data.saved_method.phone_number) {
              const clean = String(res.data.saved_method.phone_number).replace(/^(\+|00)?221/, '').replace(/[\s\-\.]/g, '');
              setPhoneNumber(clean);
            }
            if (res.data.saved_method.payment_method) {
              if (res.data.saved_method.payment_method === 'cash_on_delivery') {
                setIsCod(true);
              } else {
                setPaymentMethod(res.data.saved_method.payment_method);
              }
            }
          }
          if (res.data.cod) {
            setCodEligible(res.data.cod.eligible);
            if (!res.data.cod.eligible && res.data.cod.reason) {
              setCodReason(res.data.cod.reason);
            }
          }
        }
      })
      .catch(err => console.warn('Pref load notice:', err.message))
      .finally(() => setLoadingPrefs(false));
  }, [user]);

  // ── Calculs des totaux uniquement sur les articles sélectionnés ──
  const selectedItems = useMemo(() => {
    return items.filter(it => selectedIds.includes(it.id));
  }, [items, selectedIds]);

  const selectedTotal = useMemo(() => {
    return selectedItems.reduce((sum, it) => sum + (Number(it.price || 0) * (it.quantity || 1)), 0);
  }, [selectedItems]);

  const getDeliveryFee = (cityName = city, mode = deliveryMode) => {
    if (mode === 'pickup') return 0;
    return cityName === 'Dakar' ? 1000 : 5000;
  };

  const deliveryFee = useMemo(() => getDeliveryFee(city, deliveryMode), [city, deliveryMode]);
  const totalFcfa = Math.round(selectedTotal + deliveryFee);

  // ── Validation de l'éligibilité COD (Paiement à la livraison) ──
  const isCodAmountValid = totalFcfa >= 5000 && totalFcfa <= 100000;
  const canUseCod = isCodAmountValid && codEligible;

  // Si le montant devient invalide pour le COD, désactiver la checkbox
  useEffect(() => {
    if (isCod && !canUseCod) {
      setIsCod(false);
    }
  }, [isCod, canUseCod]);

  // ── Gestion de la sélection multiple ──
  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const requireAuthentication = () => {
    if (user) return true;
    navigate('/login', { state: { from: '/panier' } });
    return false;
  };

  const openCheckout = () => {
    if (!requireAuthentication()) return;
    setErrorMessage('');
    setIsMobileCheckoutOpen(true);
  };

  // ── Verrouillage du scroll et touche Échap pour la modale mobile ──
  useEffect(() => {
    if (isMobileCheckoutOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setIsMobileCheckoutOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileCheckoutOpen]);

  // ── Validation et soumission de la commande ──
  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!requireAuthentication()) return;

    if (selectedItems.length === 0) {
      setErrorMessage('Veuillez sélectionner au moins un article à commander.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet.');
      return;
    }
    const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('Veuillez renseigner un numéro de téléphone valide.');
      return;
    }

    setSubmitting(true);

    try {
      const selectedMethodObj = PAYMENT_METHODS.find(m => m.id === paymentMethod);
      const country = selectedMethodObj?.country || 'sn';
      const formattedAddress = getFormattedAddress();

      const payload = {
        amount: Math.round(totalFcfa),
        shipping_fee: deliveryFee,
        customer_name: customerName.trim(),
        phone_number: cleanPhone,
        customer_phone: cleanPhone,
        customer_email: user?.email || undefined,
        user_id: user?.id || undefined,
        country,
        payment_method: isCod ? 'cash_on_delivery' : paymentMethod,
        is_cod: isCod,
        delivery_address: formattedAddress,
        shipping_address: formattedAddress,
        city,
        delivery_type: deliveryMode,
        latitude: gpsCoords?.lat || undefined,
        longitude: gpsCoords?.lng || undefined,
        save_payment_method: savePreference,
        description: `Achat JogaLook (${selectedItems.length} article${selectedItems.length > 1 ? 's' : ''}) - ${customerName.trim()}`,
        items: selectedItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: Number(item.price),
          size: item.selectedSize || undefined,
          variant_id: item.variantId || undefined,
          customization_id: item.customization_id || undefined,
          image: item.image || item.image_url || undefined,
          image_url: item.image_url || item.image || undefined,
          preview_front: (item.customization_id || item.extra_details || item.svg_front) ? item.preview_front : undefined,
          preview_back: (item.customization_id || item.extra_details || item.svg_back) ? item.preview_back : undefined,
          svg_front: item.svg_front || undefined,
          svg_back: item.svg_back || undefined,
          extra_details: item.extra_details || undefined,
          customization: item.extra_details || item.customization || undefined,
        })),
        return_url: `${window.location.origin}/panier?payment_status=success`,
        cancel_url: `${window.location.origin}/panier?payment_status=cancelled`,
      };

      const token = localStorage.getItem('jogalook-token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/service/payment/initiate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Impossible d’initialiser le paiement.');
      }

      if (data.is_cod) {
        selectedItems.forEach(item => removeItem(item.id));
        setIsMobileCheckoutOpen(false);
        setOrderSuccess({
          is_cod: true,
          order_number: data.data?.order_number,
          message: data.message || 'Votre commande a été enregistrée avec succès !',
        });
        return;
      }

      const targetUrl = data.data?.redirectUrl || data.data?.payment_url || data.data?.checkout_url;
      if (targetUrl) {
        window.location.href = targetUrl;
      } else {
        selectedItems.forEach(item => removeItem(item.id));
        setIsMobileCheckoutOpen(false);
        setOrderSuccess({
          is_cod: false,
          order_number: data.data?.order_number,
          message: data.message || 'Paiement initié avec succès.',
        });
      }
    } catch (err) {
      console.error('Erreur checkout:', err);
      setErrorMessage(err.message || 'Une erreur est survenue lors de la validation.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Rendu du formulaire de paiement (réutilisable desktop & modal mobile) ──
  const renderCheckoutForm = (isModal = false) => (
    <div className={`cart-summary-card ${isModal ? 'cart-summary-card--modal' : ''}`}>
      {!isModal && <h2>Finaliser la commande</h2>}

      {errorMessage && (
        <div className="cart-error-alert">
          <AlertTriangleIcon size={16} /> {errorMessage}
        </div>
      )}

      <form onSubmit={handleCheckout} className="cart-form">
        {/* Nom complet */}
        <div className="cart-form-group">
          <label htmlFor={`customerName-${isModal ? 'm' : 'd'}`}>Nom complet *</label>
          <input
            id={`customerName-${isModal ? 'm' : 'd'}`}
            type="text"
            placeholder="Ex : Moussa Diallo"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            required
          />
        </div>

        {/* Téléphone */}
        <div className="cart-form-group">
          <label htmlFor={`phoneNumber-${isModal ? 'm' : 'd'}`}>Numéro de téléphone *</label>
          <input
            id={`phoneNumber-${isModal ? 'm' : 'd'}`}
            type="tel"
            placeholder="77 000 00 00"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            required
          />
        </div>

        {/* Ville de livraison */}
        <div className="cart-form-group">
          <label htmlFor={`city-${isModal ? 'm' : 'd'}`}>
            <MapPinIcon size={14} /> Ville de livraison
          </label>
          <select
            id={`city-${isModal ? 'm' : 'd'}`}
            value={city}
            onChange={e => setCity(e.target.value)}
            className="cart-select"
            disabled={deliveryMode === 'pickup'}
          >
            {CITIES.map(c => (
              <option key={c.id} value={c.id}>{c.label} ({c.fee.toLocaleString('fr-FR')} FCFA)</option>
            ))}
          </select>
        </div>

        {/* Mode de localisation / Réception */}
        <div className="cart-form-group">
          <label htmlFor={`deliveryMode-${isModal ? 'm' : 'd'}`}>
            <NavigationIcon size={14} /> Mode de localisation / Réception
          </label>
          <select
            id={`deliveryMode-${isModal ? 'm' : 'd'}`}
            className="cart-select"
            value={deliveryMode}
            onChange={(e) => {
              const nextMode = e.target.value;
              setDeliveryMode(nextMode);
              if (nextMode === 'gps' && !gpsCoords && !isLocating) {
                handleGetLocation();
              }
            }}
          >
            {DELIVERY_MODES.filter(mode => !mode.dakarOnly || city === 'Dakar').map(mode => (
              <option key={mode.id} value={mode.id}>{mode.label}</option>
            ))}
          </select>

          {/* Vues détaillées du mode de livraison */}
          {deliveryMode === 'gps' && (
            <div className="cart-loc-card cart-loc-card--gps">
              {gpsCoords ? (
                <div className="cart-gps-status">
                  <div className="cart-gps-header">
                    <span className="cart-gps-pulse" />
                    <strong>Position GPS enregistrée</strong>
                    <span className="cart-gps-acc">±{gpsCoords.accuracy}m</span>
                  </div>
                  <div className="cart-gps-coords-text">
                    Lat: {gpsCoords.lat.toFixed(5)} • Lng: {gpsCoords.lng.toFixed(5)}
                  </div>
                  <div className="cart-gps-btns">
                    <a
                      href={`https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cart-gps-map-link"
                    >
                      📍 Voir sur Google Maps →
                    </a>
                    <button
                      type="button"
                      className="cart-gps-rebtn"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                    >
                      {isLocating ? 'Détection…' : '🔄 Réactualiser'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="cart-gps-act-btn"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <>
                      <div className="cart-spinner-sm" />
                      <span>Détection du signal GPS…</span>
                    </>
                  ) : (
                    <>
                      <NavigationIcon size={16} />
                      <span>Activer et capturer ma position GPS exacte</span>
                    </>
                  )}
                </button>
              )}

              {locationError && (
                <p className="cart-error-hint" style={{ marginTop: '6px' }}>{locationError}</p>
              )}
            </div>
          )}

          {deliveryMode === 'phone_call' && (
            <div className="cart-loc-card cart-loc-card--call">
              <div className="cart-call-box">
                <PhoneCallIcon size={20} color="var(--primary, #F15A24)" />
                <div>
                  <strong>Coordination par téléphone</strong>
                  <p>Notre livreur vous appellera directement au <strong>+221 {phoneNumber || 'numéro renseigné'}</strong> pour convenir du lieu exact.</p>
                </div>
              </div>
            </div>
          )}

          {deliveryMode === 'pickup' && (
            <div className="cart-loc-card cart-loc-card--pickup">
              <div className="cart-pickup-box">
                <StoreIcon size={20} color="var(--primary, #F15A24)" />
                <div>
                  <strong>Boutique JogaLook - Point Relais Dakar</strong>
                  <p>Sacré-Cœur 3 / VDN, Dakar • Ouvert du Lundi au Samedi de 9h à 20h</p>
                  <span className="cart-pickup-tag">Retrait 100% gratuit</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Méthode de paiement en SELECTBOX */}
        <div className="cart-form-group">
          <label htmlFor={`paymentMethod-${isModal ? 'm' : 'd'}`}>Mode de règlement</label>
          <select
            id={`paymentMethod-${isModal ? 'm' : 'd'}`}
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="cart-select"
          >
            {PAYMENT_METHODS.map(method => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* Enregistrer la méthode */}
        {user && (
          <label className="cart-save-pref-label">
            <input
              type="checkbox"
              checked={savePreference}
              onChange={e => setSavePreference(e.target.checked)}
            />
            <span>Mémoriser mes coordonnées et ce mode de paiement</span>
          </label>
        )}

        {/* Récapitulatif Total */}
        <div className="cart-total-breakdown">
          <div className="cart-total-row">
            <span>Articles sélectionnés ({selectedItems.length})</span>
            <span>{totalFcfa.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="cart-total-row">
            <span>Frais de livraison</span>
            <span className={deliveryFee === 0 ? 'cart-free-delivery' : ''}>{deliveryFee === 0 ? 'Gratuit' : `${deliveryFee.toLocaleString('fr-FR')} FCFA`}</span>
          </div>
          <div className="cart-total-row cart-total-row--final">
            <span>Total à payer</span>
            <strong>{totalFcfa.toLocaleString('fr-FR')} FCFA</strong>
          </div>
        </div>

        {/* Bouton de validation */}
        <button
          type="submit"
          disabled={submitting || selectedItems.length === 0}
          className="cart-btn cart-btn--primary cart-submit-btn"
        >
          {submitting ? (
            'Traitement en cours…'
          ) : (
            `Payer ${totalFcfa.toLocaleString('fr-FR')} FCFA`
          )}
        </button>
      </form>
    </div>
  );

  return (
    <>
      <Navbar />

      <main className="cart-page">
        <div className="container">
          <div className="cart-page__header">
            <h1>Mon Panier</h1>
            <p>Gérez vos articles, choisissez ceux que vous souhaitez commander et validez en un clic.</p>
          </div>

          <div className="cart-page__actions">
            <Link to="/mes-commandes" className="cart-btn cart-orders-link">
              <span aria-hidden="true">→</span> Voir mes commandes
            </Link>
          </div>

          {/* ── Retour depuis PayBammite ── */}
          {paymentReturn ? (
            <div className={`cart-success-box ${paymentReturn.status === 'cancelled' ? 'cart-success-box--cancelled' : paymentReturn.status === 'pending' ? 'cart-success-box--pending' : ''}`}>
              {paymentReturn.status === 'verifying' ? (
                <>
                  <div className="cart-success-icon">
                    <div className="cart-spinner" />
                  </div>
                  <h2>Vérification du paiement…</h2>
                  <p className="cart-success-msg">Nous confirmons votre paiement auprès de PayBammite. Merci de patienter.</p>
                </>
              ) : paymentReturn.status === 'success' || paymentReturn.status === 'pending' ? (
                <>
                  <div className="cart-success-icon">
                    <CheckCircleIcon size={48} color="#16A34A" />
                  </div>
                  <h2>Paiement confirmé !</h2>
                  <p className="cart-success-msg">
                    {paymentReturn.data?.order_number
                      ? `Votre commande #${paymentReturn.data.order_number} a été validée et enregistrée avec succès.`
                      : 'Votre paiement a bien été reçu et votre commande est en cours de traitement.'}
                    {paymentReturn.data?.amount_fcfa
                      ? ` Montant réglé : ${Number(paymentReturn.data.amount_fcfa).toLocaleString('fr-FR')} FCFA.`
                      : ''}
                  </p>
                  {paymentReturn.data?.transaction_id && (
                    <p className="cart-success-ref">Référence transaction : <strong>{paymentReturn.data.transaction_id}</strong></p>
                  )}
                </>
              ) : paymentReturn.status === 'cancelled' ? (
                <>
                  <div className="cart-success-icon">
                    <XIcon size={48} color="#EF4444" />
                  </div>
                  <h2>Paiement annulé</h2>
                  <p className="cart-success-msg">Votre paiement a été annulé ou a échoué. Vos articles sont toujours dans votre panier, vous pouvez réessayer.</p>
                </>
              ) : (
                <>
                  <div className="cart-success-icon">
                    <AlertTriangleIcon size={48} color="#F59E0B" />
                  </div>
                  <h2>Statut du paiement inconnu</h2>
                  <p className="cart-success-msg">Nous n'avons pas pu confirmer votre paiement. Si le montant a été débité, contactez le support.</p>
                </>
              )}
              <div className="cart-success-actions">
                {paymentReturn.status === 'cancelled' || paymentReturn.status === 'error' ? (
                  <button className="cart-btn cart-btn--primary" onClick={() => setPaymentReturn(null)}>
                    Réessayer
                  </button>
                ) : null}
                <Link to="/catalogue" className="cart-btn cart-btn--outline">Continuer mes achats</Link>
                <Link to="/" className="cart-btn cart-btn--ghost">Retour à l'accueil</Link>
              </div>
            </div>
          ) : /* ── Message de confirmation de commande (COD ou après soumission) ── */
          orderSuccess ? (
            <div className="cart-success-box">
              <div className="cart-success-icon">
                <CheckCircleIcon size={48} color="#16A34A" />
              </div>
              <h2>{orderSuccess.is_cod ? 'Commande confirmée !' : 'Redirection vers le paiement…'}</h2>
              <p className="cart-success-msg">
                {orderSuccess.is_cod
                  ? `Votre commande #${orderSuccess.order_number} a été enregistrée avec succès. Vous réglerez ${Number(orderSuccess.amount).toLocaleString('fr-FR')} FCFA lors de la livraison.`
                  : 'Veuillez patienter pendant la redirection vers la plateforme de paiement sécurisée PayBammite.'
                }
              </p>
              <div className="cart-success-actions">
                <Link to="/catalogue" className="cart-btn cart-btn--outline">Continuer mes achats</Link>
                <Link to="/" className="cart-btn cart-btn--ghost">Retour à l'accueil</Link>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* ── Panier vide ── */
            <div className="cart-empty-state">
              <div className="cart-empty-icon">
                <CartIcon size={56} color="#94A3B8" />
              </div>
              <h2>Votre panier est vide</h2>
              <p>Découvrez nos maillots et équipements personnalisés dans le catalogue.</p>
              <Link to="/catalogue" className="cart-btn cart-btn--primary">Explorer le catalogue</Link>
            </div>
          ) : (
            /* ── Contenu du Panier ── */
            <div className="cart-layout">
              {/* Colonne Gauche : Liste des articles avec Checkbox */}
              <div className="cart-items-column">
                <div className="cart-selection-bar">
                  <label className="cart-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                    />
                    <span>
                      {selectedIds.length === items.length
                        ? 'Tout désélectionner'
                        : `Tout sélectionner (${items.length})`}
                    </span>
                  </label>
                  <span className="cart-selected-count">
                    {selectedItems.length} sur {items.length} article{items.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="cart-items-list">
                  {items.map(item => {
                    const isSelected = selectedIds.includes(item.id);
                    const itemTotal = (Number(item.price || 0) * (item.quantity || 1));
                    const isCustom = item.category === 'Maillot Personnalisé' || !!item.customization_id || !!item.extra_details?.playerName;

                    return (
                      <div key={item.id} className={`cart-item-card ${isSelected ? 'cart-item-card--selected' : ''} ${isCustom ? 'cart-item-card--custom' : ''}`}>
                        {/* Checkbox de sélection individuelle */}
                        <div className="cart-item-check">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                            aria-label={`Sélectionner ${item.name}`}
                          />
                        </div>

                        {/* Image — avec toggle Face/Dos si maillot personnalisé */}
                        <div className="cart-item-img-wrap">
                          <CartItemPreview item={item} />
                        </div>

                        {/* Détails produit */}
                        <div className="cart-item-details">
                          <h3 className="cart-item-title">
                            {isCustom && <span className="cart-custom-badge">🎨 Personnalisé</span>}
                            {item.name}
                          </h3>
                          <div className="cart-item-tags-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                            {item.selectedSize && (
                              <span className="cart-item-tag">Taille : {item.selectedSize}</span>
                            )}
                            {item.extra_details?.playerName && (
                              <span className="cart-item-tag" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 'bold' }}>
                                ✍️ {item.extra_details.playerName} {item.extra_details.playerNumber ? `#${item.extra_details.playerNumber}` : ''}
                              </span>
                            )}
                            {item.extra_details?.textColor && item.extra_details?.playerName && (
                              <span className="cart-item-tag" style={{ background: '#f0f9ff', color: '#0369a1', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.extra_details.textColor, border: '1px solid #ccc', display: 'inline-block' }} />
                                Flocage
                              </span>
                            )}
                            {item.extra_details?.selectedColor && (
                              <span className="cart-item-tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.extra_details.bodyColor || item.extra_details.selectedColor, border: '1px solid #ccc', display: 'inline-block' }} />
                                Corps
                              </span>
                            )}
                            {item.extra_details?.badgeAttached && (
                              <span className="cart-item-tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                                🛡️ Blason Club
                              </span>
                            )}
                          </div>
                          <div className="cart-item-price-unit">
                            {Math.round(Number(item.price)).toLocaleString('fr-FR')} FCFA / unité
                          </div>
                          {isCustom && item.template_id && (
                            <Link
                              to={`/custom/${item.template_id}`}
                              className="cart-item-edit-link"
                              style={{ fontSize: '0.76rem', color: '#f15a24', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}
                            >
                              ✏️ Modifier dans l'atelier
                            </Link>
                          )}
                        </div>

                        {/* Quantité & Sous-total */}
                        <div className="cart-item-controls">
                          <div className="cart-qty-picker">
                            <button
                              type="button"
                              disabled={item.quantity <= 1}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Diminuer"
                            >−</button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Augmenter"
                            >+</button>
                          </div>

                          <div className="cart-item-subtotal">
                            {Math.round(itemTotal).toLocaleString('fr-FR')} FCFA
                          </div>

                          <button
                            type="button"
                            className="cart-item-remove-btn"
                            onClick={() => removeItem(item.id)}
                            title="Supprimer du panier"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bloc Récapitulatif & Bouton de déclenchement sur Petit Écran */}
                <div className="cart-mobile-summary-card">
                  <div className="cart-mobile-summary-header">
                    <div>
                      <span className="cart-mobile-summary-count">
                        {selectedItems.length} article{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''}
                      </span>
                      <strong className="cart-mobile-summary-total">
                        {totalFcfa.toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                    <span className="cart-free-delivery-badge">Livraison gratuite</span>
                  </div>

                  <button
                    type="button"
                    className="cart-btn cart-btn--primary cart-mobile-open-btn"
                    disabled={selectedItems.length === 0}
                    onClick={openCheckout}
                  >
                    <LockIcon size={16} /> Finaliser la commande ({totalFcfa.toLocaleString('fr-FR')} FCFA)
                  </button>
                </div>
              </div>

              {/* Colonne Droite (Desktop uniquement) */}
              <div className="cart-checkout-column">
                {renderCheckoutForm(false)}
              </div>
            </div>
          )}
        </div>

        {/* ── Barre flottante d'action rapide sur mobile ── */}
        {!orderSuccess && items.length > 0 && selectedItems.length > 0 && (
          <div className="cart-mobile-sticky-bar">
            <div className="cart-mobile-sticky-info">
              <span className="cart-mobile-sticky-label">{selectedItems.length} article{selectedItems.length > 1 ? 's' : ''}</span>
              <strong className="cart-mobile-sticky-price">{totalFcfa.toLocaleString('fr-FR')} FCFA</strong>
            </div>
            <button
              type="button"
              className="cart-btn cart-btn--primary cart-mobile-sticky-btn"
              onClick={openCheckout}
            >
              <LockIcon size={15} /> Finaliser
            </button>
          </div>
        )}

        {/* ── MODAL POPUP DE FINALISATION / PAIEMENT SUR PETITS ÉCRANS ── */}
        {isMobileCheckoutOpen && (
          <div
            className="cart-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsMobileCheckoutOpen(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Finaliser la commande"
          >
            <div className="cart-modal-window">
              <div className="cart-modal-header">
                <div className="cart-modal-header-titles">
                  <h2>Finaliser la commande</h2>
                  <span className="cart-modal-subtitle">
                    {selectedItems.length} article{selectedItems.length > 1 ? 's' : ''} • {totalFcfa.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <button
                  type="button"
                  className="cart-modal-close-btn"
                  onClick={() => setIsMobileCheckoutOpen(false)}
                  aria-label="Fermer la fenêtre de commande"
                >
                  <XIcon size={18} />
                </button>
              </div>

              <div className="cart-modal-body">
                {renderCheckoutForm(true)}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
