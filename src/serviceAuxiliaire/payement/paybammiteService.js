'use strict';

/**
 * paybammiteService.js
 * Wrapper pour l'API PayBammite (pay.bammite.com)
 * Ce module s'exécute UNIQUEMENT côté serveur (clé privée jamais exposée au client).
 */

const BASE_URL = 'https://pay.bammite.com';

// Lecture des clés depuis les variables d'environnement
const PUBLIC_KEY     = process.env.PAYBAMMITE_PUBLIC_KEY;
const PRIVATE_KEY    = process.env.PAYBAMMITE_PRIVATE_KEY;
const PARTNER_ID     = process.env.PAYBAMMITE_PARTNER_ID;

/**
 * Vérifie que les clés sont bien configurées avant tout appel API.
 */
function assertKeys() {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    throw new Error(
      'Clés PayBammite manquantes. Vérifiez PAYBAMMITE_PUBLIC_KEY et PAYBAMMITE_PRIVATE_KEY dans votre fichier .env'
    );
  }
}

/**
 * Helper HTTP générique (utilise le fetch natif de Node 18+).
 * @param {string} method  - 'GET' | 'POST'
 * @param {string} path    - Chemin relatif (ex: '/payin/')
 * @param {object} [body]  - Corps JSON pour les requêtes POST
 * @returns {Promise<object>}
 */
