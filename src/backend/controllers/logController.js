const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// LOGS (LOGIN / ORDER / RESERVATION) - CONTROLLER
// ==============================================================================

// --- LOGIN LOGS ---

exports.getLoginLogs = async (req, res) => {
  try {
    const { user_id, status, limit = 100 } = req.query;
    let query = supabaseAdmin
      .from('login_logs')
      .select('*, users ( id, email, first_name, last_name )')
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (user_id) query = query.eq('user_id', user_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

async function insertLoginLog({ user_id, email_attempted, ip_address, user_agent, status, failure_reason }) {
  const { data, error } = await supabaseAdmin
    .from('login_logs')
    .insert([{ user_id: user_id || null, email_attempted, ip_address, user_agent, status, failure_reason }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

exports.createLoginLog = async (req, res) => {
  try {
    const loginData = await insertLoginLog(req.body);
    return res.status(201).json({ success: true, data: loginData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.logLoginAttempt = insertLoginLog;

// --- ORDER LOGS ---

exports.getOrderLogs = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('order_logs')
      .select('*, users!order_logs_actor_id_fkey ( id, first_name, last_name, role )')
      .eq('order_id', order_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- RESERVATION LOGS ---

exports.getAllReservations = async (req, res) => {
  try {
    const { user_id, status } = req.query;
    let query = supabaseAdmin
      .from('reservation_logs')
      .select(`
        *,
        users ( id, email, first_name, last_name ),
        product_variants ( id, size, color_name, products ( id, name ) )
      `)
      .order('created_at', { ascending: false });

    if (user_id) query = query.eq('user_id', user_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { user_id, product_variant_id, quantity, duration_minutes = 30 } = req.body;
    const expires_at = new Date(Date.now() + duration_minutes * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('reservation_logs')
      .insert([{ user_id: user_id || null, product_variant_id, quantity, status: 'ACTIVE', expires_at }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: `Réservation active pendant ${duration_minutes} minutes`, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabaseAdmin
      .from('reservation_logs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, message: 'Statut de réservation mis à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
