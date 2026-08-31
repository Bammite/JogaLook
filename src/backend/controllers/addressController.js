const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// ADRESSES - CONTROLLER CRUD
// ==============================================================================

exports.getAllAddresses = async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = supabaseAdmin.from('addresses').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    if (user_id) query = query.eq('user_id', user_id);

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('addresses').select('*').eq('id', id).is('deleted_at', null).single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Adresse non trouvée' });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const { user_id, recipient_name, phone, street_address, city, state_region, postal_code, country, is_default } = req.body;
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert([{ user_id, recipient_name, phone, street_address, city, state_region, postal_code, country: country || 'Sénégal', is_default: is_default || false }])
      .select().single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Adresse créée avec succès', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabaseAdmin.from('addresses').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Adresse mise à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('addresses').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Adresse supprimée (corbeille)', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
