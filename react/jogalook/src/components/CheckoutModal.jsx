import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  CartIcon, 
  InfoIcon, 
  AlertTriangleIcon, 
  CreditCardIcon, 
  MapPinIcon, 
  NavigationIcon, 
  PhoneCallIcon, 
  StoreIcon 
} from './icons/AppIcons';
import './CheckoutModal.css';
import JerseyPreview from './JerseyPreview';
import LocationPromptModal from './LocationPromptModal';

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

/* ─── Méthodes de paiement disponibles ─── */
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

export default function CheckoutModal({ open, onClose }) {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName]       = useState('');
  const [phoneNumber, setPhoneNumber]         = useState('');
  
  // Localisation & Ville
  const [city, setCity]                       = useState('Dakar');
  const [deliveryMode, setDeliveryMode]       = useState('gps'); // 'gps' | 'phone_call' | 'pickup'
  const [gpsCoords, setGpsCoords]             = useState(null);
  const [isLocating, setIsLocating]           = useState(false);
  const [locationError, setLocationError]     = useState('');

  const [paymentMethod, setPaymentMethod]     = useState('wave');
  const [isCod, setIsCod]                     = useState(false);
  const [savePreference, setSavePreference]   = useState(true);
  const [codEligible, setCodEligible]         = useState(true);
  const [codReason, setCodReason]             = useState('');

  const [errors, setErrors]                   = useState({});
  const [step, setStep]                       = useState('checkout'); // 'checkout' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg]               = useState('');
  const [paymentData, setPaymentData]         = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Fonction pour capturer la géolocalisation GPS
  const handleGetLocation = useCallback(() => {
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
        setErrors(er => ({ ...er, location: '' }));
        setLocationError('');
        setIsLocationModalOpen(false);
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Impossible d’obtenir votre position GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Accès à la position refusé. Veuillez autoriser la localisation dans les réglages de votre navigateur ou choisir une autre option.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Le délai de détection GPS a expiré. Veuillez réessayer ou choisir une autre option.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Signal GPS indisponible. Veuillez réessayer ou choisir une autre option.';
        }
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const handleChooseOtherOption = useCallback(() => {
    setIsLocationModalOpen(false);
    setLocationError('');
    setErrors(er => ({ ...er, location: '' }));
    setDeliveryMode('phone_call');
    setTimeout(() => {
      const el = document.getElementById('cm-delivery-mode');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 100);
  }, []);

  // Pré-remplissage avec l'utilisateur connecté (table userinfo)
  useEffect(() => {
    const localUser = user || JSON.parse(localStorage.getItem('jogalook-user') || 'null');
    const token = localStorage.getItem('jogalook-token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    if (localUser) {
      const fullName = [localUser.first_name, localUser.last_name].filter(Boolean).join(' ');
      if (fullName && !customerName) setCustomerName(fullName);
      if (localUser.phone && !phoneNumber) setPhoneNumber(localUser.phone);
    }

    if (open) {
      const userIdQuery = localUser?.id ? `user_id=${localUser.id}` : '';
      const phoneQuery  = localUser?.phone ? `phone=${encodeURIComponent(localUser.phone)}` : '';
      const emailQuery  = localUser?.email ? `email=${encodeURIComponent(localUser.email)}` : '';
      const queryParts  = [userIdQuery, phoneQuery, emailQuery].filter(Boolean).join('&');

      fetch(`/service/payment/user-preferences?${queryParts}`, { headers })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            const info = res.data.user_info;
            if (info) {
              if (info.customer_name) setCustomerName(info.customer_name);
              if (info.phone_number) {
                const clean = String(info.phone_number).replace(/^(\+|00)?221/, '').replace(/[\s\-\.]/g, '');
                setPhoneNumber(clean);
              }
              if (info.delivery_address) {
                const rawAddr = info.delivery_address;
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
        .catch(() => {});
    }
  }, [user, open]);

  useEffect(() => {
    if (!open) {
      setIsLocationModalOpen(false);
      const t = setTimeout(() => {
        setStep('checkout'); setErrors({}); setErrorMsg(''); setPaymentData(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const getDeliveryFee = (cityName = city, mode = deliveryMode) => {
    if (mode === 'pickup') return 0;
    return cityName === 'Dakar' ? 1000 : 5000;
  };

  const deliveryFee = getDeliveryFee(city, deliveryMode);
  const totalFcfa = Math.round(total + deliveryFee);
  const isCodAmountValid = totalFcfa >= 5000 && totalFcfa <= 100000;
  const canUseCod = isCodAmountValid && codEligible;

  useEffect(() => {
    if (isCod && !canUseCod) setIsCod(false);
  }, [isCod, canUseCod]);

  // Si on quitte Dakar et que le mode était Retrait en boutique, basculer sur GPS
  useEffect(() => {
    if (city !== 'Dakar' && deliveryMode === 'pickup') {
      setDeliveryMode('gps');
    }
  }, [city, deliveryMode]);

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

  const validate = () => {
    const errs = {};
    if (!customerName.trim()) errs.customerName = 'Le nom est requis.';
    if (!phoneNumber.trim())  errs.phoneNumber  = 'Le numéro est requis.';
    else if (!/^\d{7,15}$/.test(phoneNumber.replace(/\s/g, '')))
      errs.phoneNumber = 'Numéro invalide (7 à 15 chiffres).';

    if (!isCod && !paymentMethod) errs.paymentMethod = 'Choisissez une méthode.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!user) {
      onClose();
      navigate('/login', { state: { from: '/panier' } });
      return;
    }

    if (!validate()) return;

    // Si l'option GPS est sélectionnée et que la localisation n'est pas encore accordée
    if (deliveryMode === 'gps' && !gpsCoords) {
      setLocationError('');
      setIsLocationModalOpen(true);
      return;
    }

    setStep('loading');
    try {
      const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, '');
      const chosenMethod = paymentMethod;
      const selectedMethodObj = PAYMENT_METHODS.find(m => m.id === paymentMethod);
      const country = selectedMethodObj?.country || 'sn';
      const formattedAddress = getFormattedAddress();

      const res = await fetch('/service/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          user_id: user?.id || null,
          payment_method: chosenMethod,
          customer_name:  customerName.trim(),
          phone_number:   cleanPhone,
          customer_phone: cleanPhone,
          shipping_address: formattedAddress,
          delivery_address: formattedAddress,
          city,
          delivery_type: deliveryMode,
          latitude: gpsCoords?.lat || null,
          longitude: gpsCoords?.lng || null,
          country,
          customer_email: user?.email || null,
          save_payment_method: savePreference,
          amount: totalFcfa,
          shipping_fee: deliveryFee,
          return_url: `${window.location.origin}/panier?payment_status=success`,
          cancel_url: `${window.location.origin}/panier?payment_status=cancelled`,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setPaymentData(json.data);

        if (json.is_cod) {
          clearCart();
          setStep('success');
        } else {
          const targetUrl = json.data?.redirectUrl || json.data?.payment_url || json.data?.checkout_url;
          if (targetUrl) {
            window.location.href = targetUrl;
          } else {
            clearCart();
            setStep('success');
          }
        }
      } else {
        setErrorMsg(json.message || 'Une erreur est survenue.');
        setStep('error');
      }
    } catch {
      setErrorMsg('Impossible de contacter le serveur. Vérifiez votre connexion.');
      setStep('error');
    }
  }, [validate, customerName, phoneNumber, paymentMethod, isCod, city, deliveryMode, gpsCoords, savePreference, totalFcfa, items, user, clearCart, onClose, navigate]);

  if (!open) return null;

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div
      className={`cm-overlay${open ? ' cm-overlay--visible' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true" aria-label="Finaliser la commande"
    >
      <div className="cm-modal">

        {/* HEADER */}
        <div className="cm-header">
          <div className="cm-header__left">
            <div>
              <h2 className="cm-title">
                {step === 'checkout' && 'Finaliser la commande'}
                {step === 'loading'  && 'Traitement…'}
                {step === 'success'  && 'Commande confirmée !'}
                {step === 'error'    && 'Erreur'}
              </h2>
              {step === 'checkout' && items.length > 0 && (
                <span className="cm-subtitle">{itemCount} article{itemCount > 1 ? 's' : ''} • {totalFcfa.toLocaleString('fr-FR')} FCFA</span>
              )}
            </div>
          </div>
          <button className="cm-close-btn" onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* CORPS PRINCIPAL : FORMULAIRE DIRECT & RÉCAPITULATIF */}
        {step === 'checkout' && (
          <>
            {items.length === 0 ? (
              <div className="cm-empty">
                <span className="cm-empty__icon">
                  <CartIcon size={44} color="#94A3B8" />
                </span>
                <p>Votre panier est vide.</p>
                <button className="cm-btn cm-btn--outline" onClick={onClose}>Continuer mes achats</button>
              </div>
            ) : (
              <div className="cm-form">
                {/* 1. Bloc Articles (compact & interactif) */}
                <div className="cm-items-preview-box">
                  <div className="cm-items-preview-header">
                    <span className="cm-section-label">Articles commandés ({itemCount})</span>
                    <Link to="/panier" onClick={onClose} className="cm-items-preview-link">
                      Modifier dans le panier →
                    </Link>
                  </div>
                  <div className="cm-items cm-items--compact">
                    {items.map((item) => (
                      <div key={item.id} className="cm-item">
                        <div className="cm-item__img-wrap">
                          <JerseyPreview item={item} side="front" alt={item.name} className="cm-item__img" />
                        </div>
                        <div className="cm-item__info">
                          <p className="cm-item__name">{item.name}</p>
                          {item.selectedSize && (
                            <p className="cm-item__variant">Taille : {item.selectedSize}</p>
                          )}
                          <p className="cm-item__price">{Number(item.price).toLocaleString('fr-FR')} FCFA</p>
                        </div>
                        <div className="cm-item__right">
                          <div className="cm-qty">
                            <button className="cm-qty__btn"
                              disabled={item.quantity <= 1}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Diminuer">−
                            </button>
                            <span className="cm-qty__val">{item.quantity}</span>
                            <button className="cm-qty__btn"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Augmenter">+
                            </button>
                          </div>
                          <span className="cm-item__subtotal">
                            {(item.quantity * Number(item.price)).toLocaleString('fr-FR')} F
                          </span>
                          <button
                            type="button"
                            className="cm-item__remove"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Supprimer ${item.name}`}
                            title="Supprimer du panier"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Coordonnées de livraison */}
                <div className="cm-section-divider">
                  <span className="cm-section-label">Coordonnées de livraison</span>
                </div>

                {/* Nom */}
                <div className={`cm-field${errors.customerName ? ' cm-field--error' : ''}`}>
                  <label className="cm-field__label" htmlFor="cm-name">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Nom complet
                  </label>
                  <input id="cm-name" type="text" className="cm-field__input"
                    placeholder="Ex : Moussa Diallo" value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); setErrors(er => ({ ...er, customerName: '' })); }}
                    autoComplete="name" />
                  {errors.customerName && <p className="cm-field__err">{errors.customerName}</p>}
                </div>

                {/* Téléphone */}
                <div className={`cm-field${errors.phoneNumber ? ' cm-field--error' : ''}`}>
                  <label className="cm-field__label" htmlFor="cm-phone">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3-8.58A2 2 0 0 1 3.14 1.34h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Numéro de téléphone (Mobile Money)
                  </label>
                  <div className="cm-phone-wrap">
                    <span className="cm-phone-prefix">+221</span>
                    <input id="cm-phone" type="tel" className="cm-field__input cm-field__input--tel"
                      placeholder="77 000 00 00" value={phoneNumber}
                      onChange={(e) => { setPhoneNumber(e.target.value); setErrors(er => ({ ...er, phoneNumber: '' })); }}
                      autoComplete="tel" inputMode="numeric" />
                  </div>
                  {errors.phoneNumber && <p className="cm-field__err">{errors.phoneNumber}</p>}
                </div>

                {/* Ville de livraison */}
                <div className="cm-field">
                  <label className="cm-field__label" htmlFor="cm-city">
                    <MapPinIcon size={14} />
                    Ville de livraison
                  </label>
                  <select
                    id="cm-city"
                    className="cm-field__input cm-select"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={deliveryMode === 'pickup'}
                  >
                    {CITIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label} ({c.fee.toLocaleString('fr-FR')} FCFA)</option>
                    ))}
                  </select>
                </div>

                {/* Options de localisation / Mode de réception */}
                <div className="cm-field">
                  <label className="cm-field__label" htmlFor="cm-delivery-mode">
                    <NavigationIcon size={14} />
                    Mode de localisation / Réception
                  </label>
                  <select
                    id="cm-delivery-mode"
                    className="cm-field__input cm-select"
                    value={deliveryMode}
                    onChange={(e) => {
                      const nextMode = e.target.value;
                      setDeliveryMode(nextMode);
                      setErrors(er => ({ ...er, location: '', manualAddress: '' }));
                      if (nextMode === 'gps' && !gpsCoords && !isLocating) {
                        handleGetLocation();
                      }
                    }}
                  >
                    {DELIVERY_MODES.filter((mode) => !mode.dakarOnly || city === 'Dakar').map((mode) => (
                      <option key={mode.id} value={mode.id}>{mode.label}</option>
                    ))}
                  </select>

                  {/* Vues détaillées selon l'option choisie */}
                  
                  {/* 1. Mode GPS */}
                  {deliveryMode === 'gps' && (
                    <div className="cm-loc-card cm-loc-card--gps">
                      {gpsCoords ? (
                        <div className="cm-gps-status cm-gps-status--success">
                          <div className="cm-gps-header">
                            <span className="cm-gps-pulse" />
                            <strong>Position GPS enregistrée</strong>
                            <span className="cm-gps-acc">Précision: ±{gpsCoords.accuracy}m</span>
                          </div>
                          <div className="cm-gps-coords-text">
                            Lat: {gpsCoords.lat.toFixed(5)} • Lng: {gpsCoords.lng.toFixed(5)}
                          </div>
                          <div className="cm-gps-btns">
                            <a
                              href={`https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cm-gps-map-link"
                            >
                              Visualiser sur Google Maps →
                            </a>
                            <button
                              type="button"
                              className="cm-gps-rebtn"
                              onClick={handleGetLocation}
                              disabled={isLocating}
                            >
                              {isLocating ? 'Détection…' : 'Réactualiser'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="cm-gps-act-btn"
                          onClick={handleGetLocation}
                          disabled={isLocating}
                        >
                          {isLocating ? (
                            <>
                              <div className="cm-spinner-sm" />
                              <span>Recherche du signal satellite en cours…</span>
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
                        <p className="cm-field__err" style={{ marginTop: '6px' }}>{locationError}</p>
                      )}
                      {errors.location && (
                        <p className="cm-field__err" style={{ marginTop: '6px' }}>{errors.location}</p>
                      )}
                    </div>
                  )}

                  {/* 3. Mode Appel téléphonique */}
                  {deliveryMode === 'phone_call' && (
                    <div className="cm-loc-card cm-loc-card--call">
                      <div className="cm-call-box">
                        <PhoneCallIcon size={22} color="var(--primary, #F15A24)" />
                        <div>
                          <strong>Coordination directe par téléphone</strong>
                          <p>Notre livreur vous appellera directement au <strong>+221 {phoneNumber || 'numéro renseigné'}</strong> pour convenir de l'endroit exact au moment de la livraison.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Mode Retrait Boutique (Dakar) */}
                  {deliveryMode === 'pickup' && (
                    <div className="cm-loc-card cm-loc-card--pickup">
                      <div className="cm-pickup-box">
                        <StoreIcon size={22} color="var(--primary, #F15A24)" />
                        <div>
                          <strong>Boutique JogaLook - Point Relais Dakar</strong>
                          <p>Sacré-Cœur 3 / VDN, Dakar • Ouvert du Lundi au Samedi de 9h à 20h</p>
                          <span className="cm-pickup-tag">Retrait 100% gratuit sans frais de livraison</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Moyen de paiement */}
                <div className="cm-section-divider">
                  <span className="cm-section-label">Mode de règlement</span>
                </div>

                <div className={`cm-field${errors.paymentMethod ? ' cm-field--error' : ''}`}>
                  <select
                    id="cm-method-select"
                    className="cm-field__input cm-select"
                    value={paymentMethod}
                    onChange={(e) => { setPaymentMethod(e.target.value); setErrors(er => ({ ...er, paymentMethod: '' })); }}
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {errors.paymentMethod && <p className="cm-field__err">{errors.paymentMethod}</p>}
                </div>

                {/* Mémoriser les préférences */}
                {user && (
                  <label className="cm-save-pref-label">
                    <input
                      type="checkbox"
                      checked={savePreference}
                      onChange={e => setSavePreference(e.target.checked)}
                    />
                    <span>Mémoriser ces coordonnées pour mes prochains achats</span>
                  </label>
                )}

                {/* FOOTER FIXE AVEC BOUTON DIRECT */}
                <div className="cm-footer">
                  <div className="cm-footer__total">
                    <span>Total net</span>
                    <strong>{totalFcfa.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <button className="cm-btn cm-btn--primary cm-btn--pay" onClick={handleSubmit}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    {`Payer ${totalFcfa.toLocaleString('fr-FR')} FCFA`}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* STEP 2 — LOADING */}
        {step === 'loading' && (
          <div className="cm-state cm-state--loading">
            <div className="cm-spinner" />
            <p>{isCod ? 'Enregistrement de la commande…' : 'Connexion sécurisée à PayBammite…'}</p>
            <span>Redirection immédiate en cours…</span>
          </div>
        )}

        {/* STEP 3 — SUCCÈS (COD ou fallback) */}
        {step === 'success' && (
          <div className="cm-state cm-state--success">
            <div className="cm-state__icon cm-state__icon--success">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>Commande confirmée !</h3>
            {paymentData?.is_cod || isCod ? (
              <p>Votre commande #{paymentData?.order_number} a été enregistrée avec succès. Vous réglerez {Number(totalFcfa).toLocaleString('fr-FR')} FCFA à la livraison.</p>
            ) : (
              <p>Votre commande #{paymentData?.order_number} a été validée avec succès.</p>
            )}
            {(paymentData?.redirectUrl || paymentData?.payment_url || paymentData?.checkout_url) && !isCod && (
              <a
                href={paymentData.redirectUrl || paymentData.payment_url || paymentData.checkout_url}
                className="cm-btn cm-btn--primary"
              >
                Payer maintenant →
              </a>
            )}
            <div style={{ marginTop: '16px' }}>
              <button className="cm-btn cm-btn--outline" onClick={onClose}>Fermer</button>
            </div>
          </div>
        )}

        {/* STEP 4 — ERREUR */}
        {step === 'error' && (
          <div className="cm-state cm-state--error">
            <div className="cm-state__icon cm-state__icon--error">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3>Échec de validation</h3>
            <p>{errorMsg}</p>
            <div className="cm-error-actions">
              <button className="cm-btn cm-btn--outline" onClick={() => setStep('checkout')}>Réessayer</button>
              <button className="cm-btn cm-btn--ghost" onClick={onClose}>Annuler</button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL DE CONFIRMATION / AUTORISATION GÉOLOCALISATION */}
      <LocationPromptModal
        open={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onAuthorize={handleGetLocation}
        onChooseOther={handleChooseOtherOption}
        isLocating={isLocating}
        error={locationError}
      />
    </div>
  );
}
