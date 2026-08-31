const { supabaseAdmin } = require('../supabaseClient');

const normalizeWord = (value) => value
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, ' ')
  .replace(/\s+/g, ' ');

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_keyword_similarity')
      .select('id, similarity, source, created_at, updated_at, keywords(id, word, lang), products(id, name, slug)')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getKeywords = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('keywords')
      .select('id, word, lang, usage_count')
      .order('word', { ascending: true });

    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRelation = async (req, res) => {
  try {
    const { keyword_id, word, lang = 'fr', product_id, similarity = 0, source = 'manual' } = req.body;
    const score = Number(similarity);

    if (!product_id) return res.status(400).json({ success: false, message: 'Le produit est requis.' });
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return res.status(400).json({ success: false, message: 'Le pourcentage doit être un entier entre 0 et 100.' });
    }
    if (!keyword_id && (!word || !word.trim())) {
      return res.status(400).json({ success: false, message: 'Sélectionnez ou saisissez un mot-clé.' });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products').select('id').eq('id', product_id).is('deleted_at', null).maybeSingle();
    if (productError) throw productError;
    if (!product) return res.status(400).json({ success: false, message: 'Produit introuvable.' });

    let finalKeywordId = keyword_id;
    if (!finalKeywordId) {
      const normalizedWord = normalizeWord(word);
      const normalizedLang = String(lang).trim().toLowerCase() || 'fr';
      const { data: existingKeyword, error: existingKeywordError } = await supabaseAdmin
        .from('keywords')
        .select('id')
        .eq('word', normalizedWord)
        .eq('lang', normalizedLang)
        .maybeSingle();
      if (existingKeywordError) throw existingKeywordError;

      if (existingKeyword) {
        finalKeywordId = existingKeyword.id;
      } else {
      const { data: keyword, error: keywordError } = await supabaseAdmin
        .from('keywords')
        .insert({ word: normalizedWord, lang: normalizedLang })
        .select('id')
        .single();
      if (keywordError) throw keywordError;
      finalKeywordId = keyword.id;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('product_keyword_similarity')
      .upsert({ product_id, keyword_id: finalKeywordId, similarity: score, source, updated_at: new Date().toISOString() }, { onConflict: 'product_id,keyword_id' })
      .select('id, similarity, source, created_at, updated_at, keywords(id, word, lang), products(id, name, slug)')
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Association enregistrée avec succès.', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRelation = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('product_keyword_similarity')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true, message: 'Association supprimée.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRelation = async (req, res) => {
  try {
    const { keyword_id, product_id, similarity, source = 'manual' } = req.body;
    const score = Number(similarity);

    if (!keyword_id || !product_id) {
      return res.status(400).json({ success: false, message: 'Le mot-clé et le produit sont requis.' });
    }
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return res.status(400).json({ success: false, message: 'Le pourcentage doit être un entier entre 0 et 100.' });
    }

    const { data, error } = await supabaseAdmin
      .from('product_keyword_similarity')
      .update({ keyword_id, product_id, similarity: score, source, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, similarity, source, created_at, updated_at, keywords(id, word, lang), products(id, name, slug)')
      .single();

    if (error) throw error;
    return res.json({ success: true, message: 'Association modifiée avec succès.', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
