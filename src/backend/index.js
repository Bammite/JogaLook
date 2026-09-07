const express = require('express');
const router = express.Router();
const { isConfigured } = require('./supabaseClient');

// ==============================================================================
// API JOGALOOK - ROUTEUR PRINCIPAL
// Toutes les routes sont préfixées par /api (depuis src/index.js)
// ==============================================================================

// Route de santé
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API JogaLook opérationnelle',
    supabaseConfigured: isConfigured,
    timestamp: new Date().toISOString(),
    endpoints: {
      users:          'GET/POST/PUT/DELETE  /api/users',
      admins:         'GET/POST/PUT/DELETE  /api/admins',
      addresses:      'GET/POST/PUT/DELETE  /api/addresses',
      shops:          'GET/POST/PUT/DELETE  /api/shops',
      suppliers:      'GET/POST/PUT/DELETE  /api/suppliers',
      categories:     'GET/POST/PUT/DELETE  /api/categories',
      products:       'GET/POST/PUT/DELETE  /api/products',
      variants:       'GET/POST/PUT/PATCH/DELETE /api/variants',
      templates:      'GET/POST/PUT/DELETE  /api/templates',
      customizations: 'GET/POST/DELETE      /api/customizations',
      cart:           'GET/POST/PUT/DELETE  /api/cart',
      orders:         'GET/POST/PATCH       /api/orders',
      payments:       'GET/POST/PATCH       /api/payments',
      deliveries:     'GET/POST/PATCH       /api/deliveries',
      auth:           'POST                 /api/auth/login | /api/auth/verify-otp',
      otp:            'POST                 /api/otp/send | /api/otp/verify',
      logs:           'GET                  /api/logs/login | /api/logs/orders/:id | /api/logs/reservations',
      sportsNews:     'GET/POST/PUT/DELETE  /api/sports-news',
      keywords:       'GET/POST/DELETE       /api/keywords',
      search:         'GET                   /api/search/products?q=...',
    }
  });
});

// ==============================================================================
// UTILISATEURS & AUTH
// ==============================================================================
router.use('/users',         require('./routes/userRoutes'));
router.use('/admins',        require('./routes/adminRoutes'));
router.use('/auth',          require('./routes/authRoutes'));
router.use('/addresses',     require('./routes/addressRoutes'));
router.use('/otp',           require('./routes/otpRoutes'));

// ==============================================================================
// CATALOGUE
// ==============================================================================
router.use('/shops',         require('./routes/shopRoutes'));
router.use('/suppliers',     require('./routes/supplierRoutes'));
router.use('/categories',    require('./routes/categoryRoutes'));
router.use('/products',      require('./routes/productRoutes'));
router.use('/variants',      require('./routes/variantRoutes'));
router.use('/keywords',      require('./routes/keywordRoutes'));
router.use('/search',        require('./routes/searchRoutes'));

// ==============================================================================
// PERSONNALISATION SVG
// ==============================================================================
router.use('/templates',     require('./routes/templateRoutes'));
router.use('/customizations',require('./routes/customizationRoutes'));

// ==============================================================================
// COMMERCE
// ==============================================================================
router.use('/cart',          require('./routes/cartRoutes'));
router.use('/orders',        require('./routes/orderRoutes'));
router.use('/payments',      require('./routes/paymentRoutes'));
router.use('/deliveries',    require('./routes/deliveryRoutes'));

// ==============================================================================
// LOGS & TRAÇABILITÉ
// ==============================================================================
router.use('/logs',          require('./routes/logRoutes'));
router.use('/sports-news',   require('./routes/sportsArticleRoutes'));

// ==============================================================================
// UPLOAD (Storage Supabase)
// ==============================================================================
router.use('/upload',        require('./routes/upload'));

// ==============================================================================
// CONTACT & DEMANDES COMMERCIALES
// ==============================================================================
router.use('/contact',       require('./routes/contactRoutes'));

module.exports = router;

