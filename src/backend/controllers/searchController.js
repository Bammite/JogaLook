const { supabaseAdmin } = require('../supabaseClient');

exports.searchProducts = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.json({ success: true, query: '', count: 0, suggestions: { products: [], keywords: [] }, data: [] });

    const pattern = `%${query}%`;
    const [nameResult, keywordResult] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('*, categories(id, name, slug), product_variants(id, color_name, color_hex)')
        .ilike('name', pattern)
        .is('deleted_at', null)
        .eq('is_active', true),
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
        .filter((relation) => relation.products && !relation.products.deleted_at && relation.products.is_active !== false && !nameIds.has(relation.products.id))
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
