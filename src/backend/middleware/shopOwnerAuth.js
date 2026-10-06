const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET || 'jogalook_dev_secret';

module.exports = async function shopOwnerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Connexion requise.' });
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    const userId = decoded.user_id || decoded.id || decoded.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Session invalide.' });

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone, role, status')
      .eq('id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (userError || !user || user.role !== 'SHOP_OWNER' || user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux comptes boutiquier actifs.' });
    }

    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (shopError) throw shopError;
    if (!shop) return res.status(403).json({ success: false, message: 'Aucune boutique n’est associée à ce compte.' });

    req.merchant = { user, shop };
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expirée. Veuillez vous reconnecter.' });
    }
    console.error('[shopOwnerAuth]', error);
    return res.status(500).json({ success: false, message: 'Impossible de vérifier la boutique.' });
  }
};
