const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const controller = require('../controllers/keywordController');

router.get('/', controller.getAll);
router.get('/list', controller.getKeywords);
router.post('/', adminAuth, controller.createRelation);
router.put('/:id', adminAuth, controller.updateRelation);
router.delete('/:id', adminAuth, controller.deleteRelation);

module.exports = router;
