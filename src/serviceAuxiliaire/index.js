'use strict';

/**
 * index.js — Point d'entrée du service auxiliaire JogaLook
 * Monté sur : /service/ dans src/index.js
 */

const express = require('express');
const router  = express.Router();

// --- Santé du service ---
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Service auxiliaire JogaLook opérationnel.' });
});

// --- Service de paiement PayBammite ---
router.use('/payment', require('./payement/paymentRoutes'));

module.exports = router;
