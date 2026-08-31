import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CartIcon, InfoIcon, AlertTriangleIcon, CreditCardIcon, NewspaperIcon } from './icons/AppIcons';
import './CheckoutModal.css';

/* ─── Méthodes de paiement disponibles ─── */
const PAYMENT_METHODS = [
  { id: 'wave',                   label: 'Wave (Sénégal 🇸🇳)',              country: 'sn' },
  { id: 'orange_money',           label: 'Orange Money (Sénégal 🇸🇳)',       country: 'sn' },
  { id: 'free_money',             label: 'Free Money (Sénégal 🇸🇳)',         country: 'sn' },
  { id: 'wave_ci',                label: 'Wave (Côte d\'Ivoire 🇨🇮)',       country: 'ci' },
  { id: 'orange_money_ci',        label: 'Orange Money (Côte d\'Ivoire 🇨🇮)',country: 'ci' },
  { id: 'mtn_ci',                 label: 'MTN Mobile (Côte d\'Ivoire 🇨🇮)',  country: 'ci' },
  { id: 'moov_ci',                label: 'Moov (Côte d\'Ivoire 🇨🇮)',        country: 'ci' },
  { id: 'orange_money_burkina',   label: 'Orange Money (Burkina Faso 🇧🇫)', country: 'bf' },
  { id: 'moov_burkina',           label: 'Moov Money (Burkina Faso 🇧🇫)',   country: 'bf' },
  { id: 'card',                   label: 'Carte bancaire (Visa / MasterCard 💳)', country: 'sn' },
];