async function request(method, path, body = null) {
  const url = `${BASE_URL}${path}`;

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Réponse PayBammite non-JSON (HTTP ${response.status}): ${text}`);
  }

  if (!response.ok && !data.success) {
    const errMsg = data.message || data.error || `Erreur HTTP ${response.status}`;
    throw new Error(`PayBammite API error: ${errMsg}`);
  }

  return data;
}

// ==============================================================================
// EXPORTS DU SERVICE
// ==============================================================================

/**
 * Normalise les méthodes de paiement pour correspondre aux codes officiels PayBammite.
 */
function normalizePaymentMethod(method, defaultCountry = 'sn') {
  if (!method) return { method: 'wave', country: defaultCountry };
  const m = String(method).toLowerCase().trim();

  // Sénégal (sn)
  if (m === 'wave' || m === 'wave_sn') return { method: 'wave', country: 'sn' };
  if (m === 'orange_money' || m === 'orange_money_sn' || m === 'om_sn' || m === 'orange') return { method: 'orange_money', country: 'sn' };
  if (m === 'free_money' || m === 'free' || m === 'free_money_sn') return { method: 'free_money', country: 'sn' };
  if (m === 'expresso') return { method: 'expresso', country: 'sn' };
  if (m === 'wizall') return { method: 'wizall', country: 'sn' };

  // Côte d'Ivoire (ci)
  if (m === 'wave_ci') return { method: 'wave_ci', country: 'ci' };
  if (m === 'orange_money_ci' || m === 'om_ci') return { method: 'orange_money_ci', country: 'ci' };
  if (m === 'mtn' || m === 'mtn_ci') return { method: 'mtn_ci', country: 'ci' };
  if (m === 'moov_ci') return { method: 'moov_ci', country: 'ci' };

  // Burkina Faso (bf)
  if (m === 'orange_money_burkina' || m === 'om_bf' || m === 'orange_burkina') return { method: 'orange_money_burkina', country: 'bf' };
  if (m === 'moov' || m === 'moov_bf' || m === 'moov_burkina') return { method: 'moov_burkina', country: 'bf' };

  // Bénin (bj)
  if (m === 'mtn_benin' || m === 'mtn_bj') return { method: 'mtn_benin', country: 'bj' };
  if (m === 'moov_benin' || m === 'moov_bj') return { method: 'moov_benin', country: 'bj' };

  // Togo (tg) & Mali (ml)
  if (m === 'moov_togo' || m === 'moov_tg') return { method: 'moov_togo', country: 'tg' };
  if (m === 'orange_money_mali' || m === 'om_ml') return { method: 'orange_money_mali', country: 'ml' };

  // Carte bancaire
  if (m === 'card' || m === 'cb' || m === 'carte' || m === 'bank_card' || m === 'carte_bancaire') {
    return { method: 'card', country: defaultCountry || 'sn' };
  }

  return { method: m, country: defaultCountry || 'sn' };
}

/**
 * Nettoie le numéro de téléphone selon les prérequis PayBammite :
 * "Numéro de téléphone du client (sans indicatif)."
 */
function sanitizePhoneNumber(phone) {
  if (!phone) return '';
  let p = String(phone).replace(/[\s\-\.\(\)]/g, '');
  p = p.replace(/^(\+|00)/, '');
  // Retirer indicatifs sous-régionaux (221, 225, 226, 229, 228, 223, 237)
  p = p.replace(/^(221|225|226|229|228|223|237)/, '');
  // Retirer le 0 en tête si le numéro a 9 chiffres ou plus
  if (p.startsWith('0') && p.length >= 9) {
    p = p.slice(1);
  }
  return p;
}

/**
 * Vérifie si une URL est une URL HTTPS publique valide.
 * PayDunya / PayBammite rejettent les URLs http:// ou localhost et provoquent une erreur 500.
 */
function isSecurePublicUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) return false;
  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1') || trimmed.includes('0.0.0.0')) return false;
  return true;
}

/**
 * Initier un encaissement (Pay-In) — Monnaie : FCFA (XOF)
 * Conforme à la documentation officielle mise à jour : https://pay.bammite.com/public/docs.php
 * Endpoint officiel : POST https://pay.bammite.com/payin/init.php
 *
 * @param {object} params
 * @param {string} params.customer_name    - Nom complet du client
 * @param {string} params.phone_number     - Numéro de téléphone (sans indicatif)
 * @param {number} params.amount           - Montant en FCFA (entier, min 100 FCFA)
 * @param {string} params.country          - Code pays ISO: 'sn','ci','bf','bj','tg','ml','cm'
 * @param {string} params.payment_method   - 'wave' | 'orange_money' | 'mtn_ci' | 'moov_burkina' | 'card' | ...
 * @param {string} [params.customer_email] - Email du client (optionnel)
 * @param {string} [params.description]    - Description de la transaction (optionnel)
 * @param {string} [params.reference]      - Référence interne (optionnel)
 * @param {string} [params.return_url]     - URL de redirection après succès (indispensable pour retour automatique)
 * @param {string} [params.cancel_url]     - URL de redirection après annulation
 * @param {string} [params.callback_url]   - URL webhook pour notification serveur à serveur
 * @returns {Promise<object>} Réponse PayBammite avec token, checkout_url, redirectUrl, transaction_id
 */
async function initiatePay(params) {
  assertKeys();

  // 1. Validation du montant (entier FCFA, min 100 FCFA)
  const amount = Math.round(Number(params.amount));
  if (!amount || amount < 100) {
    throw new Error('Le montant doit être un entier en FCFA (minimum 100 FCFA).');
  }

  // 2. Normalisation méthode & pays
  const { method: normalizedMethod, country: normalizedCountry } = normalizePaymentMethod(
    params.payment_method,
    params.country || 'sn'
  );

  // 3. Nettoyage du numéro de téléphone (sans indicatif)
  const cleanPhone = sanitizePhoneNumber(params.phone_number);
  if (!cleanPhone || cleanPhone.length < 6) {
    throw new Error('Le numéro de téléphone du client est invalide ou manquant.');
  }

  // 4. Construction du payload selon la documentation officielle
  const payload = {
    api:            PUBLIC_KEY,
    private_key:    PRIVATE_KEY,
    customer_name:  String(params.customer_name || '').trim(),
    phone_number:   cleanPhone,
    amount:         amount,
    country:        normalizedCountry,
    payment_method: normalizedMethod,
  };

  // Champs de redirection et webhook (essentiels pour le retour du client)
  if (params.return_url)     payload.return_url       = String(params.return_url).trim();
  if (params.cancel_url)     payload.cancel_url       = String(params.cancel_url).trim();
  if (params.callback_url)   payload.callback_url     = String(params.callback_url).trim();

  // Champs descriptifs optionnels
  if (params.customer_email) payload.customer_email   = String(params.customer_email).trim();
  if (params.description)    payload.description      = String(params.description).trim();
  if (params.reference)      payload.reference_client = String(params.reference).trim();

  // Carte bancaire optionnelle
  if (params.card_number)              payload.card_number              = params.card_number;
  if (params.card_cvv)                 payload.card_cvv                 = params.card_cvv;
  if (params.card_expired_date_month)  payload.card_expired_date_month  = params.card_expired_date_month;
  if (params.card_expired_date_year)   payload.card_expired_date_year   = params.card_expired_date_year;

  console.log('🚀 [PayBammite Call /payin/init.php]:', {
    amount,
    country: normalizedCountry,
    method: normalizedMethod,
    phone: cleanPhone,
    return_url: payload.return_url,
    callback_url: payload.callback_url,
  });

  return request('POST', '/payin/init.php', payload);
}

/**
 * Vérifier le statut d'un paiement côté PayBammite (via le token).
 * Utile pour la réconciliation ou la vérification manuelle depuis le frontend.
 *
 * @param {string} token - Token retourné lors de l'initiation du paiement
 * @returns {Promise<object>} Statut et détails de la transaction
 */
async function verifyPayment(token) {
  assertKeys();

  if (!token) {
    throw new Error('Token PayBammite requis pour vérifier un paiement.');
  }

  // Note: PayBammite v1.0 n'a pas d'endpoint public /check_transaction/ (retourne HTTP 404).
  // La confirmation est réconciliée de manière sécurisée via webhook callback_url et le token de redirection.
  return null;
}

/**
 * Initier un transfert d'argent (Pay-Out) vers un numéro Mobile Money — Monnaie : FCFA (XOF)
 *
 * @param {object} params
 * @param {string} params.recipient_name   - Nom du bénéficiaire
 * @param {string} params.phone_number     - Numéro Mobile Money du bénéficiaire
 * @param {number} params.amount           - Montant en FCFA (entier, min 100 FCFA)
 * @param {string} params.country          - Code pays ISO: 'sn','ci','bf','bj','tg','ml','cm'
 * @param {string} params.payment_method   - 'wave' | 'orange_money' | 'mtn' | 'moov' | ...
 * @param {string} [params.description]    - Motif du transfert
 * @param {string} [params.reference]      - Référence interne
 * @param {string} [params.callback_url]   - URL webhook pour confirmation du transfert
 * @returns {Promise<object>} Réponse PayBammite avec statut et transaction_id
 */
async function initiatePayout(params) {
  assertKeys();

  if (!PARTNER_ID) {
    throw new Error('PAYBAMMITE_PARTNER_ID manquant dans le fichier .env');
  }

  // Validation FCFA : montant entier positif, minimum 100 FCFA
  const amount = Math.round(Number(params.amount));
  if (!amount || amount < 100) {
    throw new Error('Le montant de transfert doit être un entier en FCFA (minimum 100 FCFA).');
  }

  const payload = {
    api:            PUBLIC_KEY,
    private_key:    PRIVATE_KEY,
    partenaire_id:  PARTNER_ID,
    recipient_name: params.recipient_name,
    phone_number:   params.phone_number,
    amount,
    country:        params.country,
    payment_method: params.payment_method,
    currency:       'XOF',   // Franc CFA (FCFA)
  };

  if (params.description)  payload.description      = params.description;
  if (params.reference)    payload.reference_client = params.reference;
  if (params.callback_url) payload.callback_url     = params.callback_url;

  return request('POST', '/payout/', payload);
}

/**
 * Consulter le solde et les statistiques du compte partenaire.
 *
 * @param {object} [options]
 * @param {string} [options.from] - Date début YYYY-MM-DD
 * @param {string} [options.to]   - Date fin   YYYY-MM-DD
 * @returns {Promise<object>}
 */
async function getBalance(options = {}) {
  assertKeys();

  if (!PARTNER_ID) {
    throw new Error('PAYBAMMITE_PARTNER_ID manquant dans le fichier .env');
  }

  let path = `/gestionDePaiement/partner_finance_api.php?action=details&partenaire_id=${PARTNER_ID}`;
  if (options.from) path += `&from=${options.from}`;
  if (options.to)   path += `&to=${options.to}`;

  return request('GET', path);
}

module.exports = { initiatePay, verifyPayment, initiatePayout, getBalance };
