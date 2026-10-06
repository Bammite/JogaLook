const { supabaseAdmin } = require('../supabaseClient');
const jwt = require('jsonwebtoken');

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const cookie of cookieHeader.split(';')) {
    const [key, value] = cookie.trim().split('=');
    if (key === name && value) return decodeURIComponent(value);
  }
  return null;
}

function resolveUserId(req) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.decode(authorization.slice(7));
    return decoded?.user_id || decoded?.id || decoded?.sub || null;
  } catch (_) {
    return null;
  }
}

exports.recordSearch = async (req, res) => {
  try {
    const { search_type, query_text, source_path, results_count, metadata } = req.body || {};
    const query = String(query_text || '').trim();
    const allowedTypes = ['PRODUCT_GLOBAL', 'CATALOG', 'CATEGORY_GROUP', 'NEWS'];
    const userId = resolveUserId(req);
    const sessionId = req.headers['x-session-id'] || parseCookie(req.headers.cookie, 'jl_sid');

    if (!query) return res.status(400).json({ success: false, message: 'La recherche est vide.' });
    if (!allowedTypes.includes(search_type)) return res.status(400).json({ success: false, message: 'Type de recherche invalide.' });
    if (!userId && !sessionId) return res.status(400).json({ success: false, message: 'Session visiteur introuvable.' });

    const count = results_count === null || results_count === undefined || results_count === ''
      ? null
      : Number(results_count);
    if (count !== null && (!Number.isInteger(count) || count < 0)) {
      return res.status(400).json({ success: false, message: 'Nombre de résultats invalide.' });
    }

    const { error } = await supabaseAdmin.from('search_history').insert([{
      user_id: userId,
      session_id: sessionId || null,
      search_type,
      query_text: query.substring(0, 500),
      source_path: String(source_path || req.path).substring(0, 500),
      results_count: count,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      ip_address: String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().substring(0, 45) || null,
      user_agent: String(req.headers['user-agent'] || '').substring(0, 500) || null,
    }]);

    if (error) throw error;
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur recordSearch:', error);
    return res.status(500).json({ success: false, message: 'Impossible d’enregistrer la recherche.' });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const shopSlug = String(req.query.shop || '').trim();
    if (!query) return res.json({ success: true, query: '', count: 0, suggestions: { products: [], keywords: [] }, data: [] });

    let shopId = null;
    if (shopSlug) {
      let { data: shop, error: shopError } = await supabaseAdmin
        .from('shops').select('id').eq('slug', shopSlug).eq('is_active', true).is('deleted_at', null).maybeSingle();
      if (shopError?.code === '42703' && shopError.message?.includes('is_active')) {
        const fallback = await supabaseAdmin.from('shops').select('id').eq('slug', shopSlug).is('deleted_at', null).maybeSingle();
        shop = fallback.data;
        shopError = fallback.error;
      }
      if (shopError) throw shopError;
      if (!shop) return res.json({ success: true, query, count: 0, suggestions: { products: [], keywords: [] }, data: [] });
      shopId = shop.id;
    }

    const pattern = `%${query}%`;
    let namesQuery = supabaseAdmin
      .from('products')
      .select('*, categories(id, name, slug), product_variants(id, color_name, color_hex)')
      .ilike('name', pattern)
      .is('deleted_at', null)
      .eq('is_active', true);
    if (shopId) namesQuery = namesQuery.eq('shop_id', shopId);
    const [nameResult, keywordResult] = await Promise.all([
      namesQuery,
      supabaseAdmin
        .from('keywords')
        .select('id, word, lang')
        .ilike('word', pattern),
    ]);

    if (nameResult.error) throw nameResult.error;
    if (keywordResult.error) throw keywordResult.error;

    const nameMatches = nameResult.data || [];
    const normalizedQuery = query.toLowerCase();
    const nameProducts = nameMatches
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(normalizedQuery);
        const bStarts = b.name.toLowerCase().startsWith(normalizedQuery);
        return Number(bStarts) - Number(aStarts) || a.name.localeCompare(b.name);
      })
      .map((product) => ({
      ...product,
      match_type: 'name',
      match_score: null,
      matched_keyword: null,
    }));
    const nameIds = new Set(nameProducts.map((product) => product.id));
    let keywordProducts = [];

    if (keywordResult.data?.length) {
      const keywordIds = keywordResult.data.map((keyword) => keyword.id);
      const { data, error } = await supabaseAdmin
        .from('product_keyword_similarity')
        .select('similarity, keyword_id, keywords(id, word, lang), products(*, categories(id, name, slug), product_variants(id, color_name, color_hex))')
        .in('keyword_id', keywordIds)
        .order('similarity', { ascending: false });

      if (error) throw error;
      const keywordMatches = (data || [])
        .filter((relation) => relation.products && !relation.products.deleted_at && relation.products.is_active !== false && (!shopId || relation.products.shop_id === shopId) && !nameIds.has(relation.products.id))
        .map((relation) => ({
          ...relation.products,
          match_type: 'keyword',
          match_score: relation.similarity,
          matched_keyword: relation.keywords?.word || null,
        }));

      const bestMatches = new Map();
      keywordMatches.forEach((product) => {
        const current = bestMatches.get(product.id);
        if (!current || product.match_score > current.match_score) bestMatches.set(product.id, product);
      });
      keywordProducts = [...bestMatches.values()];
    }

    const results = [...nameProducts, ...keywordProducts];
    return res.json({
      success: true,
      query,
      count: results.length,
      suggestions: {
        products: nameMatches.slice(0, 6).map(({ id, name }) => ({ id, name })),
        keywords: (keywordResult.data || []).slice(0, 6),
      },
      data: results,
    });
  } catch (error) {
    console.error('Erreur searchProducts:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
