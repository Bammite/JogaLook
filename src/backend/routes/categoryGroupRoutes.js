const express = require('express');
const router = express.Router();
const categoryGroupController = require('../controllers/categoryGroupController');

// Routes publiques / catalogue
router.get('/', categoryGroupController.getAllGroups);
router.get('/:id', categoryGroupController.getGroupByIdOrSlug);

// Routes admin (création, modification, suppression)
router.post('/', categoryGroupController.createGroup);
router.put('/:id', categoryGroupController.updateGroup);
router.delete('/:id', categoryGroupController.deleteGroup);

module.exports = router;
