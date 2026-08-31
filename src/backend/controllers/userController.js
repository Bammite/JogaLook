const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// UTILISATEURS - CONTROLLER CRUD
// ==============================================================================

// 1. Lister tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;

    let query = supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone, role, status, avatar_url, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Obtenir un utilisateur par son ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*, addresses (*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Mettre à jour le profil d'un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Ne pas autoriser la mise à jour directe du mot de passe par cette route
    delete updates.password_hash;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Profil utilisateur mis à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Soft-delete d'un utilisateur (Corbeille)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'BLOCKED'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Utilisateur déplacé dans la corbeille', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
