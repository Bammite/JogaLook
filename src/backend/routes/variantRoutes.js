const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variantController');

router.get('/', variantController.getAllVariants);
router.get('/product/:product_id', variantController.getVariantsByProduct);
router.get('/:id', variantController.getVariantById);
router.post('/', variantController.createVariant);
router.put('/:id', variantController.updateVariant);
router.patch('/:id/stock', variantController.adjustStock);
router.delete('/:id', variantController.deleteVariant);

module.exports = router;
