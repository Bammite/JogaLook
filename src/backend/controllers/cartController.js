const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// PANIER & ARTICLES DU PANIER - CONTROLLER CRUD
// ==============================================================================

exports.getCart = async (req, res) => {
  try {
    const { user_id, session_token } = req.query;

    let query = supabaseAdmin
      .from('carts')
      .select(`
        *,
        cart_items (
          id, quantity, unit_price,
          product_variants ( id, size, color_name, color_hex, stock_quantity, products ( id, name, base_price ) ),
          customizations ( id, title, svg_content, custom_name, custom_number )
        )
      `);

    if (user_id) query = query.eq('user_id', user_id);
    else if (session_token) query = query.eq('session_token', session_token);
    else return res.status(400).json({ success: false, message: 'Fournir user_id ou session_token' });

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error;

    return res.json({ success: true, data: data || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { user_id, session_token, product_variant_id, customization_id, quantity, unit_price } = req.body;

    // 1. Trouver ou créer le panier
    let cart;
    let cartQuery = supabaseAdmin.from('carts').select('*');
    if (user_id) cartQuery = cartQuery.eq('user_id', user_id);
    else cartQuery = cartQuery.eq('session_token', session_token);

    const { data: existingCart } = await cartQuery.single();

    if (existingCart) {
      cart = existingCart;
    } else {
      const { data: newCart, error: createCartErr } = await supabaseAdmin
        .from('carts')
        .insert([{ user_id: user_id || null, session_token: session_token || null }])
        .select()
        .single();
      if (createCartErr) throw createCartErr;
      cart = newCart;
    }

    // 2. Ajouter l'article dans cart_items
    const { data: item, error: itemErr } = await supabaseAdmin
      .from('cart_items')
      .insert([{
        cart_id: cart.id,
        product_variant_id,
        customization_id: customization_id || null,
        quantity: quantity || 1,
        unit_price
      }])
      .select()
      .single();

    if (itemErr) throw itemErr;

    return res.status(201).json({ success: true, message: 'Article ajouté au panier', data: { cart, item } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, message: 'Quantité mise à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { data, error } = await supabaseAdmin.from('cart_items').delete().eq('id', itemId).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Article retiré du panier', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
