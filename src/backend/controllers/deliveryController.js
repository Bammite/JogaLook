const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// LIVRAISONS & LIVREURS - CONTROLLER CRUD
// ==============================================================================

exports.getAllDeliveries = async (req, res) => {
  try {
    const { deliverer_id, status } = req.query;
    let query = supabaseAdmin.from('deliveries').select('*, orders ( order_number, total_amount ), users!deliveries_deliverer_id_fkey ( id, first_name, last_name, phone )').order('created_at', { ascending: false });
    if (deliverer_id) query = query.eq('deliverer_id', deliverer_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDelivery = async (req, res) => {
  try {
    const { order_id, deliverer_id, tracking_number, notes } = req.body;
    const tracking = tracking_number || `TRK-${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabaseAdmin
      .from('deliveries')
      .insert([{ order_id, deliverer_id: deliverer_id || null, tracking_number: tracking, status: deliverer_id ? 'ASSIGNED' : 'PENDING', notes }])
      .select().single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Livraison planifiée avec succès', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliverer_id, notes } = req.body;

    const updates = { status, updated_at: new Date().toISOString() };
    if (deliverer_id) updates.deliverer_id = deliverer_id;
    if (notes) updates.notes = notes;
    if (status === 'PICKED_UP') updates.pickup_time = new Date().toISOString();
    if (status === 'DELIVERED') updates.delivered_time = new Date().toISOString();

    const { data, error } = await supabaseAdmin.from('deliveries').update(updates).eq('id', id).select().single();
    if (error) throw error;

    // Si livrée, mettre à jour la commande correspondante
    if (status === 'DELIVERED' && data.order_id) {
      await supabaseAdmin.from('orders').update({ status: 'DELIVERED' }).eq('id', data.order_id);
    }

    return res.json({ success: true, message: 'Statut de livraison mis à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