export default function CheckoutModal({ open, onClose }) {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();

  const [customerName, setCustomerName]       = useState('');
  const [phoneNumber, setPhoneNumber]         = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod]     = useState('wave');
  const [isCod, setIsCod]                     = useState(false);
  const [savePreference, setSavePreference]   = useState(true);
  const [codEligible, setCodEligible]         = useState(true);
  const [codReason, setCodReason]             = useState('');

  const [errors, setErrors]                   = useState({});
  const [step, setStep]                       = useState('cart'); // 'cart' | 'info' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg]               = useState('');
  const [paymentData, setPaymentData]         = useState(null);

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
              if (info.delivery_address) setShippingAddress(info.delivery_address);
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
      const t = setTimeout(() => {
        setStep('cart'); setErrors({}); setErrorMsg(''); setPaymentData(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const totalFcfa = Math.round(total);
  const isCodAmountValid = totalFcfa >= 5000 && totalFcfa <= 100000;
  const canUseCod = isCodAmountValid && codEligible;

  useEffect(() => {
    if (isCod && !canUseCod) setIsCod(false);
  }, [isCod, canUseCod]);

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
    if (!validate()) return;
    setStep('loading');
    try {
      const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, '');
      const chosenMethod = isCod ? 'cash_on_delivery' : paymentMethod;
      const selectedMethodObj = PAYMENT_METHODS.find(m => m.id === paymentMethod);
      const country = selectedMethodObj?.country || 'sn';

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
          shipping_address: shippingAddress.trim() || null,
          country,
          customer_email: user?.email || null,
          save_payment_method: savePreference,
          amount: totalFcfa,
          return_url: `${window.location.origin}/panier?payment_status=success`,
          cancel_url: `${window.location.origin}/panier?payment_status=cancelled`,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setPaymentData(json.data);
        clearCart();

        if (json.is_cod) {
          setStep('success');
        } else {
          const targetUrl = json.data?.redirectUrl || json.data?.payment_url || json.data?.checkout_url;
          if (targetUrl) {
            window.location.href = targetUrl;
          } else {
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
  }, [validate, customerName, phoneNumber, paymentMethod, isCod, shippingAddress, savePreference, totalFcfa, items, user, clearCart]);

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
            {step === 'info' && (
              <button className="cm-back-btn" onClick={() => setStep('cart')} aria-label="Retour">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
            )}
            <div>
              <h2 className="cm-title">
                {step === 'cart'    && 'Mon panier'}
                {step === 'info'    && 'Validation de commande'}
                {step === 'loading' && 'Traitement…'}
                {step === 'success' && 'Commande confirmée !'}
                {step === 'error'   && 'Erreur'}
              </h2>
              {step === 'cart' && items.length > 0 && (
                <span className="cm-subtitle">{itemCount} article{itemCount > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          <button className="cm-close-btn" onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* STEP 1 — PANIER & AJUSTEMENT QUANTITÉS */}
        {step === 'cart' && (
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
              <>
                <div className="cm-items">
                  {items.map((item) => (
                    <div key={item.id} className="cm-item">
                      <div className="cm-item__img-wrap">
                        <img src={item.image} alt={item.name} className="cm-item__img" loading="lazy" />
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
                            onClick={() => item.quantity <= 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Diminuer">−</button>
                          <span className="cm-qty__val">{item.quantity}</span>
                          <button className="cm-qty__btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Augmenter">+</button>
                        </div>
                        <p className="cm-item__subtotal">
                          {(item.quantity * Number(item.price)).toLocaleString('fr-FR')} FCFA
                        </p>
                        <button className="cm-item__remove" onClick={() => removeItem(item.id)} aria-label={`Supprimer ${item.name}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cm-full-cart-link-box">
                  <Link to="/panier" onClick={onClose} className="cm-full-cart-link">
                    <NewspaperIcon size={15} /> Voir la page panier complète (sélection par article) →
                  </Link>
                </div>

                <div className="cm-total-row">
                  <span>Total</span>
                  <strong>{totalFcfa.toLocaleString('fr-FR')} FCFA</strong>
                </div>

                <div className="cm-footer">
                  <button className="cm-btn cm-btn--outline" onClick={onClose}>Continuer</button>
                  <button className="cm-btn cm-btn--primary" onClick={() => setStep('info')}>
                    Valider le panier
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* STEP 2 — INFOS CLIENT & SELECTBOX MÉTHODE DE PAIEMENT */}
        {step === 'info' && (
          <div className="cm-form">
            <div className="cm-recap">
              <span>{itemCount} article{itemCount > 1 ? 's' : ''}</span>
              <strong>{totalFcfa.toLocaleString('fr-FR')} FCFA</strong>
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
                Numéro de téléphone
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

            {/* Adresse */}
            <div className="cm-field">
              <label className="cm-field__label" htmlFor="cm-address">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Adresse de livraison (optionnel)
              </label>
              <input id="cm-address" type="text" className="cm-field__input"
                placeholder="Quartier, Ville, Indications..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)} />
            </div>

            {/* Méthode paiement en SELECTBOX */}
            <div className={`cm-field${errors.paymentMethod ? ' cm-field--error' : ''}`}>
              <label className="cm-field__label" htmlFor="cm-method-select">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Mode de règlement
              </label>
              <select
                id="cm-method-select"
                className="cm-field__input cm-select"
                value={paymentMethod}
                onChange={(e) => { setPaymentMethod(e.target.value); setErrors(er => ({ ...er, paymentMethod: '' })); }}
                disabled={isCod}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.label}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && <p className="cm-field__err">{errors.paymentMethod}</p>}
            </div>

            {/* Checkbox Payer à la livraison */}
            <div className={`cm-cod-box ${!canUseCod ? 'cm-cod-box--disabled' : ''}`}>
              <label className="cm-cod-label">
                <input
                  type="checkbox"
                  checked={isCod}
                  disabled={!canUseCod}
                  onChange={e => setIsCod(e.target.checked)}
                />
                <div>
                  <strong>
                    <CreditCardIcon size={16} /> Payer à la livraison
                  </strong>
                  <span>Réglez en espèces à la réception de votre colis.</span>
                </div>
              </label>
              {!isCodAmountValid && (
                <span className="cm-cod-note">
                  <InfoIcon size={14} /> Disponible uniquement entre 5 000 et 100 000 FCFA.
                </span>
              )}
              {!codEligible && (
                <span className="cm-cod-note cm-cod-note--err">
                  <AlertTriangleIcon size={14} /> Non disponible pour ce compte ({codReason || 'Non éligible'}).
                </span>
              )}
            </div>

            {/* Mémoriser les préférences */}
            {user && (
              <label className="cm-save-pref-label">
                <input
                  type="checkbox"
                  checked={savePreference}
                  onChange={e => setSavePreference(e.target.checked)}
                />
                <span>Mémoriser ce mode de paiement pour mes prochaines commandes</span>
              </label>
            )}

            <div className="cm-footer">
              <div className="cm-footer__total">
                <span>À payer</span>
                <strong>{totalFcfa.toLocaleString('fr-FR')} FCFA</strong>
              </div>
              <button className="cm-btn cm-btn--primary cm-btn--pay" onClick={handleSubmit}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                {isCod ? `Valider (paiement livraison)` : `Payer ${totalFcfa.toLocaleString('fr-FR')} FCFA`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — LOADING */}
        {step === 'loading' && (
          <div className="cm-state cm-state--loading">
            <div className="cm-spinner" />
            <p>{isCod ? 'Enregistrement de la commande…' : 'Connexion à PayBammite…'}</p>
            <span>Veuillez patienter</span>
          </div>
        )}

        {/* STEP 4 — SUCCÈS */}
        {step === 'success' && (
          <div className="cm-state cm-state--success">
            <div className="cm-state__icon cm-state__icon--success">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>Commande confirmée !</h3>
            {paymentData?.is_cod || isCod ? (
              <p>Votre commande #{paymentData?.order_number} a été enregistrée avec succès. Vous réglerez à la livraison.</p>
            ) : paymentData?.checkout_url ? (
              <p>Redirection vers la passerelle sécurisée PayBammite…</p>
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

        {/* STEP 5 — ERREUR */}
        {step === 'error' && (
          <div className="cm-state cm-state--error">
            <div className="cm-state__icon cm-state__icon--error">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3>Échec de validation</h3>
            <p>{errorMsg}</p>
            <div className="cm-error-actions">
              <button className="cm-btn cm-btn--outline" onClick={() => setStep('info')}>Réessayer</button>
              <button className="cm-btn cm-btn--ghost" onClick={onClose}>Annuler</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
