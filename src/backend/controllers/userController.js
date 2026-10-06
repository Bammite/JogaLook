const { supabaseAdmin } = require('../supabaseClient');
const shopController = require('./shopController');

const USER_FIELDS = 'id, email, first_name, last_name, phone, role, status, avatar_url, created_at, updated_at';
const USER_ROLES = ['CUSTOMER', 'SHOP_OWNER', 'DELIVERER', 'ADMIN', 'SUPER_ADMIN'];
const USER_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED'];

// ==============================================================================
// UTILISATEURS - CONTROLLER CRUD
// ==============================================================================

// 1. Lister tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;

    let query = supabaseAdmin
      .from('users')
      .select(USER_FIELDS)
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
      .select(`${USER_FIELDS}, addresses (*)`)
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
    const allowedFields = ['email', 'first_name', 'last_name', 'phone', 'role', 'status', 'avatar_url'];
    const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key)));
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'Aucune information modifiable fournie.' });
    }
    if (updates.email !== undefined) {
      updates.email = String(updates.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
        return res.status(400).json({ success: false, message: 'Adresse email invalide.' });
      }
    }
    for (const field of ['first_name', 'last_name', 'phone', 'avatar_url']) {
      if (updates[field] !== undefined) updates[field] = String(updates[field]).trim() || null;
    }
    if (updates.role !== undefined && !USER_ROLES.includes(updates.role)) {
      return res.status(400).json({ success: false, message: 'Rôle utilisateur invalide.' });
    }
    if (updates.status !== undefined && !USER_STATUSES.includes(updates.status)) {
      return res.status(400).json({ success: false, message: 'Statut utilisateur invalide.' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(USER_FIELDS)
      .single();

    if (error) throw error;

    // Dès qu'un compte devient boutiquier actif, lui créer sa boutique s'il n'en a pas.
    if (data.role === 'SHOP_OWNER' && data.status === 'ACTIVE') {
      const shopResult = await shopController.ensureShopForOwner(data.id);
      if (shopResult.error) return res.status(400).json({ success: false, message: shopResult.error });
    }

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
      .select(USER_FIELDS)
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Utilisateur déplacé dans la corbeille', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
