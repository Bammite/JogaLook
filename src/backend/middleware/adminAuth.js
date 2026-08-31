const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET || 'jogalook_dev_secret';

module.exports = async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token administrateur manquant' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, status, email, first_name, last_name')
      .eq('id', decoded.user_id)
      .single();

    if (userError || !user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role) || user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Accès administrateur refusé' });
    }

    let { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Si pas de ligne dans la table admins mais que le rôle user est ADMIN/SUPER_ADMIN, on crée l'enregistrement
    if (!admin) {
      const { data: newAdmin } = await supabaseAdmin
        .from('admins')
        .insert([{ user_id: user.id, department: 'Direction' }])
        .select('id')
        .single();
      admin = newAdmin || { id: null };
    }

    req.auth = { user, admin };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
  }
};
