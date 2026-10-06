const { supabaseAdmin } = require('../supabaseClient');

async function validateShopOwner(ownerId) {
  if (!ownerId) return 'Le compte boutiquier est obligatoire.';
  const { data: owner, error } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', ownerId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!owner || owner.role !== 'SHOP_OWNER' || owner.status !== 'ACTIVE') {
    return 'Le propriétaire doit être un compte boutiquier actif.';
  }
  return null;
}

async function generateShopForOwner(ownerId) {
  const ownerError = await validateShopOwner(ownerId);
  if (ownerError) return { error: ownerError };

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('shops').select('*').eq('owner_id', ownerId).is('deleted_at', null).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return { shop: existing, alreadyExisted: true };

  const { data: owner, error: userError } = await supabaseAdmin
    .from('users').select('id, email, first_name, last_name').eq('id', ownerId).single();
  if (userError) throw userError;
  const baseName = [owner.first_name, owner.last_name].filter(Boolean).join(' ').trim();
  const name = baseName ? `Boutique de ${baseName}` : `Boutique ${owner.email.split('@')[0]}`;
  const baseSlug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `boutique-${ownerId.slice(0, 8)}`;
  const { data, error } = await supabaseAdmin.from('shops').insert([{
    owner_id: ownerId,
    name,
    slug: `${baseSlug}-${ownerId.slice(0, 8)}`,
    description: '',
    is_verified: false,
  }]).select().single();
  if (error) throw error;
  return { shop: data, alreadyExisted: false };
}

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
    const { data: bySlug, error: slugError } = await supabaseAdmin
      .from('shops').select('*').eq('slug', id).is('deleted_at', null).maybeSingle();
    if (slugError) throw slugError;

    let data = bySlug;
    if (!data) {
      const { data: byId, error: idError } = await supabaseAdmin
        .from('shops').select('*').eq('id', id).is('deleted_at', null).maybeSingle();
      if (idError && idError.code !== '22P02') throw idError;
      data = byId;
    }
    if (!data) return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createShop = async (req, res) => {
  try {
    const { owner_id, name, slug, description, logo_url, banner_url, is_verified, is_active } = req.body;
    const ownerError = await validateShopOwner(owner_id);
    if (ownerError) return res.status(400).json({ success: false, message: ownerError });

    const { data, error } = await supabaseAdmin
      .from('shops')
      .insert([{ owner_id, name, slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description, logo_url, banner_url, is_verified: is_verified ?? false, is_active: is_active ?? true }])
      .select().single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Boutique créée avec succès', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateShopForOwner = async (req, res) => {
  try {
    const result = await generateShopForOwner(req.params.ownerId);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    return res.status(result.alreadyExisted ? 200 : 201).json({
      success: true,
      message: result.alreadyExisted ? 'Ce compte possède déjà une boutique.' : 'Boutique générée et liée au compte.',
      data: result.shop,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.ensureShopForOwner = generateShopForOwner;

exports.updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['owner_id', 'name', 'slug', 'description', 'logo_url', 'banner_url', 'is_verified', 'is_active'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'Aucune information de boutique à modifier.' });
    if (updates.owner_id !== undefined) {
      const ownerError = await validateShopOwner(updates.owner_id);
      if (ownerError) return res.status(400).json({ success: false, message: ownerError });
    }
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
