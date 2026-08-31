'use strict';

/**
 * paymentRoutes.js
 * Routes du service de paiement PayBammite — Monnaie : FCFA (XOF)
 * Montées sur : /service/payment/
 *
 * Endpoints disponibles :
 *   POST  /initiate         → Initier un encaissement Pay-In (Mobile Money / Carte)
 *   POST  /webhook          → Webhook de confirmation PayBammite (usage interne)
 *   GET   /status/:id       → Statut local d'un paiement
 *   POST  /verify           → Vérifier un paiement en temps réel côté PayBammite (token)
 *   POST  /payout           → Initier un transfert Pay-Out vers Mobile Money
 *   GET   /balance          → Solde du compte partenaire (admin)
 */

const express = require('express');
const router  = express.Router();

const {
  initiatePayment,
  handleWebhook,
  getPaymentStatus,
  verifyPaymentStatus,
  initiatePayoutPayment,
  getPartnerBalance,
  getUserPaymentPreferences,
  saveUserPaymentPreference,
  testPayinDirect,
} = require('./paymentController');

// ------------------------------------------------------------------------------
// POST /service/payment/test-direct
// Endpoint de test & debug direct sans redirection automatique (affiche le retour brut)
// ------------------------------------------------------------------------------
router.post('/test-direct', testPayinDirect);

// ------------------------------------------------------------------------------
// POST /service/payment/initiate
// Initier un paiement Pay-In en FCFA (Mobile Money, Carte ou Paiement à la livraison)
// ------------------------------------------------------------------------------
router.post('/initiate', initiatePayment);

// ------------------------------------------------------------------------------
// POST /service/payment/webhook
// Webhook de confirmation PayBammite → mise à jour automatique de payments + orders
// PayBammite envoie : { token, status, transaction_id, ... }
// ⚠️ Ne pas authentifier cette route — PayBammite n'envoie pas de token JWT
// ------------------------------------------------------------------------------
router.post('/webhook', handleWebhook);

// ------------------------------------------------------------------------------
// GET /service/payment/status/:payment_id
// Consulter l'état LOCAL d'un paiement et de la commande associée
// ------------------------------------------------------------------------------
router.get('/status/:payment_id', getPaymentStatus);

// ------------------------------------------------------------------------------
// POST /service/payment/verify
// Vérifier le statut d'un paiement en TEMPS RÉEL auprès de PayBammite
// Body : { token: string }
// Réconcilie automatiquement la base locale si le statut a changé
// ------------------------------------------------------------------------------
router.post('/verify', verifyPaymentStatus);

// ------------------------------------------------------------------------------
// POST /service/payment/payout
// Initier un transfert Pay-Out en FCFA vers un numéro Mobile Money (frais 2%)
// Body : { recipient_name, phone_number, amount, country, payment_method, description? }
// ------------------------------------------------------------------------------
router.post('/payout', initiatePayoutPayment);

// ------------------------------------------------------------------------------
// GET /service/payment/balance
// Consulter le solde du compte partenaire PayBammite (admin)
// Query params optionnels : ?from=YYYY-MM-DD&to=YYYY-MM-DD
// ------------------------------------------------------------------------------
router.get('/balance', getPartnerBalance);

// ------------------------------------------------------------------------------
// GET & POST /service/payment/user-preferences
// Récupérer et enregistrer les méthodes de paiement préférées & éligibilité COD
// ------------------------------------------------------------------------------
router.get('/user-preferences', getUserPaymentPreferences);
router.post('/user-preferences', saveUserPaymentPreference);

module.exports = router;
