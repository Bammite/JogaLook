const express = require('express');
const { submitReport, submitInquiry } = require('../controllers/productFeedbackController');

const router = express.Router();

router.post('/reports', submitReport);
router.post('/inquiries', submitInquiry);

module.exports = router;
