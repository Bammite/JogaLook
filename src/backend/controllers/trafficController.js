const { supabaseAdmin } = require('../supabaseClient');

/**
 * Récupérer l'historique des visites ou des sessions uniques avec pagination
 */
exports.getVisits = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = (page - 1) * limit;
    const pathFilter = req.query.path || null;
    const mode = req.query.mode || 'pageviews'; // 'pageviews' ou 'sessions'

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

    let resultVisits = data || [];

    // Mode 'sessions' : grouper par session_id / IP pour ne renvoyer qu'une seule ligne par session unique avec le nombre de pages vues
    if (mode === 'sessions') {
      const sessionMap = new Map();
      (resultVisits || []).forEach(item => {
        const key = item.session_id || item.ip_address || item.id;
        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            ...item,
            page_views_count: 1
          });
        } else {
          const existing = sessionMap.get(key);
          existing.page_views_count += 1;
        }
      });
      resultVisits = Array.from(sessionMap.values());
    }

    return res.json({
      success: true,
      mode,
      visits: resultVisits,
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
 * Récupérer les statistiques globales de trafic (Sessions uniques vs Pages vues)
 */
exports.getTrafficStats = async (req, res) => {
  try {
    // 1. Total des pages vues (tous enregistrements)
    const { count: totalPageviews, error: countErr } = await supabaseAdmin
      .from('site_visits')
      .select('id', { count: 'exact', head: true });

    if (countErr) {
      return res.status(500).json({ success: false, message: countErr.message });
    }

    // 2. Pages vues des dernières 24h
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: pageviews24h } = await supabaseAdmin
      .from('site_visits')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', last24h);

    // 3. Récupérer les 500 derniers enregistrements pour déduire les sessions uniques & stats
    const { data: recentVisits } = await supabaseAdmin
      .from('site_visits')
      .select('id, session_id, path, method, ip_address, user_agent, referer, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    const totalSessionSet = new Set();
    const session24hSet = new Set();
    const ipSet = new Set();
    const pageCounts = {};

    (recentVisits || []).forEach(v => {
      const sKey = v.session_id || v.ip_address || v.id;
      totalSessionSet.add(sKey);
      
      if (v.created_at && new Date(v.created_at) >= new Date(last24h)) {
        session24hSet.add(sKey);
      }

      if (v.ip_address) {
        ipSet.add(v.ip_address);
      }

      if (v.path) {
        pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
      }
    });

    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalSessions = totalSessionSet.size || Math.min(totalPageviews || 0, 1);
    const sessions24h = session24hSet.size;
    const pagesPerSession = totalSessions > 0 ? (totalPageviews / totalSessions).toFixed(1) : '1.0';

    return res.json({
      success: true,
      stats: {
        totalSessions,
        sessions24h,
        totalPageviews: totalPageviews || 0,
        pageviews24h: pageviews24h || 0,
        pagesPerSession,
        recentUniqueIPs: ipSet.size,
        topPages,
        recentVisits: (recentVisits || []).slice(0, 30)
      }
    });
  } catch (err) {
    console.error('Erreur getTrafficStats:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
