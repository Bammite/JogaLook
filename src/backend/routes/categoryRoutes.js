const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// GET /api/categories/parents — liste des catégories racines (utilisables comme parent)
// ⚠️ Doit être avant /:id pour ne pas être traité comme un id
router.get('/parents', categoryController.getParentCategories);

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
