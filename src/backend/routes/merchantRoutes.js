const express = require('express');
const shopOwnerAuth = require('../middleware/shopOwnerAuth');
const merchantController = require('../controllers/merchantController');

const router = express.Router();
router.use(shopOwnerAuth);
router.get('/overview', merchantController.getOverview);
router.get('/products', merchantController.getProducts);
router.post('/products', merchantController.createProduct);
router.put('/products/:id', merchantController.updateProduct);
router.delete('/products/:id', merchantController.deleteProduct);
router.get('/orders', merchantController.getOrders);
router.put('/profile', merchantController.updateProfile);

module.exports = router;
