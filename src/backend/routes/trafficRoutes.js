const express = require('express');
const router = express.Router();
const trafficController = require('../controllers/trafficController');
const adminAuth = require('../middleware/adminAuth');

// Routes protégées réservées aux administrateurs
router.get('/', adminAuth, trafficController.getVisits);
router.get('/stats', adminAuth, trafficController.getTrafficStats);

module.exports = router;
