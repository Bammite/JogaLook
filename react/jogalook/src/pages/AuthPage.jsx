import { useState } from 'react';
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

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function LoginPage() {
  const { login, verifyOtp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [step, setStep]         = useState('credentials'); // 'credentials' | 'otp'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState('');

  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { requireOtp } = await login(email, password);
      if (requireOtp) {
        setStep('otp');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
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
      <h1 className="auth-title">
        {step === 'otp' ? 'Vérification OTP' : 'Connexion'}
      </h1>
      <p className="auth-sub">
        {step === 'otp'
          ? <>Entrez le code à 6 chiffres envoyé à <strong>{email}</strong></>
          : 'Bienvenue sur JogaLook'
        }
      </p>

      {error && (
        <div className="auth-error" role="alert">
          <AlertTriangleIcon size={16} /> {error}
        </div>
      )}

      {step === 'credentials' ? (
        <>
          <GoogleButton onClick={handleGoogle} loading={googleLoading} text="Se connecter avec Google" />
          <AuthDivider />
          <form onSubmit={handleCredentials} className="auth-form" noValidate>
            <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.com" required autoComplete="email" />
            <AuthInput label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="••••••••" required autoComplete="current-password" />
            <button className="auth-btn" type="submit" disabled={loading || googleLoading}>
              {loading ? <><span className="auth-spinner" /> Connexion…</> : 'Se connecter'}
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={handleOtp} className="auth-form" noValidate>
          <div className="auth-otp-inputs">
            <input
              className="auth-otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              autoFocus
              autoComplete="one-time-code"
            />
          </div>
          <button className="auth-btn" type="submit" disabled={loading || otp.length !== 6}>
            {loading ? <><span className="auth-spinner" /> Vérification…</> : 'Confirmer'}
          </button>
          <button type="button" className="auth-link-btn" onClick={() => { setStep('credentials'); setOtp(''); }}>
            ← Retour
          </button>
        </form>
      )}

      <p className="auth-switch">
        Pas encore de compte ?{' '}
        <Link to="/register" state={{ from }}>Créer un compte</Link>
      </p>
    </AuthCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REGISTER PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

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
      await register({
        email:      form.email,
        password:   form.password,
        first_name: form.first_name,
        last_name:  form.last_name,
        phone:      form.phone,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
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
        <div className="auth-row">
          <AuthInput label="Prénom" value={form.first_name} onChange={set('first_name')} placeholder="Prénom" autoComplete="given-name" />
          <AuthInput label="Nom" value={form.last_name} onChange={set('last_name')} placeholder="Nom" autoComplete="family-name" />
        </div>
        <AuthInput label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.com" required autoComplete="email" />
        <AuthInput label="Téléphone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+221 77 000 0000" autoComplete="tel" />
        <AuthInput label="Mot de passe *" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 caractères" required autoComplete="new-password" />
        <AuthInput label="Confirmer le mot de passe *" type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" required autoComplete="new-password" />

        <button className="auth-btn" type="submit" disabled={loading || googleLoading}>
          {loading ? <><span className="auth-spinner" /> Création…</> : 'Créer mon compte'}
        </button>
      </form>

      <p className="auth-switch">
        Déjà un compte ?{' '}
        <Link to="/login" state={{ from }}>Se connecter</Link>
      </p>
    </AuthCard>
  );
}
