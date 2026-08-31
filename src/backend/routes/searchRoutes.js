const express = require('express');
const router = express.Router();
const controller = require('../controllers/searchController');

router.get('/products', controller.searchProducts);

module.exports = router;
