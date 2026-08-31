import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangleIcon } from '../components/icons/AppIcons';
import './AuthPage.css';
import logoImg from '../assets/Logo.png';

/**
 * Extraction universelle et infaillible de paramètres dans l'URL
 */
function extractParam(paramName) {
  if (typeof window === 'undefined') return null;

  // 1. Depuis window.location.search (?code=...)
  try {
    const searchVal = new URLSearchParams(window.location.search).get(paramName);
    if (searchVal) return searchVal;
  } catch (e) {}

  // 2. Depuis window.location.hash (#code=... ou #/route?code=...)
  try {
    if (window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes('?')) {
        const subSearch = hash.split('?')[1];
        const hashVal = new URLSearchParams(subSearch).get(paramName);
        if (hashVal) return hashVal;
      }
      const cleanHash = hash.replace(/^[#/?]+/, '');
      const hashVal2 = new URLSearchParams(cleanHash).get(paramName);
      if (hashVal2) return hashVal2;
    }
  } catch (e) {}

  // 3. Fallback regex sur l'URL complète
  try {
    const match = window.location.href.match(new RegExp('[?&#]' + paramName + '=([^&#]*)'));
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch (e) {}

  return null;
}

export default function AuthCallbackPage() {
  const { handleGoogleCallback, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [noCode, setNoCode] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, redirection immédiate
    if (user) {
      navigate('/', { replace: true });
      return;
    }

    // Éviter la double exécution en mode React StrictMode
    if (processedRef.current) return;
    processedRef.current = true;

    async function processAuth() {
      try {
        console.log('[AuthCallback] URL actuelle:', window.location.href);

        // Vérifier les erreurs renvoyées par Google
        const errorDesc = extractParam('error_description') || extractParam('error');
        if (errorDesc) {
          if (errorDesc === 'access_denied') {
            throw new Error('Connexion annulée : vous avez refusé l\'accès Google.');
          }
          throw new Error(errorDesc);
        }

        // Récupérer le code d'autorisation et la destination de retour
        const code = extractParam('code');
        const from = extractParam('state') || extractParam('from') || '/';

        if (!code) {
          // Si aucun code n'est présent (ex: visite directe de /auth/callback ou refresh sans params)
          const storedToken = localStorage.getItem('jogalook-token');
          if (storedToken) {
            navigate('/', { replace: true });
            return;
          }
          setNoCode(true);
          return;
        }

        // Nettoyer l'URI de redirection pour l'échange de token
        const redirectUri = `${window.location.origin}/auth/callback`;
        console.log('[AuthCallback] Échange du code en cours avec redirectUri:', redirectUri);

        await handleGoogleCallback({ code, redirectUri });
        console.log('[AuthCallback] Connexion Google validée ! Redirection vers:', from);
        navigate(from, { replace: true });
      } catch (err) {
        console.error('[AuthCallback] Erreur:', err);
        setError(err.message || "Échec de l'authentification Google.");
      }
    }

    processAuth();
  }, [location, handleGoogleCallback, navigate, user]);

  return (
    <div className="auth-root">
      <div className="auth-card" style={{ textAlign: 'center', alignItems: 'center' }}>
        <Link to="/" className="auth-logo">
          <img src={logoImg} alt="JogaLook" />
        </Link>

        {error ? (
          <div>
            <div className="auth-error" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <AlertTriangleIcon size={16} /> {error}
            </div>
            <Link to="/login" className="auth-btn" style={{ textDecoration: 'none' }}>
              Retour à la page de connexion
            </Link>
          </div>
        ) : noCode ? (
          <div>
            <h2 className="auth-title" style={{ fontSize: '1.3rem' }}>Aucune session en cours</h2>
            <p className="auth-sub" style={{ marginBottom: '20px' }}>
              Pour vous connecter avec Google, veuillez cliquer sur le bouton depuis la page de connexion.
            </p>
            <Link to="/login" className="auth-btn" style={{ textDecoration: 'none' }}>
              Aller à la page de connexion
            </Link>
          </div>
        ) : (
          <div>
            <div className="auth-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px', borderColor: 'rgba(241, 90, 36, 0.2)', borderTopColor: 'var(--primary)' }} />
            <h2 className="auth-title" style={{ fontSize: '1.4rem' }}>Connexion avec Google…</h2>
            <p className="auth-sub" style={{ margin: 0 }}>Finalisation de votre session en cours.</p>
          </div>
        )}
      </div>
      <div className="auth-bg" aria-hidden="true" />
    </div>
  );
}
