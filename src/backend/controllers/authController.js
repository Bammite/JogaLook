const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../supabaseClient');
const { sendOtpEmail, sendRegistrationOtpEmail, isConfigured: isSmtpConfigured } = require('../services/mailService');
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
// POST /api/auth/register-send-otp — Étape 1 : validation préliminaire & envoi OTP
// ==============================================================================
exports.registerSendOtp = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Format d\'adresse email invalide' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit faire au moins 8 caractères' });
    }

    // Vérifier si un compte ACTIF existe déjà avec cet email
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, status')
      .eq('email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (existingUser && existingUser.status === 'ACTIVE') {
      return res.status(409).json({ success: false, message: 'Un compte actif existe déjà avec cette adresse email. Veuillez vous connecter.' });
    }

    // Générer code OTP à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Invalider les anciens codes d'inscription pour cet email
    await supabaseAdmin
      .from('otps')
      .update({ is_used: true })
      .eq('recipient', cleanEmail)
      .eq('purpose', 'REGISTRATION')
      .eq('is_used', false);

    // Enregistrer le nouvel OTP
    const { error: otpError } = await supabaseAdmin
      .from('otps')
      .insert([{
        user_id: existingUser?.id || null,
        recipient: cleanEmail,
        code_hash: otpCode,
        purpose: 'REGISTRATION',
        expires_at: expiresAt,
        is_used: false,
        attempts: 0,
      }]);

    if (otpError) throw otpError;

    // Envoi de l'email minimaliste
    await sendRegistrationOtpEmail({ to: cleanEmail, code: otpCode });

    return res.json({
      success: true,
      message: 'Code de confirmation envoyé à votre adresse email',
      debug_code: !isSmtpConfigured ? otpCode : undefined
    });
  } catch (error) {
    console.error('Auth registerSendOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// POST /api/auth/register-resend-otp — Renvoyer un nouveau code OTP d'inscription
// ==============================================================================
exports.registerResendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Adresse email requise' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Vérifier si le compte est déjà actif
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, status')
      .eq('email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (existingUser && existingUser.status === 'ACTIVE') {
      return res.status(409).json({ success: false, message: 'Ce compte est déjà actif. Veuillez vous connecter.' });
    }

    // Invalider les anciens codes d'inscription pour cet email
    await supabaseAdmin
      .from('otps')
      .update({ is_used: true })
      .eq('recipient', cleanEmail)
      .eq('purpose', 'REGISTRATION')
      .eq('is_used', false);

    // Générer code OTP à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Enregistrer le nouvel OTP
    const { error: otpError } = await supabaseAdmin
      .from('otps')
      .insert([{
        user_id: existingUser?.id || null,
        recipient: cleanEmail,
        code_hash: otpCode,
        purpose: 'REGISTRATION',
        expires_at: expiresAt,
        is_used: false,
        attempts: 0,
      }]);

    if (otpError) throw otpError;

    // Envoi de l'email
    await sendRegistrationOtpEmail({ to: cleanEmail, code: otpCode });

    return res.json({
      success: true,
      message: 'Nouveau code envoyé avec succès',
      debug_code: !isSmtpConfigured ? otpCode : undefined
    });
  } catch (error) {
    console.error('Auth registerResendOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// POST /api/auth/register-verify-otp — Étape 2 : vérification OTP & création du compte
// ==============================================================================
exports.registerVerifyOtp = async (req, res) => {
  try {
    const { email, code, password, phone } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ success: false, message: 'Email, code de confirmation et mot de passe requis' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();

    // Vérifier l'OTP
    const { data: otp, error: fetchError } = await supabaseAdmin
      .from('otps')
      .select('*')
      .eq('recipient', cleanEmail)
      .eq('purpose', 'REGISTRATION')
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !otp) {
      return res.status(400).json({ success: false, message: 'Code de confirmation invalide ou expiré' });
    }

    if (otp.code_hash !== cleanCode) {
      await supabaseAdmin.from('otps').update({ attempts: (otp.attempts || 0) + 1 }).eq('id', otp.id);
      return res.status(400).json({ success: false, message: 'Code de confirmation incorrect' });
    }

    // Marquer l'OTP comme utilisé
    await supabaseAdmin.from('otps').update({ is_used: true }).eq('id', otp.id);

    const password_hash = await bcrypt.hash(password, 12);

    // Vérifier si un compte existe déjà dans la table users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, status, role')
      .eq('email', cleanEmail)
      .limit(1)
      .maybeSingle();

    let userRecord;

    if (existingUser) {
      // Si le compte existait (par exemple d'une tentative précédente ou pending), on le met à jour et on l'active
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          password_hash,
          phone: phone?.trim() || null,
          status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select('id, email, first_name, last_name, role, status')
        .single();

      if (updateError) throw updateError;
      userRecord = updatedUser;
    } else {
      // Création du nouvel utilisateur
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert([{
          email: cleanEmail,
          password_hash,
          first_name: null,
          last_name: null,
          phone: phone?.trim() || null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
        }])
        .select('id, email, first_name, last_name, role, status')
        .single();

      if (insertError) throw insertError;
      userRecord = newUser;
    }

    const token = generateToken({ user_id: userRecord.id, email: userRecord.email, role: userRecord.role });

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: userRecord,
    });
  } catch (error) {
    console.error('Auth registerVerifyOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// POST /api/auth/register (Rétrocompatibilité directe si besoin)
// ==============================================================================
exports.register = async (req, res) => {
  return exports.registerSendOtp(req, res);
};

// ==============================================================================
// POST /api/auth/login — Connexion DIRECTE email + mot de passe (sans OTP)
// ==============================================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const { user, error } = await findUserByEmail(cleanEmail);
    if (error || !user) {
      await logLoginAttempt({ user_id: null, email_attempted: cleanEmail, ip_address: req.ip, user_agent: req.get('User-Agent'), status: 'FAILURE', failure_reason: 'Compte introuvable' });
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Ce compte est désactivé' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      await logLoginAttempt({ user_id: user.id, email_attempted: cleanEmail, ip_address: req.ip, user_agent: req.get('User-Agent'), status: 'FAILURE', failure_reason: 'Mot de passe incorrect' });
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    const token = generateToken({ user_id: user.id, email: user.email, role: user.role });
    await logLoginAttempt({ user_id: user.id, email_attempted: cleanEmail, ip_address: req.ip, user_agent: req.get('User-Agent'), status: 'SUCCESS', failure_reason: null });

    return res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role },
    });
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
