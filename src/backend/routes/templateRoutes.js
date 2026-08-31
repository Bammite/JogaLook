const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// Routes CRUD Templates SVG
router.get('/', templateController.getAllTemplates);
router.get('/:id', templateController.getTemplateById);
router.post('/', templateController.createTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);

module.exports = router;
