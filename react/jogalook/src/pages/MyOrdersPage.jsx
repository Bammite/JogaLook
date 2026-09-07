import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import JerseyPreview from '../components/JerseyPreview';
import './MyOrdersPage.css';

/**
 * ─── 4 STATUTS AFFICHÉS AU CLIENT ───
 * 1. "Commande validée"
 * 2. "En cours de livraison"
 * 3. "Livrée"
 * 4. "Annulée"
 */
export function getCustomerStatus(order) {
  const rawStatus = String(order?.status || 'PENDING').toUpperCase();
  const latestDelivery = Array.isArray(order?.deliveries) && order.deliveries.length > 0
    ? [...order.deliveries].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0]
    : null;
  const deliveryStatus = String(latestDelivery?.status || order?.delivery_status || '').toUpperCase();

  // 4. Annulée / Remboursée
  if (['CANCELLED', 'ANNULEE', 'REFUNDED', 'REMBOURSEE', 'FAILED'].includes(rawStatus) || deliveryStatus === 'FAILED') {
    return {
      key: 'CANCELLED',
      label: 'Annulée',
      badgeClass: 'my-order-card__status--cancelled',
      color: '#B53535',
      icon: '✕',
      step: 0,
      description: 'Cette commande a été annulée ou remboursée.'
    };
  }

  // 3. Livrée
  if (['DELIVERED', 'LIVREE'].includes(rawStatus) || ['DELIVERED', 'LIVREE'].includes(deliveryStatus)) {
    return {
      key: 'DELIVERED',
      label: 'Livrée',
      badgeClass: 'my-order-card__status--delivered',
      color: '#1D7B3A',
      icon: '✓',
      step: 3,
      description: 'Votre colis a été remis en mains propres avec succès.'
    };
  }

  // 2. En cours de livraison
  if (
    ['SHIPPED', 'EXPEDIEE', 'IN_TRANSIT'].includes(rawStatus) ||
    ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'SHIPPED'].includes(deliveryStatus)
  ) {
    return {
      key: 'IN_TRANSIT',
      label: 'En cours de livraison',
      badgeClass: 'my-order-card__status--in_transit',
      color: '#0D6C52',
      icon: '🚚',
      step: 2,
      description: 'Votre colis est expédié et en route avec notre livreur.'
    };
  }

  // 1. Commande validée (Défaut pour PENDING, PAID, CONFIRMED, PROCESSING, PREPARING)
  return {
    key: 'VALIDATED',
    label: 'Commande validée',
    badgeClass: 'my-order-card__status--validated',
    color: '#1147A5',
    icon: '✓',
    step: 1,
    description: 'Votre commande est bien confirmée et en cours de préparation en atelier.'
  };
}

const PAYMENT_LABELS = {
  PENDING: 'En attente de paiement',
  SUCCESS: 'Paiement confirmé',
  PAID: 'Paiement confirmé',
  FAILED: 'Paiement échoué',
  REFUNDED: 'Paiement remboursé',
  ON_DELIVERY: 'Paiement à la livraison',
};

function formatCurrency(value) {
  const n = Number(value || 0);
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return value;
  }
}

function getLatestRelation(relations) {
  return [...(Array.isArray(relations) ? relations : [])]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0];
}

