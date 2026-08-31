const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// VARIANTES DE PRODUITS - CONTROLLER CRUD
// ==============================================================================

exports.getAllVariants = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select('*, products (id, name, slug)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVariantsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('product_id', product_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVariantById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select('*, products ( id, name, base_price )')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Variante non trouvée' });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createVariant = async (req, res) => {
  try {
    const { product_id, sku, size, color_name, color_hex, stock_quantity, price_override } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Le produit est requis.' });
    }

    const { data: product, error: productErr } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', product_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (productErr) throw productErr;
    if (!product) {
      return res.status(400).json({ success: false, message: 'Produit introuvable.' });
    }

    const finalSku = (sku || '').trim();
    if (finalSku) {
      const { data: skuConflict } = await supabaseAdmin
        .from('product_variants')
        .select('id')
        .eq('sku', finalSku)
        .is('deleted_at', null)
        .maybeSingle();

      if (skuConflict) {
        return res.status(409).json({ success: false, message: 'Ce SKU est déjà utilisé.' });
      }
    }

    const payload = {
      product_id,
      sku: finalSku || null,
      size: size || null,
      color_name: color_name || null,
      color_hex: color_hex || null,
      stock_quantity: Number(stock_quantity ?? 0),
      price_override: price_override !== undefined && price_override !== '' ? Number(price_override) : null,
    };

    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Variante créée avec succès', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, message: 'Variante mise à jour', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, message: 'Variante supprimée (corbeille)', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body; // +5 pour ajouter, -3 pour retirer

    const { data: current, error: fetchErr } = await supabaseAdmin
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    const newQty = Math.max(0, current.stock_quantity + delta);
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, message: `Stock ajusté : ${current.stock_quantity} → ${newQty}`, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
