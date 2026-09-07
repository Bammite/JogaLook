import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangleIcon } from '../components/icons/AppIcons';
import './AuthPage.css';
import logoImg from '../assets/Logo.png';

// ── Shared sub-components ─────────────────────────────────────────────────────
function AuthCard({ children }) {
  return (
    <div className="auth-root">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <img src={logoImg} alt="JogaLook" />
        </Link>
        {children}
      </div>
      <div className="auth-bg" aria-hidden="true" />
    </div>
  );
}

function GoogleButton({ onClick, loading, text = "Continuer avec Google" }) {
  return (
    <button
      type="button"
      className="auth-google-btn"
      onClick={onClick}
      disabled={loading}
    >
      <svg className="auth-google-icon" width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
      <span>{text}</span>
    </button>
  );
}

function AuthDivider() {
  return (
    <div className="auth-divider">
      <span>ou</span>
    </div>
  );
}

function AuthInput({ label, type = 'text', value, onChange, placeholder, required, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <div className="auth-input-wrap">
        <input
          className="auth-input"
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
        />
        {isPassword && (
          <button type="button" className="auth-eye" onClick={() => setShow(s => !s)} tabIndex={-1} aria-label="Afficher/masquer">
            {show
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
    </div>
  );
}

// ── Composant des 6 cases OTP individuelles ──────────────────────────────────
function OtpDigitBoxes({ length = 6, value, onChange, onComplete, disabled }) {
  const inputsRef = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (index, char) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    const combined = newDigits.join('');
    onChange(combined);

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const nextFocus = Math.min(pasted.length, length - 1);
    inputsRef.current[nextFocus]?.focus();
    if (pasted.length === length && onComplete) {
      onComplete(pasted);
    }
  };

  return (
    <div className="auth-otp-grid" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          className={`auth-otp-box ${digits[i] ? 'auth-otp-box--filled' : ''}`}
          value={digits[i]}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={e => e.target.select()}
          disabled={disabled}
          autoFocus={i === 0}
          aria-label={`Chiffre ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE (Connexion DIRECTE sans OTP)
// ══════════════════════════════════════════════════════════════════════════════
export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState('');

  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(from);
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <AuthCard>
      <h1 className="auth-title">Connexion</h1>
      <p className="auth-sub">Bienvenue sur JogaLook</p>

      {error && (
        <div className="auth-error" role="alert">
          <AlertTriangleIcon size={16} /> {error}
        </div>
      )}

      <GoogleButton onClick={handleGoogle} loading={googleLoading} text="Se connecter avec Google" />
      <AuthDivider />
      <form onSubmit={handleCredentials} className="auth-form" noValidate>
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.com" required autoComplete="email" />
        <AuthInput label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="••••••••" required autoComplete="current-password" />
        <button className="auth-btn" type="submit" disabled={loading || googleLoading}>
          {loading ? <><span className="auth-spinner" /> Connexion…</> : 'Se connecter'}
        </button>
      </form>

      <p className="auth-switch">
        Pas encore de compte ?{' '}
        <Link to="/register" state={{ from }}>Créer un compte</Link>
      </p>
    </AuthCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REGISTER PAGE (Inscription avec Modal de vérification OTP par Email)
// ══════════════════════════════════════════════════════════════════════════════
export function RegisterPage() {
  const { sendRegisterOtp, verifyRegisterOtp, resendRegisterOtp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── État de la modale OTP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  // Cooldown timer pour le renvoi de code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(c => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Étape 1 : validation et envoi de l'OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError('Les mots de passe ne correspondent pas');
    }
    if (form.password.length < 8) {
      return setError('Le mot de passe doit faire au moins 8 caractères');
    }

    setLoading(true);
    try {
      await sendRegisterOtp({
        email: form.email,
        password: form.password,
        phone: form.phone,
      });
      setOtp('');
      setOtpError('');
      setResendCooldown(60);
      setShowOtpModal(true);
    } catch (err) {
      setError(err.message || 'Impossible d\'envoyer le code de confirmation');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : vérification du code OTP et finalisation
  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otp;
    if (!code || code.length !== 6) {
      return setOtpError('Veuillez saisir les 6 chiffres du code');
    }

    setOtpError('');
    setVerifying(true);
    try {
      await verifyRegisterOtp({
        email: form.email,
        code,
        password: form.password,
        phone: form.phone,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setOtpError(err.message || 'Code de confirmation invalide');
    } finally {
      setVerifying(false);
    }
  };

  // Renvoi du code OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    setVerifying(true);
    try {
      await resendRegisterOtp(form.email);
      setResendCooldown(60);
      setOtp('');
    } catch (err) {
      setOtpError(err.message || 'Erreur lors du renvoi du code');
    } finally {
      setVerifying(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(from);
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <AuthCard>
        <h1 className="auth-title">Créer un compte</h1>
        <p className="auth-sub">Rejoignez la communauté JogaLook</p>

        {error && (
          <div className="auth-error" role="alert">
            <AlertTriangleIcon size={16} /> {error}
          </div>
        )}

        <GoogleButton onClick={handleGoogle} loading={googleLoading} text="S'inscrire avec Google" />
        <AuthDivider />

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <AuthInput label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.com" required autoComplete="email" />
          <AuthInput label="Téléphone (optionnel)" type="tel" value={form.phone} onChange={set('phone')} placeholder="+221 77 000 0000" autoComplete="tel" />
          <AuthInput label="Mot de passe *" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 caractères" required autoComplete="new-password" />
          <AuthInput label="Confirmer le mot de passe *" type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" required autoComplete="new-password" />

          <button className="auth-btn" type="submit" disabled={loading || googleLoading}>
            {loading ? <><span className="auth-spinner" /> Envoi du code…</> : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-switch">
          Déjà un compte ?{' '}
          <Link to="/login" state={{ from }}>Se connecter</Link>
        </p>
      </AuthCard>

      {/* ── MODAL OTP DE CONFIRMATION DE L'EMAIL ── */}
      {showOtpModal && (
        <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="otp-modal-title">
          <div className="auth-modal-card">
            
            <div className="auth-modal-header">
              <div className="auth-modal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 id="otp-modal-title" className="auth-modal-title">Vérifiez votre adresse email</h2>
              <p className="auth-modal-desc">
                Entrez le code à 6 chiffres envoyé à<br />
                <strong>{form.email}</strong>
              </p>
            </div>

            {otpError && (
              <div className="auth-error" style={{ marginTop: '12px', marginBottom: '4px' }} role="alert">
                <AlertTriangleIcon size={16} /> {otpError}
              </div>
            )}

            {/* 6 Cases OTP interactives */}
            <OtpDigitBoxes
              length={6}
              value={otp}
              onChange={setOtp}
              onComplete={(code) => handleVerifyOtp(code)}
              disabled={verifying}
            />

            <div className="auth-resend-row">
              <span>Vous n'avez rien reçu ?</span>
              <button
                type="button"
                className="auth-resend-btn"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || verifying}
              >
                {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer un code'}
              </button>
            </div>

            <button
              type="button"
              className="auth-btn"
              onClick={() => handleVerifyOtp()}
              disabled={verifying || otp.length !== 6}
            >
              {verifying ? <><span className="auth-spinner" /> Validation…</> : 'Valider et s\'inscrire'}
            </button>

            <button
              type="button"
              className="auth-link-btn"
              style={{ marginTop: '14px' }}
              onClick={() => setShowOtpModal(false)}
              disabled={verifying}
            >
              ← Modifier mes informations
            </button>
          </div>
        </div>
      )}
    </>
  );
}