export default function MyOrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'VALIDATED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'

  useEffect(() => {
    if (!selectedOrder) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedOrder(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOrder]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }

    if (!user) return;

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch(`/api/orders?user_id=${user.id}`);
        const json = await res.json();
        setOrders(json.data || []);
      } catch (error) {
        console.error('Impossible de charger les commandes', error);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user, loading, navigate]);

  const payOrder = async (order) => {
    setPayingOrderId(order.id);
    setPaymentError('');
    try {
      const payment = getLatestRelation(order.payments);
      const paymentMethod = payment?.payment_method && payment.payment_method !== 'cash_on_delivery'
        ? payment.payment_method
        : 'wave';
      const response = await fetch('/service/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('jogalook-token') ? { Authorization: `Bearer ${localStorage.getItem('jogalook-token')}` } : {}),
        },
        body: JSON.stringify({
          order_id: order.id,
          payment_method: paymentMethod,
          customer_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          phone_number: user.phone,
          customer_email: user.email,
          return_url: `${window.location.origin}/mes-commandes?payment_status=success`,
          cancel_url: `${window.location.origin}/mes-commandes?payment_status=cancelled`,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Impossible d’initier le paiement.');

      const targetUrl = json.data?.redirectUrl || json.data?.payment_url || json.data?.checkout_url;
      if (targetUrl) window.location.href = targetUrl;
      else setPaymentError('Le paiement a été initié, mais aucun lien de paiement n’a été fourni.');
    } catch (error) {
      setPaymentError(error.message || 'Impossible d’initier le paiement.');
    } finally {
      setPayingOrderId(null);
    }
  };

  const totalAmount = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total_amount || order.total_price || 0), 0),
    [orders]
  );

  // Filtrage des commandes selon le statut client sélectionné
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter(order => getCustomerStatus(order).key === statusFilter);
  }, [orders, statusFilter]);

  // Compteurs par statut client
  const statusCounts = useMemo(() => {
    return {
      ALL: orders.length,
      VALIDATED: orders.filter(o => getCustomerStatus(o).key === 'VALIDATED').length,
      IN_TRANSIT: orders.filter(o => getCustomerStatus(o).key === 'IN_TRANSIT').length,
      DELIVERED: orders.filter(o => getCustomerStatus(o).key === 'DELIVERED').length,
      CANCELLED: orders.filter(o => getCustomerStatus(o).key === 'CANCELLED').length,
    };
  }, [orders]);

  if (loading || !user) {
    return (
      <>
        <Navbar />
        <main className="my-orders-page">
          <div className="container">
            <div className="my-orders-loading">
              <div className="my-orders-spinner" />
              <p>Chargement de vos commandes…</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="my-orders-page">
        <div className="container">
          <div className="my-orders-header">
            <div>
              <span className="my-orders-kicker">Mon compte</span>
              <h1>Mes commandes</h1>
            </div>
            <Link to="/catalogue" className="my-orders-action">Continuer mes achats</Link>
          </div>

          {/* Résumé global */}
          <div className="my-orders-summary">
            <div className="my-orders-summary__item">
              <span>Total commandes</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="my-orders-summary__item">
              <span>Montant cumulé</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
          </div>

          {/* Filtres par Statut Client */}
          {orders.length > 0 && (
            <div className="my-orders-tabs">
              <button
                className={`my-orders-tab ${statusFilter === 'ALL' ? 'my-orders-tab--active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                Toutes <span className="my-orders-tab-count">{statusCounts.ALL}</span>
              </button>
              <button
                className={`my-orders-tab ${statusFilter === 'VALIDATED' ? 'my-orders-tab--active' : ''}`}
                onClick={() => setStatusFilter('VALIDATED')}
              >
                <span>✓</span> Commande validée <span className="my-orders-tab-count">{statusCounts.VALIDATED}</span>
              </button>
              <button
                className={`my-orders-tab ${statusFilter === 'IN_TRANSIT' ? 'my-orders-tab--active' : ''}`}
                onClick={() => setStatusFilter('IN_TRANSIT')}
              >
                <span>🚚</span> En cours de livraison <span className="my-orders-tab-count">{statusCounts.IN_TRANSIT}</span>
              </button>
              <button
                className={`my-orders-tab ${statusFilter === 'DELIVERED' ? 'my-orders-tab--active' : ''}`}
                onClick={() => setStatusFilter('DELIVERED')}
              >
                <span>✅</span> Livrée <span className="my-orders-tab-count">{statusCounts.DELIVERED}</span>
              </button>
              {statusCounts.CANCELLED > 0 && (
                <button
                  className={`my-orders-tab ${statusFilter === 'CANCELLED' ? 'my-orders-tab--active' : ''}`}
                  onClick={() => setStatusFilter('CANCELLED')}
                >
                  <span>✕</span> Annulée <span className="my-orders-tab-count">{statusCounts.CANCELLED}</span>
                </button>
              )}
            </div>
          )}

          {paymentError && <div className="my-orders-error" role="alert">{paymentError}</div>}

          {loadingOrders ? (
            <div className="my-orders-empty">Chargement des commandes…</div>
          ) : orders.length === 0 ? (
            <div className="my-orders-empty">
              <div className="my-orders-empty__icon">📦</div>
              <h2>Aucune commande pour le moment</h2>
              <p>Vos commandes validées apparaîtront ici avec leur suivi en temps réel.</p>
              <Link to="/catalogue" className="my-orders-primary-btn">Découvrir le catalogue</Link>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="my-orders-empty">
              <p>Aucune commande avec le statut sélectionné.</p>
              <button className="my-orders-primary-btn" onClick={() => setStatusFilter('ALL')}>
                Voir toutes mes commandes
              </button>
            </div>
          ) : (
            <div className="my-orders-list">
              {filteredOrders.map((order) => {
                const statusMeta = getCustomerStatus(order);
                const payment = getLatestRelation(order.payments);
                const paymentStatus = String(payment?.status || (order.status === 'PAID' ? 'SUCCESS' : 'PENDING')).toUpperCase();
                const isCod = payment?.payment_method === 'cash_on_delivery' || order.payment_method === 'cash_on_delivery';
                const paymentIsValid = ['SUCCESS', 'PAID'].includes(paymentStatus) || isCod;
                const delivery = getLatestRelation(order.deliveries);

                return (
                  <article key={order.id} className="my-order-card">
                    
                    {/* En-tête de la carte de commande */}
                    <div className="my-order-card__header">
                      <div>
                        <p className="my-order-card__ref">Commande #{order.order_number || order.id?.slice(0, 8).toUpperCase()}</p>
                        <p className="my-order-card__date">Passée le {formatDate(order.created_at)}</p>
                      </div>
                      
                      {/* Badge du Statut Client (1 sur 4) */}
                      <span className={`my-order-card__status ${statusMeta.badgeClass}`}>
                        <span>{statusMeta.icon}</span> {statusMeta.label}
                      </span>
                    </div>

                    <button type="button" className="my-order-details-btn" onClick={() => setSelectedOrder(order)}>
                      Voir les détails de la commande →
                    </button>

                    <div className="my-order-card__meta">
                      <div>
                        <span>Montant</span>
                        <strong>{formatCurrency(order.total_amount || order.total_price || 0)}</strong>
                      </div>
                      <div>
                        <span>Règlement</span>
                        <strong>
                          {isCod 
                            ? 'Paiement à la livraison' 
                            : PAYMENT_LABELS[paymentStatus] || 'Enregistré'}
                        </strong>
                      </div>
                      <div>
                        <span>Suivi</span>
                        <strong>{statusMeta.label}</strong>
                      </div>
                    </div>

                    {delivery?.tracking_number && (
                      <p className="my-order-tracking">N° de suivi livraison : <strong>{delivery.tracking_number}</strong></p>
                    )}

                    {/* Aperçu des articles */}
                    {(order.order_items || []).length > 0 && (
                      <div className="my-order-card__items">
                        {order.order_items.slice(0, 3).map((item, index) => (
                          <div key={`${order.id}-${index}`} className="my-order-item">
                            <span className="my-order-item__name">
                              {item.product_name || item.name || 'Maillot JogaLook'}
                              {(item.variant_info || item.size) && ` (${item.variant_info || item.size})`}
                            </span>
                            <span className="my-order-item__qty">Qté: {item.quantity || 1}</span>
                            <span className="my-order-item__price">{formatCurrency(item.total_price || item.unit_price || 0)}</span>
                          </div>
                        ))}
                        {(order.order_items || []).length > 3 && (
                          <div className="my-order-item my-order-item--more">
                            +{(order.order_items || []).length - 3} article(s) supplémentaire(s)
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* ============================================================
          MODALE DÉTAIL COMMANDE (AVEC TIMELINE DES 3 STATUTS ACTIFS)
          ============================================================ */}
      {selectedOrder && (() => {
        const detailStatusMeta = getCustomerStatus(selectedOrder);
        const detailPayment = getLatestRelation(selectedOrder.payments);
        const detailDelivery = getLatestRelation(selectedOrder.deliveries);
        const isCod = detailPayment?.payment_method === 'cash_on_delivery' || selectedOrder.payment_method === 'cash_on_delivery';
        const detailPaymentStatus = String(detailPayment?.status || (selectedOrder.status === 'PAID' ? 'SUCCESS' : 'PENDING')).toUpperCase();
        const detailPaymentIsValid = ['SUCCESS', 'PAID'].includes(detailPaymentStatus) || isCod;

        return (
          <div className="my-order-modal" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedOrder(null);
          }}>
            <section className="my-order-modal__content" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
              
              {/* Modal Header */}
              <div className="my-order-modal__header">
                <div>
                  <span className="my-orders-kicker">Suivi de commande</span>
                  <h2 id="order-detail-title">#{selectedOrder.order_number || selectedOrder.id?.slice(0, 8).toUpperCase()}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#666' }}>
                    Passée le {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <button type="button" className="my-order-modal__close" onClick={() => setSelectedOrder(null)} aria-label="Fermer">×</button>
              </div>

              {/* Stepper / Timeline de progression (3 étapes clés) */}
              {detailStatusMeta.key === 'CANCELLED' ? (
                <div className="my-orders-cancelled-alert">
                  <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                  <div>
                    <strong>Commande Annulée</strong>
                    <span>Cette commande a été annulée ou remboursée. Contactez notre support pour toute question.</span>
                  </div>
                </div>
              ) : (
                <div className="my-orders-stepper">
                  {[
                    { step: 1, label: '1. Commande validée',   icon: '✓' },
                    { step: 2, label: '2. En cours de livraison', icon: '🚚' },
                    { step: 3, label: '3. Livrée',            icon: '✅' },
                  ].map((s) => {
                    const isCompleted = detailStatusMeta.step > s.step;
                    const isActive = detailStatusMeta.step === s.step;

                    return (
                      <div
                        key={s.step}
                        className={`my-orders-step ${isCompleted ? 'my-orders-step--completed' : ''} ${isActive ? 'my-orders-step--active' : ''}`}
                      >
                        <div className="my-orders-step-circle">
                          {isCompleted ? '✓' : s.icon}
                        </div>
                        <span className="my-orders-step-label">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* État actuel résumé */}
              <div className="my-order-detail-statuses">
                <div>
                  <span>Statut de la commande</span>
                  <strong style={{ color: detailStatusMeta.color }}>
                    {detailStatusMeta.icon} {detailStatusMeta.label}
                  </strong>
                </div>
                <div>
                  <span>Paiement</span>
                  <strong>
                    {isCod 
                      ? 'Paiement à la livraison' 
                      : PAYMENT_LABELS[detailPaymentStatus] || 'Confirmé'}
                  </strong>
                </div>
                <div>
                  <span>Livraison</span>
                  <strong>{detailStatusMeta.description}</strong>
                </div>
              </div>

              {/* Articles commandés */}
              <div className="my-order-modal__section">
                <h3>Articles commandés ({selectedOrder.order_items?.length || 0})</h3>
                <div className="my-order-detail-items">
                  {(selectedOrder.order_items || []).map((item, index) => {
                    const product = item.product_variants?.products;
                    const variant = item.product_variants;
                    const image = item.customizations?.preview_image_url || item.image || item.image_url || product?.image_url;
                    const size = variant?.size || item.size || item.selectedSize || item.variant_info;

                    return (
                      <div className="my-order-detail-item" key={`${selectedOrder.id}-${index}`}>
                        <div className="my-order-detail-item__image">
                          {image ? (
                            <img src={image} alt={item.product_name || 'Maillot'} onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <span>👕</span>
                          )}
                        </div>
                        <div className="my-order-detail-item__info">
                          <h4>{item.product_name || product?.name || 'Maillot JogaLook'}</h4>
                          <p>{size ? `Taille : ${size}` : ''}</p>
                          {(item.customizations || item.custom_name || item.custom_number) && (
                            <p style={{ color: '#7E22CE', fontWeight: 600 }}>
                              ✨ Flocage : {item.customizations?.custom_name || item.custom_name || ''} {item.customizations?.custom_number || item.custom_number ? `#${item.customizations?.custom_number || item.custom_number}` : ''}
                            </p>
                          )}
                          <p>Quantité : {item.quantity || 1}</p>
                        </div>
                        <strong>{formatCurrency((item.quantity || 1) * Number(item.total_price || item.unit_price || 0))}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Récapitulatif et Adresse */}
              <div className="my-order-detail-grid">
                <div className="my-order-modal__section">
                  <h3>Récapitulatif</h3>
                  <div className="my-order-total-lines">
                    <p><span>Sous-total</span><strong>{formatCurrency(selectedOrder.subtotal || selectedOrder.total_amount)}</strong></p>
                    <p><span>Frais de livraison</span><strong style={{ color: '#1D7B3A' }}>Gratuit</strong></p>
                    <p className="my-order-total-lines__total"><span>Total</span><strong>{formatCurrency(selectedOrder.total_amount || selectedOrder.total_price)}</strong></p>
                  </div>
                </div>
                <div className="my-order-modal__section">
                  <h3>Adresse de livraison</h3>
                  <p className="my-order-address">
                    {selectedOrder.delivery_address || selectedOrder.shipping_address?.street_address || selectedOrder.city || 'Adresse standard de livraison'}
                  </p>
                  {detailDelivery?.tracking_number && (
                    <p className="my-order-address"><strong>N° Suivi :</strong> {detailDelivery.tracking_number}</p>
                  )}
                </div>
              </div>

              {!detailPaymentIsValid && detailStatusMeta.key !== 'CANCELLED' && (
                <button type="button" className="my-order-modal__pay" onClick={() => { setSelectedOrder(null); payOrder(selectedOrder); }}>
                  Valider et payer ma commande
                </button>
              )}
            </section>
          </div>
        );
      })()}
    </>
  );
}
