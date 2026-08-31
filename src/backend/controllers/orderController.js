const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// COMMANDES - CONTROLLER CRUD
// ==============================================================================

// 1. Lister les commandes (Admin ou filtrées par utilisateur)
exports.getAllOrders = async (req, res) => {
  try {
    const { user_id, status, shop_id } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        users ( id, email, first_name, last_name, phone ),
        order_items (
          id, product_name, variant_info, quantity, unit_price, total_price,
          customizations ( id, svg_content, custom_name, custom_number )
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (user_id) query = query.eq('user_id', user_id);
    if (status) query = query.eq('status', status);
    if (shop_id) query = query.eq('shop_id', shop_id);

    const { data, error } = await query;

    if (error) throw error;

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Obtenir une commande par son ID avec détails complets (Produit + SVG personnalisé)
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        users ( id, email, first_name, last_name, phone ),
        shipping_address:addresses ( * ),
        order_items (
          id, product_name, variant_info, quantity, unit_price, total_price,
          product_variants ( id, size, color_name ),
          customizations ( id, svg_content, custom_name, custom_number, font_family, primary_color )
        ),
        payments ( * ),
        deliveries ( * )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Passer une nouvelle commande (avec articles standards ou personnalisations SVG)
exports.createOrder = async (req, res) => {
  try {
    const { user_id, shop_id, shipping_address_id, items, shipping_fee, tax_amount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Le panier de commande est vide' });
    }

    // Calcul du sous-total
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const total_amount = subtotal + (shipping_fee || 0) + (tax_amount || 0);

    const orderNumber = `JL-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Création de la commande
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        order_number: orderNumber,
        user_id,
        shop_id: shop_id || null,
        shipping_address_id: shipping_address_id || null,
        status: 'PENDING',
        subtotal,
        shipping_fee: shipping_fee || 0,
        tax_amount: tax_amount || 0,
        total_amount
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Insertion des lignes de commande (Order Items) avec lien customization_id si produit floqué
    const orderItemsToInsert = items.map(item => ({
      order_id: order.id,
      product_variant_id: item.product_variant_id,
      customization_id: item.customization_id || null, // Clé vers le SVG personnalisé
      product_name: item.product_name,
      variant_info: item.variant_info || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity
    }));

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItemsToInsert);

    if (itemsError) throw itemsError;

    // Ajouter une entrée dans la table order_logs
    await supabaseAdmin.from('order_logs').insert([{
      order_id: order.id,
      actor_id: user_id,
      new_status: 'PENDING',
      note: 'Commande créée par le client'
    }]);

    return res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Mettre à jour le statut d'une commande (Admin / Vendeur)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actor_id, note } = req.body;

    const { data: currentOrder } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Historisation dans order_logs
    await supabaseAdmin.from('order_logs').insert([{
      order_id: id,
      actor_id: actor_id || null,
      previous_status: currentOrder ? currentOrder.status : null,
      new_status: status,
      note: note || `Statut changé vers ${status}`
    }]);

    return res.json({ success: true, message: 'Statut de commande mis à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
