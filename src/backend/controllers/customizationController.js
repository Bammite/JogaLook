const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// PERSONNALISATIONS SVG CLIENT - CONTROLLER CRUD
// ==============================================================================

// 1. Lister les personnalisations d'un utilisateur spécifique
exports.getUserCustomizations = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('customizations')
      .select(`
        *,
        templates ( id, name, thumbnail_url )
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

    // Insertion de la personnalisation
    const { data, error } = await supabaseAdmin
      .from('customizations')
      .insert([{
        user_id: user_id || null,
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
