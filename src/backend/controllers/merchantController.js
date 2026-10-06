const { supabaseAdmin } = require('../supabaseClient');
const productController = require('./productController');

exports.getOverview = async (req, res) => {
  try {
    const { data: products, error: productError } = await supabaseAdmin
      .from('products').select('id, is_active').eq('shop_id', req.merchant.shop.id).is('deleted_at', null);
    if (productError) throw productError;

    let orderCount = 0;
    const productIds = (products || []).map((item) => item.id);
    if (productIds.length) {
      const { data: variants, error: variantError } = await supabaseAdmin
        .from('product_variants').select('id').in('product_id', productIds);
      if (variantError) throw variantError;

      if (variants?.length) {
      const { data: orderItems, error: orderItemError } = await supabaseAdmin
        .from('order_items').select('order_id').in('product_variant_id', variants.map((variant) => variant.id));
      if (orderItemError) throw orderItemError;
      orderCount = new Set((orderItems || []).map((item) => item.order_id)).size;
      }
    }

    return res.json({
      success: true,
      data: {
        shop: req.merchant.shop,
        products: products?.length || 0,
        activeProducts: (products || []).filter((item) => item.is_active !== false).length,
        orders: orderCount,
      },
    });
  } catch (error) {
    console.error('[merchant] overview:', error);
    return res.status(500).json({ success: false, message: 'Impossible de charger le tableau de bord.' });
  }
};

exports.getProducts = async (req, res) => {
  return productController.getAllProducts(req, res);
};

exports.createProduct = async (req, res) => {
  req.body.shop_id = req.merchant.shop.id;
  return productController.createProduct(req, res);
};

exports.updateProduct = async (req, res) => {
  const { data: product, error } = await supabaseAdmin.from('products')
    .select('id').eq('id', req.params.id).eq('shop_id', req.merchant.shop.id).is('deleted_at', null).maybeSingle();
  if (error) return res.status(500).json({ success: false, message: error.message });
  if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable dans votre boutique.' });

  // Le propriétaire ne peut jamais déplacer son produit vers une autre boutique.
  req.body.shop_id = req.merchant.shop.id;
  return productController.updateProduct(req, res);
};

exports.deleteProduct = async (req, res) => {
  const { data: product, error } = await supabaseAdmin.from('products')
    .select('id').eq('id', req.params.id).eq('shop_id', req.merchant.shop.id).is('deleted_at', null).maybeSingle();
  if (error) return res.status(500).json({ success: false, message: error.message });
  if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable dans votre boutique.' });

  return productController.deleteProduct(req, res);
};

exports.getOrders = async (req, res) => {
  try {
    const { data: products, error: productError } = await supabaseAdmin
      .from('products').select('id').eq('shop_id', req.merchant.shop.id);
    if (productError) throw productError;
    const productIds = (products || []).map((item) => item.id);
    if (!productIds.length) return res.json({ success: true, count: 0, data: [] });

    const { data: variants, error: variantError } = await supabaseAdmin
      .from('product_variants').select('id').in('product_id', productIds);
    if (variantError) throw variantError;
    const variantIds = (variants || []).map((item) => item.id);
    if (!variantIds.length) return res.json({ success: true, count: 0, data: [] });

    const { data: orderItems, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select('id, order_id, product_variant_id, product_name, variant_info, quantity, unit_price, total_price, customizations ( id, title, preview_image_url )')
      .in('product_variant_id', variantIds);
    if (itemError) throw itemError;
    const orderIds = [...new Set((orderItems || []).map((item) => item.order_id))];
    if (!orderIds.length) return res.json({ success: true, count: 0, data: [] });

    const { data: orders, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, total_amount, created_at, users ( id, email, first_name, last_name, phone ), shipping_address:addresses ( recipient_name, phone, street_address, city, state_region, country ), payments ( payment_method, status, transaction_reference )')
      .in('id', orderIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (orderError) throw orderError;

    const itemsByOrder = new Map();
    (orderItems || []).forEach((item) => {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id).push(item);
    });
    const data = (orders || []).map((order) => ({ ...order, order_items: itemsByOrder.get(order.id) || [] }));
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('[merchant] orders:', error);
    return res.status(500).json({ success: false, message: 'Impossible de charger les commandes.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, shop_name, description, logo_url } = req.body;
    const userUpdates = {};
    if (first_name !== undefined) userUpdates.first_name = String(first_name).trim().slice(0, 100);
    if (last_name !== undefined) userUpdates.last_name = String(last_name).trim().slice(0, 100);
    if (phone !== undefined) userUpdates.phone = String(phone).trim().slice(0, 40) || null;

    let user = req.merchant.user;
    if (Object.keys(userUpdates).length) {
      const { data, error } = await supabaseAdmin.from('users').update({ ...userUpdates, updated_at: new Date().toISOString() })
        .eq('id', user.id).select('id, email, first_name, last_name, phone, role').single();
      if (error) throw error;
      user = data;
    }

    const shopUpdates = {};
    if (shop_name !== undefined) shopUpdates.name = String(shop_name).trim().slice(0, 150);
    if (description !== undefined) shopUpdates.description = String(description).trim().slice(0, 2000) || null;
    if (logo_url !== undefined) shopUpdates.logo_url = String(logo_url).trim().slice(0, 2000) || null;

    let shop = req.merchant.shop;
    if (Object.keys(shopUpdates).length) {
      if (shopUpdates.name !== undefined && !shopUpdates.name) {
        return res.status(400).json({ success: false, message: 'Le nom de la boutique est obligatoire.' });
      }
      const { data, error } = await supabaseAdmin.from('shops').update({ ...shopUpdates, updated_at: new Date().toISOString() })
        .eq('id', shop.id).eq('owner_id', user.id).select().single();
      if (error) throw error;
      shop = data;
    }

    return res.json({ success: true, message: 'Profil mis à jour.', data: { user, shop } });
  } catch (error) {
    console.error('[merchant] profile:', error);
    return res.status(500).json({ success: false, message: 'Impossible de mettre à jour le profil.' });
  }
};
