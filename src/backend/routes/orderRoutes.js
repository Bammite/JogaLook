const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Routes CRUD Commandes
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;
