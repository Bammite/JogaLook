const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// TEMPLATES SVG - CONTROLLER CRUD
// ==============================================================================

// 1. Lister les templates (Publics et/ou appartenant au site/utilisateur)
exports.getAllTemplates = async (req, res) => {
  try {
    const { visibility = 'PUBLIC', is_free } = req.query;

    let query = supabaseAdmin
      .from('templates')
      .select('*')
      .is('deleted_at', null)
      .order('usage_count', { ascending: false });

    if (visibility) query = query.eq('visibility', visibility);
    if (is_free !== undefined) query = query.eq('is_free', is_free === 'true');

    const { data, error } = await query;

    if (error) throw error;

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Obtenir un template par son ID
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('templates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Template non trouvé' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Créer un nouveau template SVG
exports.createTemplate = async (req, res) => {
  try {
    const {
      name,
      description,
      template_type,
      image_front,
      image_back,
      flocking_config,
      svg_content,
      svg_front,
      svg_back,
      badge_url,
      badge_svg,
      editable_elements,
      layers_config,
      thumbnail_url,
      visibility,
      is_free,
      price,
      owner_id
    } = req.body;

    const frontContent = svg_front || svg_content || '';

    const { data, error } = await supabaseAdmin
      .from('templates')
      .insert([{
        owner_id: owner_id || null, // NULL = Appartient au site
        name,
        description,
        template_type: template_type || (image_front ? 'MOCKUP' : 'SVG'),
        image_front: image_front || null,
        image_back: image_back || null,
        flocking_config: flocking_config || (template_type === 'MOCKUP' ? {
          name: { x_percent: 50, y_percent: 28, font_family: 'Impact', font_size: 28, default_color: '#ffffff', letter_spacing: 4 },
          number: { x_percent: 50, y_percent: 55, font_family: 'Impact', font_size: 110, default_color: '#ffffff' },
          allowed_colors: ['#ffffff', '#111111', '#ffd700', '#e63946', '#1d3557']
        } : null),
        svg_content: frontContent,
        svg_front: frontContent,
        svg_back: svg_back || null,
        badge_url: badge_url || null,
        badge_svg: badge_svg || null,
        editable_elements: editable_elements || {
          body: template_type !== 'MOCKUP',
          collar: template_type !== 'MOCKUP',
          sleeves: template_type !== 'MOCKUP',
          stripes: template_type !== 'MOCKUP',
          badge: true,
          name_zone: true,
          number_zone: true
        },
        layers_config: layers_config || {
          body_id: 'jersey-body',
          collar_id: 'jersey-collar',
          sleeves_id: 'jersey-sleeves',
          stripes_id: 'jersey-stripes',
          badge_zone_id: 'badge-zone',
          name_zone_id: 'name-zone',
          number_zone_id: 'number-zone'
        },
        thumbnail_url: thumbnail_url || image_front || null,
        visibility: visibility || 'PUBLIC',
        is_free: is_free !== undefined ? is_free : true,
        price: price || 0.00
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Template créé avec succès',
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Mettre à jour un template (et incrémenter usage_count)
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.svg_front && !updates.svg_content) {
      updates.svg_content = updates.svg_front;
    }

    const { data, error } = await supabaseAdmin
      .from('templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Template mis à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Supprimer un template (Soft delete)
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('templates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Template placé dans la corbeille', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
