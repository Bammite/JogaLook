const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const controller = require('../controllers/sportsArticleController');

// ── Routes publiques (visiteurs & clients) ──
router.get('/categories', controller.getCategories);
router.get('/', controller.getArticles);
router.get('/:id', controller.getArticleById);

// ── Routes d'administration protégées (création, modification, suppression) ──
router.post('/', adminAuth, controller.createArticle);
router.put('/:id', adminAuth, controller.updateArticle);
router.delete('/:id', adminAuth, controller.deleteArticle);

module.exports = router;
