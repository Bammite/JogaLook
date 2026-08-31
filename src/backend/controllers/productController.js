const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// PRODUITS & VARIANTES - CONTROLLER CRUD
// ==============================================================================

// 1. Lister tous les produits (avec filtrage optionnel par catégorie/boutique)
exports.getAllProducts = async (req, res) => {
  try {
    const { category_id, shop_id, limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        categories ( id, name, slug ),
        shops ( id, name, logo_url ),
        product_variants ( id, size, color_name, color_hex, stock_quantity, price_override )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (category_id) query = query.eq('category_id', category_id);
    if (shop_id) query = query.eq('shop_id', shop_id);

    const { data, error, count } = await query;

    if (error) throw error;

    return res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Erreur getAllProducts:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Obtenir un produit par son ID ou son Slug
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories ( id, name, slug ),
        shops ( id, name, logo_url ),
        product_variants ( id, sku, size, color_name, color_hex, stock_quantity, price_override )
      `)
      .or(`id.eq.${id},slug.eq.${id}`)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Créer un nouveau produit
exports.createProduct = async (req, res) => {
  try {
    const { name, slug, description, base_price, category_id, shop_id, supplier_id, image_url, template_id, is_customizable, is_active, variants } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Le champ "name" est requis.' });
    }

    if (!category_id) {
      return res.status(400).json({ success: false, message: 'La catégorie du produit est requise.' });
    }

    if (!image_url || typeof image_url !== 'string' || !image_url.trim()) {
      return res.status(400).json({ success: false, message: 'Une image est requise pour chaque produit.' });
    }

    if (base_price === undefined || base_price === null || Number(base_price) <= 0) {
      return res.status(400).json({ success: false, message: 'Le prix de base doit être supérieur à 0.' });
    }

    if (Boolean(is_customizable) && !template_id) {
      return res.status(400).json({ success: false, message: 'Un produit personnalisable doit être lié à un template.' });
    }

    const normalizedSlug = (slug || name).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'produit';

    const { data: existing, error: slugError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', normalizedSlug)
      .is('deleted_at', null)
      .maybeSingle();

    if (slugError) throw slugError;
    if (existing) {
      return res.status(409).json({ success: false, message: 'Ce slug est déjà utilisé pour un autre produit.' });
    }

    // Insertion du produit principal
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert([{
        name: name.trim(),
        slug: normalizedSlug,
        description: description || null,
        base_price: Number(base_price),
        image_url: image_url.trim(),
        category_id,
        template_id: Boolean(is_customizable) ? template_id : null,
        shop_id: shop_id || null,
        supplier_id: supplier_id || null,
        is_customizable: Boolean(is_customizable),
        is_active: is_active !== false,
      }])
      .select()
      .single();

    if (productError) throw productError;

    // Insertion des variantes si fournies
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantsToInsert = variants.map(v => ({
        product_id: product.id,
        size: v.size,
        color_name: v.color_name,
        color_hex: v.color_hex,
        stock_quantity: v.stock_quantity || 0,
        price_override: v.price_override || null
      }));

      await supabaseAdmin.from('product_variants').insert(variantsToInsert);
    }

    return res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: product
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Supprimer un produit (Soft Delete vers la corbeille)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Produit déplacé vers la corbeille',
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
