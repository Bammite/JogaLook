const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// SHOPS (BOUTIQUES) - CONTROLLER CRUD
// ==============================================================================

exports.getAllShops = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('shops').select('*, users!shops_owner_id_fkey ( id, email, first_name, last_name )').is('deleted_at', null).order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('shops').select('*, products (*)').or(`id.eq.${id},slug.eq.${id}`).is('deleted_at', null).single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createShop = async (req, res) => {
  try {
    const { owner_id, name, slug, description, logo_url, banner_url, is_verified } = req.body;
    const { data, error } = await supabaseAdmin
      .from('shops')
      .insert([{ owner_id, name, slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description, logo_url, banner_url, is_verified: is_verified || false }])
      .select().single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Boutique créée avec succès', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabaseAdmin.from('shops').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Boutique mise à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('shops').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Boutique supprimée (corbeille)', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
