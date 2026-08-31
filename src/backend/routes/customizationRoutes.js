const express = require('express');
const router = express.Router();
const customizationController = require('../controllers/customizationController');

// Routes CRUD Personnalisations SVG Utilisateur
router.get('/user/:userId', customizationController.getUserCustomizations);
router.get('/:id', customizationController.getCustomizationById);
router.post('/', customizationController.createCustomization);
router.delete('/:id', customizationController.deleteCustomization);

module.exports = router;
