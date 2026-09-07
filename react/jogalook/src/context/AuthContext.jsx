import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'jogalook-token';
const USER_KEY  = 'jogalook-user';

// ── Helpers localStorage ──────────────────────────────────────────────────────
function getStored() {
  try {
    return {
      token: localStorage.getItem(TOKEN_KEY) || null,
      user:  JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
    };
  } catch {
    return { token: null, user: null };
  }
}

function persist(token, user) {
  if (token && user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

// ── API helper ────────────────────────────────────────────────────────────────
async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const stored = getStored();
  const [token, setToken]   = useState(stored.token);
  const [user, setUser]     = useState(stored.user);
  const [loading, setLoading] = useState(!!stored.token); // vrai si on doit valider le token

  // Valider le token au démarrage (GET /api/auth/me)
  useEffect(() => {
    if (!stored.token) { setLoading(false); return; }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${stored.token}` } })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.user) {
          setUser(json.user);
          setToken(stored.token);
          persist(stored.token, json.user);
        } else {
          // Token périmé
          setToken(null);
          setUser(null);
          persist(null, null);
        }
      })
      .catch(() => {
        // Réseau KO → garde les données locales
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  /** Connexion directe email + mot de passe (sans OTP) */
  const login = useCallback(async (email, password) => {
    const json = await apiPost('/api/auth/login', { email, password });
    if (!json.success || !json.token) throw new Error(json.message || 'Identifiants incorrects');

    setToken(json.token);
    setUser(json.user);
    persist(json.token, json.user);
    return json.user;
  }, []);

  /** Étape 1 d'inscription : envoi de l'OTP de validation email */
  const sendRegisterOtp = useCallback(async ({ email, password, phone }) => {
    const json = await apiPost('/api/auth/register-send-otp', { email, password, phone });
    if (!json.success) throw new Error(json.message || 'Impossible d\'envoyer le code de confirmation');
    return json;
  }, []);

  /** Renvoi de l'OTP d'inscription (ne nécessite que l'email) */
  const resendRegisterOtp = useCallback(async (email) => {
    const json = await apiPost('/api/auth/register-resend-otp', { email });
    if (!json.success) throw new Error(json.message || 'Impossible de renvoyer le code');
    return json;
  }, []);

  /** Étape 2 d'inscription : vérification de l'OTP et création du compte */
  const verifyRegisterOtp = useCallback(async ({ email, code, password, phone }) => {
    const json = await apiPost('/api/auth/register-verify-otp', { email, code, password, phone });
    if (!json.success || !json.token) throw new Error(json.message || 'Code de confirmation invalide ou expiré');

    setToken(json.token);
    setUser(json.user);
    persist(json.token, json.user);
    return json.user;
  }, []);

  /** Inscription directe / wrapper */
  const register = useCallback(async (fields) => {
    return sendRegisterOtp(fields);
  }, [sendRegisterOtp]);

  /** Connexion Google : récupération de l'URL OAuth et redirection */
  const loginWithGoogle = useCallback(async (fromPath = '/') => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const res = await fetch(`/api/auth/google/url?redirectTo=${encodeURIComponent(redirectTo)}&state=${encodeURIComponent(fromPath)}`);
    const json = await res.json();
    if (!json.success || !json.url) {
      throw new Error(json.message || "Impossible d'initialiser la connexion Google");
    }
    window.location.href = json.url;
  }, []);

  /** Callback Google : échange du code ou du token */
  const handleGoogleCallback = useCallback(async (params) => {
    const json = await apiPost('/api/auth/google/callback', params);
    if (!json.success || !json.token) {
      throw new Error(json.message || "Échec de l'authentification Google");
    }

    setToken(json.token);
    setUser(json.user);
    persist(json.token, json.user);
    return json.user;
  }, []);

  /** Déconnexion */
  const logout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    setUser(null);
    persist(null, null);
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAdmin,
      login,
      sendRegisterOtp,
      resendRegisterOtp,
      verifyRegisterOtp,
      register,
      loginWithGoogle,
      handleGoogleCallback,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
