const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// COMMANDES - CONTROLLER CRUD
// ==============================================================================

// Helper : enrichit une commande avec ses personnalisations complètes et repli payload
function enrichOrder(order) {
  if (!order) return order;
  const payloadItems = order.payments?.[0]?.payload?.items || [];

  // Si order_items est vide mais qu'il y a des items dans payments.payload
  if ((!order.order_items || order.order_items.length === 0) && payloadItems.length > 0) {
    order.order_items = payloadItems.map((it, idx) => {
      const customName = it.custom_name || it.extra_details?.playerName || null;
      const customNumber = it.custom_number || it.extra_details?.playerNumber || null;
      const isCustom = Boolean(it.preview_front || it.preview_back || it.svg_front || it.svg_back || it.extra_details || customName || customNumber);

      return {
        id: `pi-${idx}-${Date.now()}`,
        product_name: it.product_name || it.name || 'Produit JogaLook',
        variant_info: it.selectedSize ? `Taille: ${it.selectedSize}` : (it.size || null),
        quantity: it.quantity || 1,
        unit_price: Number(it.unit_price || it.price || 0),
        total_price: (it.quantity || 1) * Number(it.unit_price || it.price || 0),
        image: it.preview_front || it.image || it.image_url || null,
        preview_front: it.preview_front || it.image || null,
        preview_back: it.preview_back || null,
        svg_front: it.svg_front || null,
        svg_back: it.svg_back || null,
        customizations: isCustom ? {
          title: it.name,
          preview_image_url: it.preview_front || it.image,
          preview_front: it.preview_front || it.image,
          preview_back: it.preview_back,
          svg_front: it.svg_front,
          svg_back: it.svg_back,
          custom_name: customName,
          custom_number: customNumber,
          font_family: it.font_family || it.extra_details?.fontFamily || null,
          primary_color: it.selectedColor || it.extra_details?.bodyColor || null,
          secondary_color: it.extra_details?.stripesColor || it.extra_details?.bodyColor2 || null,
          extra_config: it.extra_details || null,
        } : null
      };
    });
  } else if (order.order_items && Array.isArray(order.order_items)) {
    // Enrichir les articles existants avec les détails stockés dans payments.payload ou custom_details si manquant
    order.order_items = order.order_items.map((item, idx) => {
      const matchInPayload = payloadItems[idx] || payloadItems.find(p => p.name === item.product_name) || null;
      
      let cust = item.customizations || null;
      if (item.custom_details) {
        cust = { ...item.custom_details, ...cust };
      }
      if (matchInPayload && (matchInPayload.preview_front || matchInPayload.preview_back || matchInPayload.extra_details)) {
        cust = {
          preview_front: matchInPayload.preview_front,
          preview_back: matchInPayload.preview_back,
          svg_front: matchInPayload.svg_front,
          svg_back: matchInPayload.svg_back,
          custom_name: matchInPayload.custom_name || matchInPayload.extra_details?.playerName || cust?.custom_name,
          custom_number: matchInPayload.custom_number || matchInPayload.extra_details?.playerNumber || cust?.custom_number,
          font_family: matchInPayload.font_family || matchInPayload.extra_details?.fontFamily || cust?.font_family,
          primary_color: matchInPayload.selectedColor || matchInPayload.extra_details?.bodyColor || cust?.primary_color,
          secondary_color: matchInPayload.extra_details?.stripesColor || matchInPayload.extra_details?.bodyColor2 || cust?.secondary_color,
          extra_config: matchInPayload.extra_details || cust?.extra_config,
          ...cust
        };
      }

      return {
        ...item,
        image: item.image || item.image_url || matchInPayload?.image || matchInPayload?.image_url || null,
        preview_front: item.preview_front || cust?.preview_front || cust?.preview_image_url || null,
        preview_back: item.preview_back || cust?.preview_back || null,
        customizations: cust
      };
    });
  }

  return order;
}

// 1. Lister les commandes (Admin ou filtrées par utilisateur)
exports.getAllOrders = async (req, res) => {
  try {
    const { user_id, status, shop_id } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        users ( id, email, first_name, last_name, phone ),
        shipping_address:addresses ( id, recipient_name, phone, street_address, city, state_region, postal_code, country ),
        order_items (
          id, product_name, variant_info, quantity, unit_price, total_price,
          product_variants ( id, size, color_name, color_hex, products ( id, name, image_url ) ),
          customizations ( id, title, svg_content, svg_front, svg_back, preview_image_url, custom_name, custom_number, font_family, primary_color, secondary_color, extra_config )
        ),
        payments ( id, payment_method, amount, status, transaction_reference, payload, created_at, updated_at ),
        deliveries ( id, tracking_number, status, pickup_time, delivered_time, notes, created_at, updated_at )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (user_id) query = query.eq('user_id', user_id);
    if (status) query = query.eq('status', status);
    if (shop_id) query = query.eq('shop_id', shop_id);

    const { data, error } = await query;

    if (error) throw error;

    const enriched = (data || []).map(enrichOrder);

    return res.json({ success: true, count: enriched.length, data: enriched });
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
          product_variants ( id, size, color_name, color_hex, products ( id, name, image_url ) ),
          customizations ( id, title, svg_content, svg_front, svg_back, preview_image_url, custom_name, custom_number, font_family, primary_color, secondary_color, extra_config )
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

    return res.json({ success: true, data: enrichOrder(data) });
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
