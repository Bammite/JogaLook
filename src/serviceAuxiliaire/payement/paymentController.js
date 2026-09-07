'use strict';

/**
 * paymentController.js  (serviceAuxiliaire/payement)
 * 
 * Gère le cycle de vie complet d'un paiement :
 *   1. POST /initiate            → Initie le paiement via PayBammite (Pay-In FCFA)
 *   2. POST /webhook             → Reçoit la confirmation de PayBammite
 *   3. GET  /status/:id          → Consulte l'état d'un paiement (base locale)
 *   4. POST /verify              → Vérifie le statut d'un paiement côté PayBammite (token)
 *   5. POST /payout              → Initie un transfert (Pay-Out FCFA) vers Mobile Money
 *   6. GET  /balance             → Solde du compte partenaire (admin)
 */

const { supabaseAdmin } = require('../../backend/supabaseClient');
const { initiatePay, verifyPayment, initiatePayout, getBalance } = require('./paybammiteService');

// ==============================================================================
// 1. INITIER UN PAIEMENT
// ==============================================================================

/**
 * POST /service/payment/initiate
 *
 * Body attendu :
 * {
 *   order_id?:           string  (UUID de la commande si déjà créée)
 *   items?:              array   (Liste des articles sélectionnés pour créer la commande si pas d'order_id)
 *   user_id?:            string  (UUID de l'utilisateur connecté)
 *   payment_method:      string  ('wave' | 'orange_money' | 'free_money' | 'mtn' | 'moov' | 'card' | 'cash_on_delivery')
 *   customer_name:       string  (Nom complet du client)
 *   phone_number:        string  (Numéro de téléphone)
 *   country?:            string  ('sn' | 'ci' | 'bf' | ...)
 *   customer_email?:     string  (Optionnel)
 *   shipping_address?:   string  (Adresse de livraison)
 *   save_payment_method?:boolean (Sauvegarder pour la prochaine fois)
 *   amount?:             number  (Montant forcé si pas d'order_id)
 * }
 */
