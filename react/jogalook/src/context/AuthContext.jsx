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

  /** Étape 1 du login : email + password → OTP ou token direct */
  const login = useCallback(async (email, password) => {
    const json = await apiPost('/api/auth/login', { email, password });
    if (!json.success) throw new Error(json.message || 'Erreur de connexion');

    if (json.skipOtp) {
      // SMTP non configuré → token reçu directement
      setToken(json.token);
      setUser(json.user);
      persist(json.token, json.user);
      return { requireOtp: false };
    }
    return { requireOtp: true };
  }, []);

  /** Étape 2 du login : code OTP → token */
  const verifyOtp = useCallback(async (email, code) => {
    const json = await apiPost('/api/auth/verify-otp', { email, code });
    if (!json.success) throw new Error(json.message || 'OTP invalide');

    setToken(json.token);
    setUser(json.user);
    persist(json.token, json.user);
    return json.user;
  }, []);

  /** Inscription */
  const register = useCallback(async (fields) => {
    const json = await apiPost('/api/auth/register', fields);
    if (!json.success) throw new Error(json.message || "Erreur lors de l'inscription");

    setToken(json.token);
    setUser(json.user);
    persist(json.token, json.user);
    return json.user;
  }, []);

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
      verifyOtp,
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
