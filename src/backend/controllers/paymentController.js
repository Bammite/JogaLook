const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// PAIEMENTS - CONTROLLER CRUD
// ==============================================================================

exports.getAllPayments = async (req, res) => {
  try {
    const { order_id, status } = req.query;
    let query = supabaseAdmin.from('payments').select('*, orders ( order_number, total_amount )').order('created_at', { ascending: false });
    if (order_id) query = query.eq('order_id', order_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { order_id, payment_method, transaction_reference, amount, status, payload } = req.body;
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert([{ order_id, payment_method, transaction_reference, amount, status: status || 'PENDING', payload }])
      .select().single();

    if (error) throw error;

    // Si paiement réussi, passer la commande au statut 'PAID'
    if (status === 'SUCCESS') {
      await supabaseAdmin.from('orders').update({ status: 'PAID' }).eq('id', order_id);
    }

    return res.status(201).json({ success: true, message: 'Paiement enregistré', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payload } = req.body;
    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({ status, payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();

    if (error) throw error;
    return res.json({ success: true, message: 'Statut du paiement mis à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
