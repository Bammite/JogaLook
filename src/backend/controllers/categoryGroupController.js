const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// GROUPES DE CATÉGORIES - CONTROLLER CRUD
// ==============================================================================

// Groupes par défaut pour initialisation automatique / fallback
const DEFAULT_GROUPS = [
  { name: 'Vêtements', slug: 'vetements', description: 'Tous les vêtements, tenues et accessoires de mode.', display_order: 1 },
  { name: 'Sport', slug: 'sport', description: 'Équipements, tenues et articles de sport.', display_order: 2 },
  { name: 'Électronique', slug: 'electronique', description: 'Gadgets, montres connectées et accessoires électroniques.', display_order: 3 },
];

// Helper : Vérifier et auto-insérer les 3 groupes par défaut si la table est vide
const ensureDefaultGroups = async () => {
  try {
    const { count, error } = await supabaseAdmin
      .from('category_groups')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (!error && count === 0) {
      await supabaseAdmin.from('category_groups').upsert(DEFAULT_GROUPS, { onConflict: 'slug' });
    }
  } catch (err) {
    // Silencieux si la table n'existe pas encore
  }
};

// 1. Lister tous les groupes avec leurs catégories associées
exports.getAllGroups = async (req, res) => {
  try {
    await ensureDefaultGroups();

    // Récupérer tous les groupes actifs
    const { data: groups, error: groupsErr } = await supabaseAdmin
      .from('category_groups')
      .select('*')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (groupsErr) {
      // Si la table n'a pas encore été créée dans Supabase, renvoyer les groupes par défaut
      if (groupsErr.message?.includes('category_groups') || groupsErr.code === '42P01') {
        return res.json({
          success: true,
          count: DEFAULT_GROUPS.length,
          data: DEFAULT_GROUPS.map((g, idx) => ({ ...g, id: `default-${idx}`, categories: [] })),
          warning: 'Table category_groups non encore créée dans la base de données. Exécutez category_groups.sql.'
        });
      }
      throw groupsErr;
    }

    if (!groups || groups.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const groupIds = groups.map(g => g.id);

    // Récupérer les liaisons avec les catégories
    let groupItems = [];
    try {
      const { data: items, error: itemsErr } = await supabaseAdmin
        .from('category_group_items')
        .select(`
          group_id,
          position,
          categories:category_id (
            id,
            name,
            slug,
            description,
            image_url
          )
        `)
        .in('group_id', groupIds)
        .order('position', { ascending: true });

      if (!itemsErr && items) {
        groupItems = items;
      }
    } catch (e) {
      console.warn('Erreur récupération category_group_items:', e.message);
    }

    // Regrouper les catégories par group_id
    const categoryMap = new Map();
    groupItems.forEach(item => {
      if (!categoryMap.has(item.group_id)) categoryMap.set(item.group_id, []);
      if (item.categories) {
        categoryMap.get(item.group_id).push(item.categories);
      }
    });

    const enrichedGroups = groups.map(g => ({
      ...g,
      categories: categoryMap.get(g.id) || []
    }));

    return res.json({
      success: true,
      count: enrichedGroups.length,
      data: enrichedGroups
    });
  } catch (error) {
    console.error('Erreur getAllGroups:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Obtenir un groupe par ID ou Slug (avec ses catégories et éventuellement ses produits)
exports.getGroupByIdOrSlug = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_products } = req.query;

    let query = supabaseAdmin
      .from('category_groups')
      .select('*')
      .is('deleted_at', null);

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    let { data: group, error: groupErr } = await query.maybeSingle();

    if (groupErr) {
      if (groupErr.message?.includes('category_groups') || groupErr.code === '42P01') {
        const fallback = DEFAULT_GROUPS.find(g => g.slug === id || g.name.toLowerCase() === id.toLowerCase());
        if (fallback) {
          return res.json({
            success: true,
            data: { ...fallback, id: `default-${fallback.slug}`, categories: [], products: [] }
          });
        }
      }
      throw groupErr;
    }

    if (!group) {
      const fallback = DEFAULT_GROUPS.find(g => g.slug === id || g.name.toLowerCase() === id.toLowerCase());
      if (fallback) {
        return res.json({
          success: true,
          data: { ...fallback, id: `default-${fallback.slug}`, categories: [], products: [] }
        });
      }
      return res.status(404).json({ success: false, message: 'Groupe de catégories introuvable' });
    }

    // Récupérer les catégories liées
    let categories = [];
    try {
      const { data: items, error: itemsErr } = await supabaseAdmin
        .from('category_group_items')
        .select(`
          position,
          categories:category_id (
            id,
            name,
            slug,
            description,
            image_url
          )
        `)
        .eq('group_id', group.id)
        .order('position', { ascending: true });

      if (!itemsErr && items) {
        categories = items.map(item => item.categories).filter(Boolean);
      }
    } catch (e) {
      console.warn('Erreur category_group_items:', e.message);
    }

    const categoryIds = categories.map(c => c.id);

    let products = [];
    if (include_products === 'true' && categoryIds.length > 0) {
      const { data: prods, error: prodsErr } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          categories!category_id ( id, name, slug ),
          product_variants ( id, size, color_name, color_hex, stock_quantity, price_override ),
          product_images ( id, url, alt_text, position, is_primary )
        `)
        .in('category_id', categoryIds)
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('display_order', { ascending: false, nullsFirst: false })
        .order('base_price', { ascending: true })
        .order('created_at', { ascending: false });

      if (!prodsErr && prods) {
        products = prods;
      } else if (prodsErr) {
        // Fallback sans exclamation mark
        const { data: prods2 } = await supabaseAdmin
          .from('products')
          .select(`
            *,
            categories:category_id ( id, name, slug ),
            product_variants ( id, size, color_name, color_hex, stock_quantity, price_override ),
            product_images ( id, url, alt_text, position, is_primary )
          `)
          .in('category_id', categoryIds)
          .is('deleted_at', null)
          .eq('is_active', true);
        if (prods2) products = prods2;
      }

      // Tri en mémoire par score puis prix puis date
      products = [...products].sort((a, b) => {
        const scoreA = a.display_order != null && a.display_order !== '' ? Number(a.display_order) : 0;
        const scoreB = b.display_order != null && b.display_order !== '' ? Number(b.display_order) : 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        const priceA = a.base_price != null && a.base_price !== '' ? Number(a.base_price) : Number.POSITIVE_INFINITY;
        const priceB = b.base_price != null && b.base_price !== '' ? Number(b.base_price) : Number.POSITIVE_INFINITY;
        if (priceA !== priceB) return priceA - priceB;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    }

    return res.json({
      success: true,
      data: {
        ...group,
        categories,
        products: include_products === 'true' ? products : undefined
      }
    });
  } catch (error) {
    console.error('Erreur getGroupByIdOrSlug:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Créer un nouveau groupe de catégories
exports.createGroup = async (req, res) => {
  try {
    const { name, slug, description, icon, display_order, category_ids = [] } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom du groupe est requis.' });
    }

    const normalizedName = name.trim();
    const normalizedSlug = (slug || normalizedName)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'groupe';

    // Insérer le groupe
    const { data: newGroup, error: insertErr } = await supabaseAdmin
      .from('category_groups')
      .insert({
        name: normalizedName,
        slug: normalizedSlug,
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        display_order: display_order !== '' && display_order != null ? Number(display_order) : 0,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Lier les catégories si fournies
    if (Array.isArray(category_ids) && category_ids.length > 0) {
      const itemsToInsert = category_ids.map((catId, idx) => ({
        group_id: newGroup.id,
        category_id: catId,
        position: idx + 1
      }));

      const { error: linkErr } = await supabaseAdmin
        .from('category_group_items')
        .insert(itemsToInsert);

      if (linkErr) {
        console.error('Erreur liaison catégories:', linkErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Groupe de catégories créé avec succès',
      data: newGroup
    });
  } catch (error) {
    console.error('Erreur createGroup:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Mettre à jour un groupe de catégories
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, display_order, category_ids } = req.body;

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updates.name = String(name).trim();
    if (slug !== undefined) {
      updates.slug = String(slug)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (description !== undefined) updates.description = description ? String(description).trim() : null;
    if (icon !== undefined) updates.icon = icon ? String(icon).trim() : null;
    if (display_order !== undefined) {
      updates.display_order = display_order !== '' && display_order != null ? Number(display_order) : 0;
    }

    const { data: updatedGroup, error: updateErr } = await supabaseAdmin
      .from('category_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Synchroniser les catégories associées si category_ids est fourni
    if (Array.isArray(category_ids)) {
      // Supprimer les anciennes liaisons
      await supabaseAdmin
        .from('category_group_items')
        .delete()
        .eq('group_id', id);

      // Insérer les nouvelles liaisons
      if (category_ids.length > 0) {
        const itemsToInsert = category_ids.map((catId, idx) => ({
          group_id: id,
          category_id: catId,
          position: idx + 1
        }));

        const { error: linkErr } = await supabaseAdmin
          .from('category_group_items')
          .insert(itemsToInsert);

        if (linkErr) {
          console.error('Erreur mise à jour category_group_items:', linkErr);
        }
      }
    }

    return res.json({
      success: true,
      message: 'Groupe mis à jour avec succès',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Erreur updateGroup:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Supprimer un groupe (Soft Delete)
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('category_groups')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Groupe de catégories supprimé avec succès',
      data
    });
  } catch (error) {
    console.error('Erreur deleteGroup:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
