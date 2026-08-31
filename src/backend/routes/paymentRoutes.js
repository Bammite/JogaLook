const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getAllPayments);
router.post('/', paymentController.createPayment);
router.patch('/:id/status', paymentController.updatePaymentStatus);

module.exports = router;
