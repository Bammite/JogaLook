const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../supabaseClient');
const { sendOtpEmail, isConfigured: isSmtpConfigured } = require('../services/mailService');
const { logLoginAttempt } = require('./logController');

const JWT_SECRET = process.env.JWT_SECRET || 'jogalook_dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function findUserByEmail(email) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .limit(1)
    .single();
  if (error) return { error };
  return { user: data };
}

// ==============================================================================
// POST /api/auth/register
// ==============================================================================
exports.register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit faire au moins 8 caractères' });
    }

    // Vérifier si l'email est déjà utilisé dans la table 'users'
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1)
      .single();

    if (existing) {
      return res.status(409).json({ success: false, message: 'Un compte existe déjà avec cet email' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password_hash,
        first_name: first_name?.trim() || null,
        last_name: last_name?.trim() || null,
        phone: phone?.trim() || null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      }])
      .select('id, email, first_name, last_name, role, status')
      .single();

    if (error) throw error;

    const token = generateToken({ user_id: newUser.id, email: newUser.email, role: newUser.role });

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Auth register error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// POST /api/auth/login — Étape 1 : vérification password → envoi OTP
// ==============================================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const { user, error } = await findUserByEmail(email.toLowerCase());
    if (error || !user) {
      await logLoginAttempt({ user_id: null, email_attempted: email, ip_address: req.ip, user_agent: req.get('User-Agent'), status: 'FAILURE', failure_reason: 'Compte introuvable' });
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Ce compte est désactivé' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      await logLoginAttempt({ user_id: user.id, email_attempted: email, ip_address: req.ip, user_agent: req.get('User-Agent'), status: 'FAILURE', failure_reason: 'Mot de passe incorrect' });
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    // Si SMTP pas configuré → connexion directe sans OTP (mode dev)
    if (!isSmtpConfigured) {
      const token = generateToken({ user_id: user.id, email: user.email, role: user.role });
      await logLoginAttempt({ user_id: user.id, email_attempted: email, ip_address: req.ip, user_agent: req.get('User-Agent'), status: 'SUCCESS', failure_reason: null });
      return res.json({
        success: true,
        message: 'Connexion réussie (mode sans OTP)',
        token,
        user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role },
        skipOtp: true,
      });
    }

    // Générer et stocker le code OTP dans la table PostgreSQL 'otps'
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: otpError } = await supabaseAdmin
      .from('otps')
      .insert([{
        user_id: user.id,
        recipient: email.toLowerCase(),
        code_hash: otpCode,
        purpose: 'LOGIN',
        expires_at: expiresAt,
        is_used: false,
        attempts: 0,
      }]);

    if (otpError) throw otpError;

    await sendOtpEmail({ to: email.toLowerCase(), code: otpCode, recipientName: user.first_name || user.email });
    await logLoginAttempt({ user_id: user.id, email_attempted: email, ip_address: req.ip, user_agent: req.get('User-Agent'), status: 'PENDING', failure_reason: null });

    return res.json({ success: true, message: 'Code OTP envoyé. Vérifiez votre boîte mail.', skipOtp: false });
  } catch (error) {
    console.error('Auth login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// POST /api/auth/verify-otp — Étape 2 : vérification OTP → JWT
// ==============================================================================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email et code OTP requis' });
    }

    const { data: otp, error: fetchError } = await supabaseAdmin
      .from('otps')
      .select('*')
      .eq('recipient', email.toLowerCase())
      .eq('purpose', 'LOGIN')
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otp) {
      return res.status(400).json({ success: false, message: 'Code OTP invalide ou expiré' });
    }

    if (otp.code_hash !== code) {
      await supabaseAdmin.from('otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
      await logLoginAttempt({ user_id: otp.user_id, email_attempted: email, ip_address: req.ip, user_agent: req.get('User-Agent'), status: 'FAILURE', failure_reason: 'OTP incorrect' });
      return res.status(400).json({ success: false, message: 'Code OTP incorrect' });
    }

    await supabaseAdmin.from('otps').update({ is_used: true }).eq('id', otp.id);
    await logLoginAttempt({ user_id: otp.user_id, email_attempted: email, ip_address: req.ip, user_agent: req.get('User-Agent'), status: 'SUCCESS', failure_reason: null });

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('id', otp.user_id)
      .single();

    if (userError || !user) throw new Error('Utilisateur introuvable');

    const token = generateToken({ user_id: user.id, email: user.email, role: user.role });

    return res.json({ success: true, message: 'Connexion réussie', token, user });
  } catch (error) {
    console.error('Auth verifyOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// GET /api/auth/google/url — OAuth Google 2.0 DIRECT (Indépendant de Supabase Auth)
// ==============================================================================
exports.getGoogleUrl = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'GOOGLE_CLIENT_ID non configuré dans le fichier .env'
      });
    }

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const redirectUri = req.query.redirectTo || `${origin}/auth/callback`;
    const state = req.query.state || '/';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state: state,
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return res.json({ success: true, url: googleAuthUrl });
  } catch (error) {
    console.error('Google Auth URL error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// POST /api/auth/google/callback — Validation Google 2.0 DIRECT & Synchronisation DB
// ==============================================================================
exports.handleGoogleCallback = async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Code d'autorisation Google manquant" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        message: 'GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET manquant dans le .env'
      });
    }

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const finalRedirectUri = redirectUri || `${origin}/auth/callback`;

    // 1. Échange direct avec Google pour obtenir l'access_token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: finalRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return res.status(400).json({
        success: false,
        message: tokenData.error_description || "Échec de l'échange de code d'autorisation avec Google"
      });
    }

    // 2. Récupération directe du profil utilisateur depuis Google UserInfo API
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok || !userInfo.email) {
      console.error('Google userinfo error:', userInfo);
      return res.status(400).json({
        success: false,
        message: 'Impossible de récupérer le profil utilisateur depuis Google'
      });
    }

    const email = userInfo.email.toLowerCase();
    const firstName = userInfo.given_name || userInfo.name?.split(' ')[0] || '';
    const lastName = userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '';
    const avatarUrl = userInfo.picture || null;

    // 3. Gestion dans notre table PostgreSQL 'users' (Supabase utilisé strictement comme DB)
    let { data: dbUser, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, status, avatar_url')
      .eq('email', email)
      .limit(1)
      .single();

    if (!dbUser) {
      // Création de l'utilisateur avec hash aléatoire pour respecter la contrainte NOT NULL
      const dummyPassword = await bcrypt.hash(Math.random().toString(36) + Date.now().toString(), 10);
      const { data: createdUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert([{
          email,
          password_hash: dummyPassword,
          first_name: firstName || null,
          last_name: lastName || null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          avatar_url: avatarUrl,
        }])
        .select('id, email, first_name, last_name, role, status, avatar_url')
        .single();

      if (createError) throw createError;
      dbUser = createdUser;
    } else {
      // Mise à jour de l'avatar si manquant
      if (!dbUser.avatar_url && avatarUrl) {
        await supabaseAdmin
          .from('users')
          .update({ avatar_url: avatarUrl })
          .eq('id', dbUser.id);
        dbUser.avatar_url = avatarUrl;
      }
    }

    if (dbUser.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Ce compte est suspendu ou inactif' });
    }

    await logLoginAttempt({
      user_id: dbUser.id,
      email_attempted: email,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      status: 'SUCCESS',
      failure_reason: null,
    });

    // 4. Génération de notre propre JWT d'application
    const token = generateToken({ user_id: dbUser.id, email: dbUser.email, role: dbUser.role });

    return res.json({
      success: true,
      message: 'Connexion Google réussie',
      token,
      user: dbUser,
    });
  } catch (error) {
    console.error('Google Callback Controller Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// GET /api/auth/me — Récupérer l'utilisateur connecté depuis notre JWT
// ==============================================================================
exports.me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, phone, status, avatar_url')
      .eq('id', decoded.user_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// POST /api/auth/logout — Invalider côté client (stateless JWT)
// ==============================================================================
exports.logout = async (req, res) => {
  return res.json({ success: true, message: 'Déconnexion réussie' });
};
