const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// Login logs
router.get('/login', logController.getLoginLogs);
router.post('/login', logController.createLoginLog);

// Order logs (historique d'une commande)
router.get('/orders/:order_id', logController.getOrderLogs);

// Reservation logs
router.get('/reservations', logController.getAllReservations);
router.post('/reservations', logController.createReservation);
router.patch('/reservations/:id/status', logController.updateReservationStatus);

module.exports = router;
