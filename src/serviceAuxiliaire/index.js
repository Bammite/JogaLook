'use strict';

/**
 * index.js — Point d'entrée du service auxiliaire JogaLook
 * Monté sur : /service/ dans src/index.js
 */

const express = require('express');
const router  = express.Router();
const adminAuth = require('../backend/middleware/adminAuth');
const { sendSms } = require('./sms');

// --- Santé du service ---
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Service auxiliaire JogaLook opérationnel.' });
});

// Test SMS réservé aux administrateurs JogaLook.
router.post('/sms/test', adminAuth, async (req, res) => {
  try {
    const { telephone, message, name } = req.body || {};
    const data = await sendSms({ telephone, message, name });
    return res.json({ success: true, message: 'SMS de test envoyé avec succès.', data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// --- Service de paiement PayBammite ---
router.use('/payment', require('./payement/paymentRoutes'));

module.exports = router;
