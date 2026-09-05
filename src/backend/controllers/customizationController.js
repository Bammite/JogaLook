const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET || 'jogalook_dev_secret';

function getUserIdFromReq(req) {
  if (req.body?.user_id) return req.body.user_id;
  const auth = req.headers?.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
      if (decoded?.user_id) return decoded.user_id;
    } catch (_) {}
  }
  return null;
}

// ==============================================================================
// PERSONNALISATIONS SVG CLIENT - CONTROLLER CRUD
// ==============================================================================

// 0. Lister toutes les personnalisations (avec filtres optionnels)
exports.getAllCustomizations = async (req, res) => {
  try {
    const { user_id, template_id } = req.query;

    let query = supabaseAdmin
      .from('customizations')
      .select(`
        *,
        templates ( id, name, thumbnail_url, image_front, image_back, template_type )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (user_id) query = query.eq('user_id', user_id);
    if (template_id) query = query.eq('template_id', template_id);

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 0.1 Lister les personnalisations de l'utilisateur connecté
exports.getMyCustomizations = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentification requise pour accéder à vos créations' });
    }

    const { data, error } = await supabaseAdmin
      .from('customizations')
      .select(`
        *,
        templates ( id, name, thumbnail_url, image_front, image_back, template_type )
      `)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 1. Lister les personnalisations d'un utilisateur spécifique
exports.getUserCustomizations = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('customizations')
      .select(`
        *,
        templates ( id, name, thumbnail_url, image_front, image_back, template_type )
      `)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Obtenir une personnalisation par son ID
exports.getCustomizationById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('customizations')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Personnalisation non trouvée' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Enregistrer une nouvelle personnalisation SVG
exports.createCustomization = async (req, res) => {
  try {
    const {
      user_id,
      template_id,
      title,
      svg_content,
      svg_front,
      svg_back,
      preview_image_url,
      custom_name,
      custom_number,
      font_family,
      primary_color,
      secondary_color,
      price,
      size,
      quantity,
      extra_config
    } = req.body;

    // Vérifier si template_id ressemble à un UUID valide
    const isUuid = template_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(template_id);
    const resolvedUserId = user_id || getUserIdFromReq(req);

    // Insertion de la personnalisation
    const { data, error } = await supabaseAdmin
      .from('customizations')
      .insert([{
        user_id: resolvedUserId || null,
        template_id: isUuid ? template_id : null,
        title: title || `Maillot ${custom_name || ''} #${custom_number || ''}`.trim(),
        svg_content: svg_front || svg_content || '',
        svg_front: svg_front || svg_content || '',
        svg_back: svg_back || null,
        preview_image_url,
        custom_name,
        custom_number,
        font_family,
        primary_color,
        secondary_color,
        price: price ? parseFloat(price) : 0,
        size: size || 'M',
        quantity: quantity ? parseInt(quantity, 10) : 1,
        extra_config
      }])
      .select()
      .single();

    if (error) throw error;

    // Si basée sur un template avec UUID valide, tenter d'incrémenter le compteur
    if (isUuid) {
      await supabaseAdmin.rpc('increment_template_usage', { template_uuid: template_id })
        .catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: 'Personnalisation SVG enregistrée avec succès',
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Supprimer une personnalisation (Soft delete / Corbeille)
exports.deleteCustomization = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('customizations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Personnalisation déplacée vers la corbeille', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
