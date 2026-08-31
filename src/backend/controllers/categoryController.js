const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// CATEGORIES - CONTROLLER CRUD
// ==============================================================================

exports.getAllCategories = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('categories').select('*').is('deleted_at', null).order('name', { ascending: true });
    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getParentCategories = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('categories').select('*, products (*)').or(`id.eq.${id},slug.eq.${id}`).is('deleted_at', null).single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { parent_id, name, slug, description, image_url } = req.body;

    if (!name || !slug || !description || !image_url) {
      return res.status(400).json({ success: false, message: 'Les champs name, slug, description et image_url sont requis.' });
    }

    const normalizedName = name.trim();
    const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const normalizedDescription = description.trim();
    const normalizedImageUrl = image_url.trim();

    if (!normalizedName || !normalizedSlug || !normalizedDescription || !normalizedImageUrl) {
      return res.status(400).json({ success: false, message: 'Tous les champs obligatoires doivent être renseignés.' });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([{ parent_id: parent_id || null, name: normalizedName, slug: normalizedSlug, description: normalizedDescription, image_url: normalizedImageUrl }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Catégorie créée avec succès', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabaseAdmin.from('categories').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Catégorie mise à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('categories').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Catégorie supprimée (corbeille)', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