exports.initiatePayment = async (req, res) => {
  try {
    const {
      order_id,
      items,
      user_id,
      payment_method,
      customer_name,
      phone_number: _phone_number,
      customer_phone,
      country = 'sn',
      customer_email,
      shipping_address,
      delivery_address,
      save_payment_method = false,
      amount: manualAmount,
      return_url: clientReturnUrl,
      cancel_url: clientCancelUrl,
      is_cod: requestedCod,
      description: clientDescription,
    } = req.body;

    // Accepter phone_number OU customer_phone depuis le frontend
    let phone_number = (_phone_number || customer_phone || '').replace(/[\s\-\.]/g, '');

    // Retirer le préfixe indicatif (+221, 00221, etc.) — PayBammite attend le numéro sans indicatif
    phone_number = phone_number.replace(/^(\+|00)(221|225|226|229|228|223|237)/, '');

    // --- Validation des champs requis de base ---
    const missing = [];
    if (!payment_method)  missing.push('payment_method');
    if (!customer_name)   missing.push('customer_name');
    if (!phone_number)    missing.push('phone_number');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs requis manquants : ${missing.join(', ')}`,
      });
    }

    if (payment_method === 'cash_on_delivery' || payment_method === 'cod' || requestedCod === true) {
      return res.status(400).json({
        success: false,
        code: 'COD_DISABLED',
        message: 'Le paiement à la livraison est désactivé. Un paiement en ligne est requis pour valider la commande.',
      });
    }

    // ─── 1. Résolution globale du user_id ───
    let resolvedUserId = user_id;

    if (!resolvedUserId && req.headers.authorization) {
      try {
        const rawToken = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(rawToken);
        if (decoded?.id || decoded?.sub) resolvedUserId = decoded.id || decoded.sub;
      } catch (_) {}
    }

    if (!resolvedUserId && phone_number) {
      const { data: uPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .ilike('phone', `%${phone_number}%`)
        .limit(1)
        .maybeSingle();
      if (uPhone) resolvedUserId = uPhone.id;
    }

    if (!resolvedUserId && customer_email) {
      const { data: uEmail } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', customer_email.trim().toLowerCase())
        .maybeSingle();
      if (uEmail) resolvedUserId = uEmail.id;
    }

    if (!resolvedUserId) {
      const { data: defaultUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (defaultUser) resolvedUserId = defaultUser.id;
    }

    let targetOrder = null;
    let totalAmount = 0;

    // 2. Soit on a un order_id existant
    if (order_id && !order_id.startsWith('temp-')) {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, total_amount, status, user_id')
        .eq('id', order_id)
        .single();

      if (orderError || !order) {
        return res.status(404).json({ success: false, message: 'Commande introuvable.' });
      }

      if (order.status === 'PAID') {
        return res.status(409).json({ success: false, message: 'Cette commande est déjà payée.' });
      }

      targetOrder = order;
      totalAmount = Math.round(Number(order.total_amount));
    } else {
      // 3. Sinon on calcule le montant à partir des items ou du manualAmount
      if (items && Array.isArray(items) && items.length > 0) {
        totalAmount = Math.round(items.reduce((sum, it) => sum + (Number(it.price || it.unit_price || 0) * (it.quantity || 1)), 0));
      } else if (manualAmount && Number(manualAmount) > 0) {
        totalAmount = Math.round(Number(manualAmount));
      } else {
        return res.status(400).json({
          success: false,
          message: 'Aucun article ou montant valide fourni pour la commande.',
        });
      }

      // Création automatique de la commande dans la base de données
      const orderNumber = `JL-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: newOrder, error: createOrderError } = await supabaseAdmin
        .from('orders')
        .insert([{
          order_number: orderNumber,
          user_id: resolvedUserId,
          status: 'PENDING',
          subtotal: totalAmount,
          shipping_fee: 0,
          tax_amount: 0,
          total_amount: totalAmount,
        }])
        .select()
        .single();

      if (createOrderError) {
        console.warn('⚠️ [initiatePayment] Erreur création order dans DB, utilisation référence générée:', createOrderError.message);
        targetOrder = { id: `order-${Date.now()}`, order_number: orderNumber, total_amount: totalAmount };
      } else {
        targetOrder = newOrder;

        // Insertion des articles commandés si présents
        if (items && Array.isArray(items) && items.length > 0) {
          const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
          const orderItemsData = [];

          for (const it of items) {
            let variantId = it.variant_id || it.product_variant_id || null;

            if (!variantId && it.product_id) {
              const { data: vFound } = await supabaseAdmin
                .from('product_variants')
                .select('id')
                .eq('product_id', it.product_id)
                .limit(1)
                .maybeSingle();
              if (vFound) variantId = vFound.id;
            }

            if (!variantId && it.product_id) {
              try {
                const { data: vNew } = await supabaseAdmin
                  .from('product_variants')
                  .insert([{
                    product_id: it.product_id,
                    size: it.size || it.selectedSize || 'M',
                    stock_quantity: 100,
                  }])
                  .select('id')
                  .single();
                if (vNew) variantId = vNew.id;
              } catch (_) {}
            }

            if (variantId) {
              const sizeStr = it.size || it.selectedSize || 'M';
              const customName = it.custom_name || it.extra_details?.playerName || null;
              const customNumber = it.custom_number || it.extra_details?.playerNumber || null;
              
              let variantInfo = `Taille: ${sizeStr}`;
              if (customName || customNumber) {
                variantInfo += ` | Flocage: ${[customName, customNumber ? '#' + customNumber : ''].filter(Boolean).join(' ')}`;
              } else if (it.category) {
                variantInfo += ` | ${it.category}`;
              }

              const customDetailsObj = (it.preview_front || it.preview_back || it.svg_front || it.svg_back || it.extra_details || customName || customNumber) ? {
                custom_name: customName,
                custom_number: customNumber,
                font_family: it.font_family || it.extra_details?.fontFamily || null,
                primary_color: it.selectedColor || it.extra_details?.bodyColor || null,
                secondary_color: it.extra_details?.stripesColor || it.extra_details?.bodyColor2 || null,
                preview_front: it.preview_front || it.image || null,
                preview_back: it.preview_back || null,
                svg_front: it.svg_front || null,
                svg_back: it.svg_back || null,
                extra_details: it.extra_details || null,
              } : null;

              // Ne passer customization_id QUE si c'est un UUID v4 valide en base
              const validCustomId = (it.customization_id && isValidUUID(it.customization_id)) ? it.customization_id : null;

              orderItemsData.push({
                order_id: targetOrder.id,
                product_variant_id: variantId,
                customization_id: validCustomId,
                product_name: it.product_name || it.name || 'Produit JogaLook',
                variant_info: variantInfo,
                quantity: it.quantity || 1,
                unit_price: Number(it.unit_price || it.price || 0),
                total_price: (it.quantity || 1) * Number(it.unit_price || it.price || 0),
                // Champs étendus pour atelier
                custom_details: customDetailsObj,
                preview_front: it.preview_front || it.image || null,
                preview_back: it.preview_back || null,
                custom_name: customName,
                custom_number: customNumber,
              });
            }
          }

          if (orderItemsData.length > 0) {
            // Tentative 1 : avec les colonnes étendues
            let { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItemsData);
            
            // Si la table n'a pas encore les colonnes de customisation, fallback sur le schéma standard
            if (itemsErr) {
              console.warn('Tentative insertion standard order_items (fallback) :', itemsErr.message);
              const fallbackData = orderItemsData.map(({ custom_details, preview_front, preview_back, custom_name, custom_number, ...rest }) => rest);
              const { error: fallbackErr } = await supabaseAdmin.from('order_items').insert(fallbackData);
              if (fallbackErr) console.warn('Item fallback insert warning:', fallbackErr.message);
            }
          }
        }
      }
    }

    // --- Enregistrement automatique dans la table userinfo (dernière commande client) ---
    if (resolvedUserId) {
      try {
        const addressToSave = (delivery_address || shipping_address || '').trim();
        const { city, delivery_type, latitude, longitude } = req.body;
        
        const upsertPayload = {
          user_id: resolvedUserId,
          customer_name: customer_name.trim(),
          phone_number: phone_number.replace(/\s/g, ''),
          delivery_address: addressToSave || null,
          payment_method: (payment_method === 'cash_on_delivery' || payment_method === 'cod') ? 'cash_on_delivery' : payment_method,
          country: country || 'sn',
          updated_at: new Date().toISOString(),
        };

        const { error: fullUpsertErr } = await supabaseAdmin
          .from('userinfo')
          .upsert([{
            ...upsertPayload,
            ...(city ? { city } : {}),
            ...(delivery_type ? { delivery_type } : {}),
            ...(latitude != null ? { latitude: Number(latitude) } : {}),
            ...(longitude != null ? { longitude: Number(longitude) } : {}),
          }], { onConflict: 'user_id' });

        if (fullUpsertErr) {
          // Fallback sur le schéma de base si les colonnes spécifiques ne sont pas encore créées
          await supabaseAdmin.from('userinfo').upsert([upsertPayload], { onConflict: 'user_id' });
        }
        console.log(`👤 [userinfo] Informations du client ${resolvedUserId} enregistrées.`);
      } catch (infoErr) {
        console.warn('⚠️ [userinfo] Notice enregistrement:', infoErr.message);
      }
    }

    // --- Sauvegarde de la méthode pour les prochains achats si demandé ---
    if (save_payment_method && user_id) {
      try {
        await supabaseAdmin
          .from('user_payment_methods')
          .upsert([{
            user_id,
            payment_method,
            phone_number: phone_number.replace(/\s/g, ''),
            customer_name: customer_name.trim(),
            country,
            is_default: true,
            updated_at: new Date().toISOString(),
          }], { onConflict: 'user_id, payment_method, phone_number' });
      } catch (prefErr) {
        console.warn('⚠️ [Preferences] Impossible de sauvegarder la préférence:', prefErr.message);
      }
    }

    // ==============================================================================
    // CAS A : PAIEMENT À LA LIVRAISON (Cash on Delivery - COD)
    // ==============================================================================
    if (payment_method === 'cash_on_delivery' || payment_method === 'cod') {
      // 1. Règle de montant : entre 5 000 FCFA et 100 000 FCFA
      const COD_MIN = 5000;
      const COD_MAX = 100000;

      if (totalAmount < COD_MIN || totalAmount > COD_MAX) {
        return res.status(400).json({
          success: false,
          code: 'COD_AMOUNT_INVALID',
          message: `Le paiement à la livraison est disponible uniquement pour les commandes de ${COD_MIN.toLocaleString('fr-FR')} FCFA à ${COD_MAX.toLocaleString('fr-FR')} FCFA. Votre total est de ${totalAmount.toLocaleString('fr-FR')} FCFA.`,
        });
      }

      // 2. Règle de fiabilité : vérifier si le client est répertorié comme non fiable
      if (user_id || phone_number) {
        let relQuery = supabaseAdmin.from('user_reliability').select('*');
        if (user_id) relQuery = relQuery.eq('user_id', user_id);
        else if (phone_number) relQuery = relQuery.eq('phone', phone_number.replace(/\s/g, ''));

        const { data: reliability } = await relQuery.maybeSingle();

        if (reliability && (reliability.is_reliable === false || reliability.cod_allowed === false)) {
          return res.status(403).json({
            success: false,
            code: 'COD_NOT_ALLOWED',
            message: 'Le paiement à la livraison n’est pas disponible pour votre compte. Veuillez choisir un règlement par Wave, Orange Money ou Carte bancaire.',
          });
        }
      }

      // 3. Enregistrement du paiement en mode paiement à la livraison
      let paymentRecord = null;
      try {
        const { data: pData } = await supabaseAdmin
          .from('payments')
          .insert([{
            order_id: targetOrder.id,
            payment_method: 'cash_on_delivery',
            amount: totalAmount,
            status: 'ON_DELIVERY',
            payload: {
              type: 'cash_on_delivery',
              customer_name: customer_name.trim(),
              phone_number: phone_number.replace(/\s/g, ''),
              shipping_address: shipping_address || delivery_address || null,
              created_at: new Date().toISOString(),
              items: items || [],
            },
          }])
          .select()
          .single();
        paymentRecord = pData;
      } catch (pErr) {
        console.warn('Payment insert notice:', pErr.message);
      }

      console.log(`📦 [COD] Commande #${targetOrder.order_number} validée à la livraison — ${totalAmount} FCFA`);

      return res.status(201).json({
        success: true,
        is_cod: true,
        message: 'Votre commande avec paiement à la livraison a été confirmée avec succès ! Vous réglerez à la réception.',
        data: {
          payment_id:   paymentRecord ? paymentRecord.id : `cod-${Date.now()}`,
          order_id:     targetOrder.id,
          order_number: targetOrder.order_number,
          amount:       totalAmount,
          status:       'ON_DELIVERY',
          payment_method: 'cash_on_delivery',
        },
      });
    }

    // ==============================================================================
    // CAS B : PAIEMENT EN LIGNE PAYBAMMITE (Wave, Orange Money, Free, MTN, Carte...)
    // ==============================================================================
    // Création enregistrement payment
    let paymentId = `pay-${Date.now()}`;
    try {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert([{
          order_id: targetOrder.id,
          payment_method,
          amount: totalAmount,
          status: 'PENDING',
          payload: { 
            initiated_at: new Date().toISOString(),
            customer_name: customer_name ? customer_name.trim() : null,
            phone_number: phone_number ? phone_number.replace(/\s/g, '') : null,
            shipping_address: shipping_address || delivery_address || null,
            items: items || [],
          },
        }])
        .select()
        .single();

      if (!paymentError && payment) paymentId = payment.id;
    } catch (e) {
      console.warn('Payment insert warning:', e.message);
    }

    // --- Construire les URLs de callback ---
    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const callbackUrl = `${appUrl}/service/payment/webhook`;
    const returnUrl   = clientReturnUrl || `${appUrl}/commande/confirmation?payment_id=${paymentId}&order=${targetOrder.order_number}`;
    const cancelUrl   = clientCancelUrl || `${appUrl}/commande/annulation?payment_id=${paymentId}`;

    // --- Appel à PayBammite ---
    let paybammiteResponse;
    try {
      paybammiteResponse = await initiatePay({
        customer_name,
        phone_number,
        amount:         totalAmount,
        country,
        payment_method,
        customer_email,
        description:    clientDescription || `Commande JogaLook #${targetOrder.order_number}`,
        reference:      paymentId,
        callback_url:   callbackUrl,
        return_url:     returnUrl,
        cancel_url:     cancelUrl,
      });
    } catch (apiError) {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'FAILED', payload: { error: apiError.message }, updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      return res.status(502).json({
        success: false,
        message: `Impossible de contacter la passerelle de paiement : ${apiError.message}`,
      });
    }

    // --- Stocker le token PayBammite dans la table payments ---
    const paybammiteToken = paybammiteResponse.token || null;
    await supabaseAdmin
      .from('payments')
      .update({
        transaction_reference: paybammiteToken,
        payload: {
          customer_name: customer_name ? customer_name.trim() : null,
          phone_number: phone_number ? phone_number.replace(/\s/g, '') : null,
          shipping_address: shipping_address || delivery_address || null,
          items: items || [],
          paybammite_response: paybammiteResponse,
          initiated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    // --- Réponse au client ---
    return res.status(201).json({
      success: true,
      is_cod: false,
      message: paybammiteResponse.message || 'Paiement initié avec succès.',
      data: {
        payment_id:     paymentId,
        order_number:   targetOrder.order_number,
        amount:         totalAmount,
        status:         paybammiteResponse.status || 'PENDING',
        checkout_url:   paybammiteResponse.checkout_url || null,
        redirectUrl:    paybammiteResponse.redirectUrl || null,
        payment_url:    paybammiteResponse.payment_url || null,
        token:          paybammiteToken,
        transaction_id: paybammiteResponse.transaction_id || null,
        partner_urls:   paybammiteResponse.partner_urls || null,
      },
    });
  } catch (error) {
    console.error('❌ [initiatePayment]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 2. WEBHOOK — CONFIRMATION PAYBAMMITE
// ==============================================================================

/**
 * POST /service/payment/webhook
 *
 * PayBammite envoie : { token, status, transaction_id, ... }
 * On met à jour `payments` et `orders` automatiquement.
 */
exports.handleWebhook = async (req, res) => {
  try {
    const { token, status, transaction_id } = req.body;

    console.log('📩 [Webhook PayBammite]', { token, status, transaction_id });

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token PayBammite manquant.' });
    }

    // --- Retrouver le paiement via le token stocké (avec payload existant) ---
    const { data: payment, error: findError } = await supabaseAdmin
      .from('payments')
      .select('id, order_id, status, amount, payload')
      .eq('transaction_reference', token)
      .single();

    if (findError || !payment) {
      console.warn('⚠️ [Webhook] Aucun paiement trouvé pour le token :', token);
      // Répondre 200 pour que PayBammite ne re-tente pas indéfiniment
      return res.status(200).json({ success: false, message: 'Token inconnu, ignoré.' });
    }

    // Éviter de retraiter un paiement déjà finalisé
    if (payment.status === 'SUCCESS' || payment.status === 'REFUNDED') {
      return res.status(200).json({ success: true, message: 'Déjà traité.' });
    }

    // --- Mapper le statut PayBammite → notre enum payment_status ---
    const statusMap = {
      completed:  'SUCCESS',
      success:    'SUCCESS',
      failed:     'FAILED',
      cancelled:  'FAILED',
      pending:    'PENDING',
    };
    const newPaymentStatus = statusMap[(status || '').toLowerCase()] || 'FAILED';

    // --- Mettre à jour le paiement ---
    await supabaseAdmin
      .from('payments')
      .update({
        status: newPaymentStatus,
        payload: {
          ...(payment.payload || {}),
          webhook_received_at: new Date().toISOString(),
          paybammite_status:   status,
          transaction_id,
          raw:                 req.body,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // --- Si paiement réussi : passer la commande à PAID ---
    if (newPaymentStatus === 'SUCCESS') {
      // Récupérer le statut actuel pour le log
      const { data: currentOrder } = await supabaseAdmin
        .from('orders')
        .select('status')
        .eq('id', payment.order_id)
        .single();

      await supabaseAdmin
        .from('orders')
        .update({ status: 'PAID', updated_at: new Date().toISOString() })
        .eq('id', payment.order_id);

      // Historisation dans order_logs
      await supabaseAdmin.from('order_logs').insert([{
        order_id:        payment.order_id,
        actor_id:        null, // action automatique du système
        previous_status: currentOrder ? currentOrder.status : 'PENDING',
        new_status:      'PAID',
        note:            `Paiement confirmé par PayBammite — Réf: ${token} — Montant: ${payment.amount} FCFA`,
      }]);

      console.log(`✅ [Webhook] Commande ${payment.order_id} passée à PAID`);
    }

    // PayBammite attend un 200 pour ne pas re-tenter
    return res.status(200).json({ success: true, message: 'Webhook traité avec succès.' });
  } catch (error) {
    console.error('❌ [Webhook PayBammite]', error);
    // On renvoie 200 quand même pour éviter les boucles de retry PayBammite
    return res.status(200).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 3. CONSULTER LE STATUT D'UN PAIEMENT
// ==============================================================================

/**
 * GET /service/payment/status/:payment_id
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.params;

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select(`
        id, status, amount, payment_method, transaction_reference, created_at, updated_at,
        orders ( id, order_number, status, total_amount )
      `)
      .eq('id', payment_id)
      .single();

    if (error || !payment) {
      return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
    }

    return res.json({
      success: true,
      data: {
        payment_id:            payment.id,
        payment_status:        payment.status,
        amount:                payment.amount,
        payment_method:        payment.payment_method,
        transaction_reference: payment.transaction_reference,
        created_at:            payment.created_at,
        updated_at:            payment.updated_at,
        order:                 payment.orders,
      },
    });
  } catch (error) {
    console.error('❌ [getPaymentStatus]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 4. SOLDE PARTENAIRE (ADMIN SEULEMENT)
// ==============================================================================

/**
 * GET /service/payment/balance?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
exports.getPartnerBalance = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await getBalance({ from, to });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ [getPartnerBalance]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 5. VÉRIFIER UN PAIEMENT CÔTÉ PAYBAMMITE (par token)
// ==============================================================================

/**
 * POST /service/payment/verify
 *
 * Interroge directement l'API PayBammite pour obtenir le statut en temps réel,
 * puis met à jour en cascade : payments → orders → order_logs.
 * Si PayBammite ne répond pas (endpoint indisponible), on lit le statut local en BDD.
 *
 * Body : { token: string }
 * Réponse : { success, data: { status, transaction_id, amount_fcfa, ... } }
 */
exports.verifyPaymentStatus = async (req, res) => {
  try {
    const { token, status_hint } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Le champ "token" est requis.',
      });
    }

    // ─── 1. Charger l'enregistrement local avec commande liée ───
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select(`
        id, status, amount, order_id, payment_method, transaction_reference, payload,
        orders ( id, order_number, status, total_amount )
      `)
      .eq('transaction_reference', token)
      .maybeSingle();

    // ─── 2. Interroger PayBammite en temps réel ───
    let paybammiteData = null;
    let apiError = null;
    try {
      paybammiteData = await verifyPayment(token);
    } catch (err) {
      apiError = err.message;
      console.warn('⚠️ [verifyPaymentStatus] API PayBammite KO, fallback sur BDD locale / status_hint :', err.message);
    }

    // ─── 3. Mapper le statut ───
    const statusMap = {
      completed:  'SUCCESS',
      success:    'SUCCESS',
      paid:       'SUCCESS',
      failed:     'FAILED',
      cancelled:  'FAILED',
      pending:    'PENDING',
      processing: 'PENDING',
    };

    let mappedStatus = 'PENDING';
    if (paybammiteData && paybammiteData.status) {
      const remoteStatus = String(paybammiteData.status).toLowerCase();
      mappedStatus = statusMap[remoteStatus] || 'PENDING';
    } else if (status_hint) {
      const hint = String(status_hint).toLowerCase();
      mappedStatus = statusMap[hint] || (payment ? payment.status : 'PENDING');
    } else if (payment) {
      mappedStatus = payment.status;
    }

    const now = new Date().toISOString();

    // ─── 4. Mise à jour BDD si le statut a changé et est final (SUCCESS ou FAILED) ───
    let orderNumber = payment?.orders?.order_number || null;

    if (payment && (payment.status !== mappedStatus || payment.orders?.status !== (mappedStatus === 'SUCCESS' ? 'PAID' : 'PAYMENT_FAILED')) && mappedStatus !== 'PENDING') {

      // 4a. Mettre à jour payments (statut + payload fusionné)
      await supabaseAdmin
        .from('payments')
        .update({
          status:     mappedStatus,
          payload:    {
            ...(payment.payload || {}),
            verify_received_at:   now,
            paybammite_status:    paybammiteData?.status || status_hint || null,
            transaction_id:       paybammiteData?.transaction_id || null,
            amount_paybammite:    paybammiteData?.amount || null,
            raw_verify:           paybammiteData || null,
            status_hint:          status_hint || null,
            api_error:            apiError || null,
          },
          updated_at: now,
        })
        .eq('id', payment.id);

      // 4b. Mettre à jour orders
      const newOrderStatus = mappedStatus === 'SUCCESS' ? 'PAID' : 'PAYMENT_FAILED';
      const { data: currentOrder } = await supabaseAdmin
        .from('orders')
        .select('status, order_number')
        .eq('id', payment.order_id)
        .maybeSingle();

      if (currentOrder) {
        orderNumber = currentOrder.order_number;
      }

      await supabaseAdmin
        .from('orders')
        .update({ status: newOrderStatus, updated_at: now })
        .eq('id', payment.order_id);

      // 4c. Log dans order_logs
      await supabaseAdmin
        .from('order_logs')
        .insert([{
          order_id:        payment.order_id,
          actor_id:        null,
          previous_status: currentOrder?.status || 'PENDING',
          new_status:      newOrderStatus,
          note: mappedStatus === 'SUCCESS'
            ? `Paiement confirmé (verify) — Token: ${token} — Montant: ${paybammiteData?.amount || payment.amount} FCFA`
            : `Paiement échoué/annulé (verify) — Token: ${token}`,
        }]);

      console.log(`✅ [verifyPaymentStatus] Paiement ${payment.id} mis à jour : ${mappedStatus} | Commande ${payment.order_id} → ${newOrderStatus}`);
    }

    // ─── 5. Réponse au frontend ───
    const finalLocalStatus = (payment && payment.status !== mappedStatus && mappedStatus !== 'PENDING')
      ? mappedStatus
      : (payment?.status || mappedStatus);

    return res.json({
      success: true,
      data: {
        token,
        paybammite_status: paybammiteData?.status || status_hint || null,
        local_status:      finalLocalStatus,
        order_status:      finalLocalStatus === 'SUCCESS' ? 'PAID' : (finalLocalStatus === 'FAILED' ? 'PAYMENT_FAILED' : 'PENDING'),
        order_number:      orderNumber,
        amount_fcfa:       paybammiteData?.amount || payment?.amount || null,
        transaction_id:    paybammiteData?.transaction_id || null,
        api_available:     !apiError,
        raw:               paybammiteData || null,
      },
    });
  } catch (error) {
    console.error('❌ [verifyPaymentStatus]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 6. INITIER UN PAY-OUT (TRANSFERT SORTANT) — FCFA
// ==============================================================================

/**
 * POST /service/payment/payout
 *
 * Envoie de l'argent (FCFA) vers un numéro Mobile Money via PayBammite (Pay-Out 2%).
 * Réservé aux utilisateurs authentifiés ayant un solde suffisant dans votre système.
 *
 * Body attendu :
 * {
 *   recipient_name:  string   — Nom du bénéficiaire
 *   phone_number:    string   — Numéro Mobile Money (sans indicatif)
 *   amount:          number   — Montant en FCFA (min 100)
 *   country:         string   — Code pays: 'sn'|'ci'|'bf'|'bj'|'tg'|'ml'|'cm'
 *   payment_method:  string   — 'wave'|'orange_money'|'mtn'|'moov'|...
 *   description?:    string
 * }
 */
exports.initiatePayoutPayment = async (req, res) => {
  try {
    const {
      recipient_name,
      phone_number,
      amount,
      country,
      payment_method,
      description,
    } = req.body;

    // --- Validation des champs requis ---
    const missing = [];
    if (!recipient_name) missing.push('recipient_name');
    if (!phone_number)   missing.push('phone_number');
    if (!amount)         missing.push('amount');
    if (!country)        missing.push('country');
    if (!payment_method) missing.push('payment_method');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs requis manquants : ${missing.join(', ')}`,
      });
    }

    // Validation montant FCFA
    const amountFcfa = Math.round(Number(amount));
    if (!amountFcfa || amountFcfa < 100) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être un entier en FCFA (minimum 100 FCFA).',
      });
    }

    // --- Construire les URLs de callback ---
    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;

    // --- Appel PayBammite Pay-Out ---
    let payoutResponse;
    try {
      payoutResponse = await initiatePayout({
        recipient_name,
        phone_number,
        amount:         amountFcfa,
        country,
        payment_method,
        description:    description || `Transfert JogaLook — ${amountFcfa} FCFA`,
        callback_url:   `${appUrl}/service/payment/webhook`,
      });
    } catch (apiError) {
      return res.status(502).json({
        success: false,
        message: `Impossible de contacter PayBammite : ${apiError.message}`,
      });
    }

    console.log(`💸 [Payout] ${amountFcfa} FCFA → ${phone_number} (${country}/${payment_method})`);

    return res.status(201).json({
      success: true,
      message: `Transfert de ${amountFcfa} FCFA initié avec succès.`,
      data: {
        amount_fcfa:    amountFcfa,
        recipient_name,
        phone_number,
        country,
        payment_method,
        status:         payoutResponse.status || 'PENDING',
        transaction_id: payoutResponse.transaction_id || null,
        raw:            payoutResponse,
      },
    });
  } catch (error) {
    console.error('❌ [initiatePayoutPayment]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 7. PRÉFÉRENCES UTILISATEUR & ÉLIGIBILITÉ PAIEMENT À LA LIVRAISON (COD)
// ==============================================================================

/**
 * GET /service/payment/user-preferences?user_id=UUID&phone=...
 *
 * Renvoie :
 * - La méthode de paiement préférée enregistrée
 * - L'éligibilité au paiement à la livraison (COD) selon la table user_reliability
 */
exports.getUserPaymentPreferences = async (req, res) => {
  try {
    let { user_id, phone, email } = req.query;

    // Si user_id n'est pas passé dans l'URL, tenter de le décoder depuis le token Bearer
    if (!user_id && req.headers.authorization) {
      try {
        const rawToken = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(rawToken);
        if (decoded?.id || decoded?.sub) user_id = decoded.id || decoded.sub;
      } catch (_) {}
    }

    // Si toujours pas de user_id, chercher par téléphone ou email
    if (!user_id && phone) {
      const cleanPhone = phone.replace(/[\s\-\.]/g, '').replace(/^(\+|00)(221|225|226|229|228|223|237)/, '');
      const { data: uPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .ilike('phone', `%${cleanPhone}%`)
        .limit(1)
        .maybeSingle();
      if (uPhone) user_id = uPhone.id;
    }

    if (!user_id && email) {
      const { data: uEmail } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      if (uEmail) user_id = uEmail.id;
    }

    let userInfo = null;
    let savedMethod = null;
    let isReliable = true;
    let codAllowed = true;
    let unreliabilityReason = null;

    // 1. Récupérer les informations de la table userinfo (dernière commande client)
    if (user_id) {
      try {
        const { data: uInfo } = await supabaseAdmin
          .from('userinfo')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();

        if (uInfo) userInfo = uInfo;
      } catch (e) {
        console.warn('userinfo query notice:', e.message);
      }
    }

    // 2. Récupérer la méthode par défaut enregistrée (table user_payment_methods)
    if (user_id) {
      try {
        const { data: pref } = await supabaseAdmin
          .from('user_payment_methods')
          .select('*')
          .eq('user_id', user_id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pref) savedMethod = pref;
      } catch (_) {}
    }

    // 3. Vérifier la table de fiabilité
    if (user_id || phone) {
      try {
        let q = supabaseAdmin.from('user_reliability').select('*');
        if (user_id) q = q.eq('user_id', user_id);
        else if (phone) q = q.eq('phone', phone.replace(/\s/g, ''));

        const { data: rel } = await q.maybeSingle();
        if (rel) {
          if (rel.is_reliable === false) isReliable = false;
          if (rel.cod_allowed === false) codAllowed = false;
          if (rel.notes) unreliabilityReason = rel.notes;
        }
      } catch (_) {}
    }

    return res.json({
      success: true,
      data: {
        user_info: userInfo,
        saved_method: savedMethod,
        cod: {
          eligible: isReliable && codAllowed,
          min_amount: 5000,
          max_amount: 100000,
          reason: !codAllowed || !isReliable ? (unreliabilityReason || 'Non éligible au paiement à la livraison') : null,
        }
      }
    });
  } catch (error) {
    console.error('❌ [getUserPaymentPreferences]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 8. TEST DIRECT — DEBUG EN TEMPS RÉEL (POUR LA PAGE DE TEST)
// ==============================================================================

/**
 * POST /service/payment/test-direct
 * Appelle directement l'API PayBammite et retourne TOUT le flux brut (requête, statut HTTP, réponse brute).
 */
exports.testPayinDirect = async (req, res) => {
  try {
    const PUBLIC_KEY  = process.env.PAYBAMMITE_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.PAYBAMMITE_PRIVATE_KEY;

    if (!PUBLIC_KEY || !PRIVATE_KEY) {
      return res.status(400).json({
        success: false,
        message: 'Clés PayBammite manquantes dans .env (PAYBAMMITE_PUBLIC_KEY / PAYBAMMITE_PRIVATE_KEY)',
      });
    }

    const {
      amount = 200,
      customer_name = 'Test Client JogaLook',
      phone_number = '781941351',
      customer_phone,
      payment_method = 'wave',
      country = 'sn',
      include_urls = true,
      custom_endpoint = '/payin/init.php',
    } = req.body;

    let cleanPhone = String(phone_number || customer_phone || '').replace(/[\s\-\.\(\)]/g, '');
    cleanPhone = cleanPhone.replace(/^(\+|00)/, '');
    cleanPhone = cleanPhone.replace(/^(221|225|226|229|228|223|237)/, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length >= 9) cleanPhone = cleanPhone.slice(1);

    const endpoint = custom_endpoint.startsWith('/') ? custom_endpoint : `/${custom_endpoint}`;
    const targetUrl = `https://pay.bammite.com${endpoint}`;

    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;

    const payload = {
      api:            PUBLIC_KEY,
      private_key:    PRIVATE_KEY,
      customer_name:  customer_name.trim(),
      phone_number:   cleanPhone,
      amount:         Math.round(Number(amount)),
      country,
      payment_method,
    };

    if (include_urls) {
      payload.return_url   = `${appUrl}/test-paiement?status=success`;
      payload.cancel_url   = `${appUrl}/test-paiement?status=cancelled`;
      payload.callback_url = `${appUrl}/service/payment/webhook`;
    }

    const startTime = Date.now();
    let responseText = '';
    let httpStatus = 0;
    let parsedData = null;
    let errorDetail = null;

    let responseHeaders = {};

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      httpStatus = response.status;
      for (const [k, v] of response.headers.entries()) {
        responseHeaders[k] = v;
      }
      responseText = await response.text();

      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        parsedData = null;
      }
    } catch (networkErr) {
      errorDetail = networkErr.message;
    }

    const durationMs = Date.now() - startTime;

    // Masquage strict de la clé privée avec des étoiles
    const maskedPrivateKey = '****************************************************************';
    const maskedApiKey = PUBLIC_KEY ? (PUBLIC_KEY.slice(0, 7) + '************************') : '****************';

    return res.json({
      success: httpStatus >= 200 && httpStatus < 300 && (parsedData?.success ?? true),
      duration_ms: durationMs,
      request: {
        url: targetUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload_sent: {
          ...payload,
          api: maskedApiKey,
          private_key: maskedPrivateKey,
        },
      },
      response: {
        http_status: httpStatus,
        status_text: httpStatus === 200 ? '200 OK' : `HTTP ${httpStatus}`,
        headers: responseHeaders,
        is_json: parsedData !== null,
        data: parsedData,
        raw_text: responseText,
        network_error: errorDetail,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

/**
 * POST /service/payment/user-preferences
 * Enregistre ou met à jour la méthode de paiement préférée
 */
exports.saveUserPaymentPreference = async (req, res) => {
  try {
    const { user_id, payment_method, phone_number, customer_name, country = 'sn' } = req.body;

    if (!user_id || !payment_method) {
      return res.status(400).json({ success: false, message: 'user_id et payment_method sont requis.' });
    }

    const { data, error } = await supabaseAdmin
      .from('user_payment_methods')
      .upsert([{
        user_id,
        payment_method,
        phone_number: phone_number ? phone_number.replace(/\s/g, '') : null,
        customer_name: customer_name ? customer_name.trim() : null,
        country,
        is_default: true,
        updated_at: new Date().toISOString(),
      }], { onConflict: 'user_id, payment_method, phone_number' })
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Préférence enregistrée avec succès.', data });
  } catch (error) {
    console.error('❌ [saveUserPaymentPreference]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

