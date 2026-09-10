const { supabaseAdmin } = require('../supabaseClient');

/**
 * Récupérer l'historique récent des visites avec pagination
 */
exports.getVisits = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = (page - 1) * limit;
    const pathFilter = req.query.path || null;

    let query = supabaseAdmin
      .from('site_visits')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (pathFilter) {
      query = query.ilike('path', `%${pathFilter}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({
      success: true,
      visits: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    console.error('Erreur getVisits:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Récupérer les statistiques globales du trafic (Total visites, Visiteurs uniques, Pages les plus vues)
 */
exports.getTrafficStats = async (req, res) => {
  try {
    // 1. Total des visites
    const { count: totalVisits, error: countErr } = await supabaseAdmin
      .from('site_visits')
      .select('id', { count: 'exact', head: true });

    if (countErr) {
      return res.status(500).json({ success: false, message: countErr.message });
    }

    // 2. Visites des 24 dernières heures
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: visits24h } = await supabaseAdmin
      .from('site_visits')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', last24h);

    // 3. Les 100 dernières visites récentes
    const { data: recentVisits } = await supabaseAdmin
      .from('site_visits')
      .select('id, path, method, ip_address, user_agent, referer, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculer les pages les plus populaires depuis les dernières visites
    const pageCounts = {};
    const ipSet = new Set();

    (recentVisits || []).forEach(v => {
      if (v.path) {
        pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
      }
      if (v.ip_address) {
        ipSet.add(v.ip_address);
      }
    });

    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.json({
      success: true,
      stats: {
        totalVisits: totalVisits || 0,
        visits24h: visits24h || 0,
        recentUniqueIPs: ipSet.size,
        topPages,
        recentVisits: (recentVisits || []).slice(0, 20)
      }
    });
  } catch (err) {
    console.error('Erreur getTrafficStats:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
