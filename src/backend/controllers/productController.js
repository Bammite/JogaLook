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
        categories!category_id ( id, name, slug ),
        shops ( id, name, logo_url ),
        product_variants ( id, size, color_name, color_hex, stock_quantity, price_override ),
        product_images ( id, url, alt_text, position, is_primary )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (category_id) query = query.eq('category_id', category_id);
    if (shop_id) query = query.eq('shop_id', shop_id);

    let { data, error } = await query;

    // Fallback si PostgREST n'a pas encore mis en cache la relation explicite
    if (error && (error.message?.includes('schema cache') || error.code === 'PGRST200')) {
      console.warn('Fallback getAllProducts: relation automatique non trouvée, exécution avec relations manuelles:', error.message);
      
      let fallbackQuery = supabaseAdmin
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (category_id) fallbackQuery = fallbackQuery.eq('category_id', category_id);
      if (shop_id) fallbackQuery = fallbackQuery.eq('shop_id', shop_id);

      const fallbackRes = await fallbackQuery;
      if (fallbackRes.error) throw fallbackRes.error;
      const products = fallbackRes.data || [];

      if (products.length > 0) {
        const productIds = products.map(p => p.id);
        const categoryIds = Array.from(new Set(products.map(p => p.category_id).filter(Boolean)));

        const [catRes, varRes, imgRes] = await Promise.all([
          categoryIds.length ? supabaseAdmin.from('categories').select('id, name, slug').in('id', categoryIds) : { data: [] },
          supabaseAdmin.from('product_variants').select('id, product_id, size, color_name, color_hex, stock_quantity, price_override').in('product_id', productIds),
          supabaseAdmin.from('product_images').select('id, product_id, url, alt_text, position, is_primary').in('product_id', productIds),
        ]);

        const catMap = new Map((catRes.data || []).map(c => [c.id, c]));
        const varMap = new Map();
        (varRes.data || []).forEach(v => {
          if (!varMap.has(v.product_id)) varMap.set(v.product_id, []);
          varMap.get(v.product_id).push(v);
        });

        const imgMap = new Map();
        (imgRes.data || []).forEach(img => {
          if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, []);
          imgMap.get(img.product_id).push(img);
        });

        data = products.map(p => ({
          ...p,
          categories: catMap.get(p.category_id) || null,
          product_variants: varMap.get(p.id) || [],
          product_images: (imgMap.get(p.id) || []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
        }));
      } else {
        data = [];
      }
      error = null;
    }

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

    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        categories!category_id ( id, name, slug ),
        shops ( id, name, logo_url ),
        product_variants ( id, sku, size, color_name, color_hex, stock_quantity, price_override ),
        product_images ( id, url, alt_text, position, is_primary )
      `)
      .or(`id.eq.${id},slug.eq.${id}`)
      .is('deleted_at', null)
      .single();

    let { data, error } = await query;

    // Fallback manuel si erreur de relation dans le cache
    if (error && (error.message?.includes('schema cache') || error.code === 'PGRST200')) {
      console.warn('Fallback getProductById: relation automatique non trouvée, exécution manuelle:', error.message);
      
      const singleRes = await supabaseAdmin
        .from('products')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
        .is('deleted_at', null)
        .maybeSingle();

      if (singleRes.error || !singleRes.data) {
        return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      }

      const product = singleRes.data;
      const [catRes, varRes, imgRes, shopRes] = await Promise.all([
        product.category_id ? supabaseAdmin.from('categories').select('id, name, slug').eq('id', product.category_id).maybeSingle() : { data: null },
        supabaseAdmin.from('product_variants').select('id, sku, size, color_name, color_hex, stock_quantity, price_override').eq('product_id', product.id),
        supabaseAdmin.from('product_images').select('id, url, alt_text, position, is_primary').eq('product_id', product.id).order('position', { ascending: true }),
        product.shop_id ? supabaseAdmin.from('shops').select('id, name, logo_url').eq('id', product.shop_id).maybeSingle() : { data: null },
      ]);

      data = {
        ...product,
        categories: catRes.data || null,
        product_variants: varRes.data || [],
        product_images: imgRes.data || [],
        shops: shopRes.data || null,
      };
      error = null;
    }

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
    const { name, slug, description, base_price, category_id, shop_id, supplier_id, image_url, images, template_id, is_customizable, is_active, variants } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Le champ "name" est requis.' });
    }

    if (!category_id) {
      return res.status(400).json({ success: false, message: 'La catégorie du produit est requise.' });
    }

    // Déterminer l'image principale et la liste des images
    let primaryImageUrl = (image_url || '').trim();
    const imagesList = Array.isArray(images) && images.length > 0
      ? images
      : (primaryImageUrl ? [{ url: primaryImageUrl, is_primary: true, position: 0 }] : []);

    if (imagesList.length > 0) {
      const primaryObj = imagesList.find(img => typeof img === 'object' && img.is_primary);
      if (primaryObj && primaryObj.url) {
        primaryImageUrl = primaryObj.url;
      } else if (typeof imagesList[0] === 'string') {
        primaryImageUrl = imagesList[0];
      } else if (imagesList[0]?.url) {
        primaryImageUrl = imagesList[0].url;
      }
    }

    if (!primaryImageUrl) {
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
        image_url: primaryImageUrl,
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

    // Insertion dans product_images
    if (imagesList.length > 0) {
      const imagesToInsert = imagesList.map((img, idx) => {
        const url = typeof img === 'string' ? img : img.url;
        const isPrimary = typeof img === 'object' && img.is_primary !== undefined
          ? Boolean(img.is_primary)
          : (url === primaryImageUrl || idx === 0);
        return {
          product_id: product.id,
          url: url,
          alt_text: (typeof img === 'object' ? img.alt_text : null) || `${product.name} - Vue ${idx + 1}`,
          position: (typeof img === 'object' && img.position !== undefined) ? Number(img.position) : idx,
          is_primary: isPrimary
        };
      });

      try {
        await supabaseAdmin.from('product_images').insert(imagesToInsert);
      } catch (imgErr) {
        console.error('Erreur insertion product_images:', imgErr);
      }
    }

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
    console.error('Erreur createProduct:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      base_price,
      category_id,
      shop_id,
      supplier_id,
      image_url,
      template_id,
      is_customizable,
      is_active,
      images,
      variants,
    } = req.body;

    // Déterminer l'image principale
    let primaryImageUrl = (image_url || '').trim();
    if (Array.isArray(images) && images.length > 0) {
      const primaryObj = images.find(img => typeof img === 'object' && img.is_primary);
      if (primaryObj && primaryObj.url) {
        primaryImageUrl = primaryObj.url;
      } else if (typeof images[0] === 'string') {
        primaryImageUrl = images[0];
      } else if (images[0]?.url) {
        primaryImageUrl = images[0].url;
      }
    }

    // Synchroniser la table product_images si images fourni
    if (Array.isArray(images)) {
      try {
        await supabaseAdmin.from('product_images').delete().eq('product_id', id);
        if (images.length > 0) {
          const imagesToInsert = images.map((img, idx) => {
            const url = typeof img === 'string' ? img : img.url;
            const isPrimary = typeof img === 'object' && img.is_primary !== undefined
              ? Boolean(img.is_primary)
              : (url === primaryImageUrl || idx === 0);
            return {
              product_id: id,
              url: url,
              alt_text: (typeof img === 'object' ? img.alt_text : null) || `Vue ${idx + 1}`,
              position: (typeof img === 'object' && img.position !== undefined) ? Number(img.position) : idx,
              is_primary: isPrimary
            };
          });
          await supabaseAdmin.from('product_images').insert(imagesToInsert);
        }
      } catch (imgErr) {
        console.error('Erreur synchronisation product_images:', imgErr);
      }
    }

    // Synchroniser les variantes si un tableau est fourni
    if (Array.isArray(variants)) {
      try {
        // Soft-delete toutes les variantes existantes pour ce produit
        await supabaseAdmin
          .from('product_variants')
          .update({ deleted_at: new Date().toISOString() })
          .eq('product_id', id)
          .is('deleted_at', null);

        // Insérer les nouvelles variantes
        if (variants.length > 0) {
          const variantsToInsert = variants.map(v => ({
            product_id: id,
            size: v.size || null,
            color_name: v.color_name || null,
            color_hex: v.color_hex || null,
            stock_quantity: Number(v.stock_quantity) || 0,
            price_override: v.price_override != null && v.price_override !== '' ? Number(v.price_override) : null,
          }));
          await supabaseAdmin.from('product_variants').insert(variantsToInsert);
        }
      } catch (varErr) {
        console.error('Erreur synchronisation product_variants:', varErr);
      }
    }

    // Construire uniquement les colonnes réelles de la table products (sans relations virtuelles categories, shops, etc.)
    const cleanUpdates = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) cleanUpdates.name = String(name).trim();
    if (slug !== undefined) cleanUpdates.slug = String(slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (description !== undefined) cleanUpdates.description = description || null;
    if (base_price !== undefined) cleanUpdates.base_price = Number(base_price);
    if (category_id !== undefined) cleanUpdates.category_id = category_id;
    if (shop_id !== undefined) cleanUpdates.shop_id = shop_id || null;
    if (supplier_id !== undefined) cleanUpdates.supplier_id = supplier_id || null;
    if (is_customizable !== undefined) {
      cleanUpdates.is_customizable = Boolean(is_customizable);
      cleanUpdates.template_id = Boolean(is_customizable) ? (template_id || null) : null;
    } else if (template_id !== undefined) {
      cleanUpdates.template_id = template_id || null;
    }
    if (is_active !== undefined) cleanUpdates.is_active = Boolean(is_active);
    if (primaryImageUrl) cleanUpdates.image_url = primaryImageUrl;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(cleanUpdates)
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
    console.error('Erreur updateProduct:', error);
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
