const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// ADMINS - CONTROLLER CRUD
// ==============================================================================

exports.getAllAdmins = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*, users ( id, email, first_name, last_name, phone, role )')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*, users ( id, email, first_name, last_name, phone, role )')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Admin non trouvé' });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { user_id, permissions, department } = req.body;

    // S'assurer que le rôle de l'utilisateur est passé à ADMIN ou SUPER_ADMIN
    await supabaseAdmin.from('users').update({ role: 'ADMIN' }).eq('id', user_id);

    const { data, error } = await supabaseAdmin
      .from('admins')
      .insert([{ user_id, permissions: permissions || [], department }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Administrateur créé avec succès', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('admins')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, message: 'Admin mis à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('admins').delete().eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Admin supprimé', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
