const { supabaseAdmin } = require('../supabaseClient');

function sanitizeHtml(html = '') {
  return String(html)
    .replace(/<\/?(?:script|style|iframe|object|embed|form|input|button)[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:href|src)\s*=\s*["']\s*javascript:[^"']*["']/gi, '')
    .trim();
}

const articleSelect = `
  *,
  sports_news_categories ( id, name, slug )
`;

function normalizeArticlePayload(body) {
  const title = body.title?.trim();
  const slug = body.slug?.trim().toLowerCase();
  const content = sanitizeHtml(body.content);
  const status = body.status || 'DRAFT';

  if (!title) {
    return { error: 'Le titre de l’article est obligatoire.' };
  }
  if (!slug) {
    return { error: 'Le slug de l’article est obligatoire.' };
  }
  if (!content || !content.replace(/<[^>]*>/g, '').trim()) {
    return { error: 'Le contenu de l’article ne peut pas être vide.' };
  }

  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    return { error: 'Statut d’article invalide.' };
  }

  return {
    value: {
      title,
      slug,
      excerpt: body.excerpt?.trim() || null,
      content,
      cover_image_url: body.cover_image_url?.trim() || null,
      category_id: body.category_id || null,
      status,
      is_featured: Boolean(body.is_featured),
      published_at: status === 'PUBLISHED' ? (body.published_at || new Date().toISOString()) : null,
      seo_title: body.seo_title?.trim() || null,
      seo_description: body.seo_description?.trim() || null,
    },
  };
}

// 1. Lister tous les articles sportifs
exports.getArticles = async (req, res) => {
  try {
    const { status, category_id, search } = req.query;

    let query = supabaseAdmin
      .from('sports_articles')
      .select(articleSelect)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (category_id) query = query.eq('category_id', category_id);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        return res.status(503).json({
          success: false,
          tableMissing: true,
          message: 'La table "sports_articles" n’existe pas encore dans la base de données. Veuillez exécuter le fichier sports_news.sql dans Supabase SQL Editor.',
        });
      }
      throw error;
    }

    return res.json({ success: true, count: data?.length || 0, data: data || [] });
  } catch (error) {
    console.error('❌ [getArticles]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Obtenir un article par ID ou par slug
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabaseAdmin
      .from('sports_articles')
      .select(articleSelect)
      .is('deleted_at', null);

    // ID UUID ou slug
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Article introuvable.' });
    }

    // Incrémentation silencieuse du compteur de vues
    supabaseAdmin
      .from('sports_articles')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', data.id)
      .then(() => {})
      .catch(() => {});

    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ [getArticleById]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Lister les catégories d'actualités
exports.getCategories = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sports_news_categories')
      .select('*')
      .is('deleted_at', null)
      .order('name');

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        return res.status(503).json({
          success: false,
          tableMissing: true,
          message: 'La table "sports_news_categories" n’existe pas encore. Veuillez exécuter le script sports_news.sql dans Supabase.',
          data: [],
        });
      }
      throw error;
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('❌ [getCategories]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Créer un nouvel article
exports.createArticle = async (req, res) => {
  try {
    const { value, error: validationError } = normalizeArticlePayload(req.body);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const author_id = req.auth?.admin?.id || null;

    const { data, error } = await supabaseAdmin
      .from('sports_articles')
      .insert([{ ...value, author_id }])
      .select(articleSelect)
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: 'Un article avec ce slug existe déjà.' });
      }
      throw error;
    }

    return res.status(201).json({ success: true, message: 'Article créé avec succès.', data });
  } catch (error) {
    console.error('❌ [createArticle]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Mettre à jour un article
exports.updateArticle = async (req, res) => {
  try {
    const { value, error: validationError } = normalizeArticlePayload(req.body);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const { data, error } = await supabaseAdmin
      .from('sports_articles')
      .update({ ...value, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .is('deleted_at', null)
      .select(articleSelect)
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: 'Un autre article utilise déjà ce slug.' });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ success: false, message: 'Article introuvable ou déjà supprimé.' });
    }

    return res.json({ success: true, message: 'Article mis à jour avec succès.', data });
  } catch (error) {
    console.error('❌ [updateArticle]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Supprimer un article (soft delete)
exports.deleteArticle = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sports_articles')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .is('deleted_at', null)
      .select('id, title')
      .single();

    if (error) throw error;

    return res.json({ success: true, message: `Article « ${data.title} » supprimé avec succès.`, data });
  } catch (error) {
    console.error('❌ [deleteArticle]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
