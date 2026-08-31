import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';
import logoImg from '../../assets/Logo.png';
import { AlertTriangleIcon, CheckCircleIcon, LockIcon } from '../../components/icons/AppIcons';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user, isAdmin, login, verifyOtp, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Si l'utilisateur est déjà connecté en tant qu'admin, redirection vers le dashboard
  useEffect(() => {
    if (user && isAdmin) {
      const from = location.state?.from || '/admin';
      navigate(from, { replace: true });
    }
  }, [user, isAdmin, navigate, location]);

  // Si une erreur a été passée en state de navigation
  useEffect(() => {
    if (location.state?.error) {
      setMessage({ type: 'error', text: location.state.error });
    }
  }, [location.state]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { requireOtp } = await login(email, password);

      if (requireOtp) {
        setMessage({ type: 'success', text: 'Un code de sécurité OTP a été envoyé à votre adresse email.' });
        setStep('otp');
      } else {
        // En mode direct (skipOtp)
        // Vérifier si l'utilisateur connecté est bien admin
        const storedUser = JSON.parse(localStorage.getItem('jogalook-user') || 'null');
        const role = storedUser?.role;

        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
          logout();
          setMessage({
            type: 'error',
            text: "Accès refusé : Ce compte ne dispose pas des privilèges administrateur.",
          });
          return;
        }

        setMessage({ type: 'success', text: 'Authentification réussie. Redirection vers le tableau de bord…' });
        setTimeout(() => navigate('/admin', { replace: true }), 400);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Identifiants administrateur invalides.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const loggedUser = await verifyOtp(email, otpCode);

      if (loggedUser.role !== 'ADMIN' && loggedUser.role !== 'SUPER_ADMIN') {
        logout();
        setMessage({
          type: 'error',
          text: "Accès refusé : Ce compte ne dispose pas des privilèges administrateur.",
        });
        return;
      }

      setMessage({ type: 'success', text: 'Code validé. Redirection vers le tableau de bord…' });
      setTimeout(() => navigate('/admin', { replace: true }), 400);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Code OTP invalide ou expiré.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Header avec Logo & Badge Admin */}
        <div className="admin-login-header">
          <div className="admin-login-brand">
            <img src={logoImg} alt="JogaLook" className="admin-login-logo" />
            <span className="admin-login-badge">PORTAIL ADMIN</span>
          </div>

          <div className="admin-login-icon">
            <LockIcon />
          </div>

          <h1>Espace d'Administration</h1>
          <p>
            {step === 'credentials'
              ? 'Connectez-vous avec vos identifiants pour gérer la plateforme.'
              : `Entrez le code OTP à 6 chiffres envoyé à ${email}`}
          </p>
        </div>

        {/* Message d'alerte / feedback */}
        {message && (
          <div className={`admin-login-message admin-login-message--${message.type}`}>
            {message.type === 'error' ? (
              <AlertTriangleIcon size={16} />
            ) : (
              <CheckCircleIcon size={16} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Étape 1 : Email & Mot de passe */}
        {step === 'credentials' && (
          <form className="admin-login-form" onSubmit={handleCredentialsSubmit}>
            <label>
              <span>Email administrateur</span>
              <input
                type="email"
                placeholder="admin@jogalook.com"
                value={email}
                required
                autoComplete="email"
                autoFocus
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </label>

            <label>
              <span>Mot de passe</span>
              <div className="admin-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  required
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <button type="submit" className="admin-btn admin-btn--primary admin-login-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="admin-spinner-inline" />
                  Vérification en cours…
                </>
              ) : (
                'Accéder au panneau de gestion'
              )}
            </button>
          </form>
        )}

        {/* Étape 2 : Code OTP */}
        {step === 'otp' && (
          <form className="admin-login-form" onSubmit={handleOtpSubmit}>
            <label>
              <span>Code de vérification (OTP)</span>
              <input
                type="text"
                placeholder="Ex : 123456"
                value={otpCode}
                maxLength="6"
                required
                autoFocus
                className="admin-otp-input"
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
            </label>

            <button type="submit" className="admin-btn admin-btn--primary admin-login-submit" disabled={loading || otpCode.length < 6}>
              {loading ? (
                <>
                  <span className="admin-spinner-inline" />
                  Validation du code…
                </>
              ) : (
                'Valider et ouvrir le dashboard'
              )}
            </button>

            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={loading}
              onClick={() => {
                setStep('credentials');
                setOtpCode('');
                setMessage(null);
              }}
            >
              ← Modifier mes identifiants
            </button>
          </form>
        )}

        {/* Footer avec lien vers le site public */}
        <div className="admin-login-footer">
          <Link to="/" className="admin-login-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Retourner au site public
          </Link>
          <span className="admin-login-sec-note">
            <LockIcon size={14} /> Accès sécurisé SSL / JWT
          </span>
        </div>
      </div>
    </div>
  );
}
