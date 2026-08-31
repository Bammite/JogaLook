const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// SUPPLIERS (FOURNISSEURS) - CONTROLLER CRUD
// ==============================================================================

exports.getAllSuppliers = async (req, res) => {
  try {
    const { is_affiliated } = req.query;
    let query = supabaseAdmin.from('suppliers').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    if (is_affiliated !== undefined) query = query.eq('is_affiliated', is_affiliated === 'true');

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('suppliers').select('*, products (*)').eq('id', id).is('deleted_at', null).single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { name, contact_name, email, phone, address, is_affiliated, notes } = req.body;
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert([{ name, contact_name, email, phone, address, is_affiliated: is_affiliated || false, notes }])
      .select().single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Fournisseur créé avec succès', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabaseAdmin.from('suppliers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Fournisseur mis à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('suppliers').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Fournisseur supprimé (corbeille)', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
