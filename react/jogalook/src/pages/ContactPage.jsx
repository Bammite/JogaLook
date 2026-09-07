import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  PhoneCallIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  SendIcon,
  ShieldCheckIcon,
  TruckIcon,
  AlertTriangleIcon,
} from '../components/icons/AppIcons';
import './ContactPage.css';

const PHONE_1 = '+221781941351';
const PHONE_1_DISPLAY = '+221 78 194 13 51';
const PHONE_2 = '+221710316939';
const PHONE_2_DISPLAY = '+221 71 031 69 39';
const EMAIL = 'contact@jogalook.com';
const ADDRESS = 'Dakar HLM-bentaly, Sénégal';

const SUBJECT_OPTIONS = [
  'Question générale sur un maillot',
  'Suivi ou modification de commande',
  'Personnalisation & flocage sur mesure',
  'Commande en gros / revendeur',
  'Partenariat club ou école',
  'Autre demande',
];

const FAQS = [
  {
    q: 'Quels sont vos délais de livraison à Dakar et dans les régions ?',
    a: 'À Dakar, les livraisons s\'effectuent généralement en 24h ouvrées. Pour les autres régions du Sénégal (Thiès, Saint-Louis, Mbour, Ziguinchor…), comptez entre 48h et 72h via nos transporteurs partenaires.',
  },
  {
    q: 'Comment fonctionne la personnalisation des maillots ?',
    a: 'Vous pouvez utiliser notre outil de customisation en ligne pour choisir vos couleurs, ajouter votre nom, votre numéro et vos sponsors. Nos flocages sont réalisés avec des matériaux thermocollants haute résistance.',
  },
  {
    q: 'Proposez-vous des tarifs dégressifs pour les clubs et écoles ?',
    a: 'Absolument ! Dès 15 à 20 pièces, nous proposons des tarifs préférentiels pour les clubs sportifs, les écoles et les revendeurs. Vous pouvez faire une demande directement via notre formulaire ci-dessus.',
  },
  {
    q: 'Quels sont les modes de paiement disponibles ?',
    a: 'Nous acceptons Wave, Orange Money, Free Money, les cartes bancaires (Visa/Mastercard) et le paiement à la livraison sur Dakar selon éligibilité.',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: SUBJECT_OPTIONS[0],
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      return setError('Veuillez renseigner votre nom, email et message.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GENERAL',
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject,
          message: form.message.trim(),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Impossible d\'envoyer le message.');
      }

      setSuccess(true);
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: SUBJECT_OPTIONS[0],
        message: '',
      });
    } catch (err) {
      setError(err.message || 'Une erreur réseau est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="contact-page">
        {/* ── Hero Banner ── */}
        <section className="contact-hero">
          <div className="container contact-hero__content">
            <span className="contact-hero__badge">Nous Contacter</span>
            <h1 className="contact-hero__title">
              Une question, un projet ? <br />
              <span className="contact-hero__highlight">Nous sommes à votre écoute</span>
            </h1>
            <p className="contact-hero__desc">
              Notre équipe basée à Dakar est disponible pour vous conseiller sur vos choix de maillots,
              vos commandes personnalisées et vos projets de partenariats.
            </p>
          </div>
        </section>

        {/* ── Contact Info Cards Grid ── */}
        <section className="contact-cards-section">
          <div className="container">
            <div className="contact-cards-grid">
              
              {/* Carte 1 : Téléphones & WhatsApp */}
              <div className="contact-card contact-card--phones">
                <div className="contact-card__icon">
                  <PhoneCallIcon size={28} />
                </div>
                <h3>Téléphone &amp; WhatsApp</h3>
                <p className="contact-card__lead">
                  Joignables directement du lundi au samedi pour assistance et commandes rapides :
                </p>

                <div className="contact-card__numbers">
                  <div className="contact-phone-item">
                    <span className="contact-phone-val">{PHONE_1_DISPLAY}</span>
                    <div className="contact-phone-actions">
                      <a href={`tel:${PHONE_1}`} className="contact-action-btn" title="Appeler">
                        Appeler
                      </a>
                      <a
                        href={`https://wa.me/${PHONE_1.replace('+', '')}?text=Bonjour%20JogaLook%2C%20je%20souhaite%20des%20informations.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-action-btn contact-action-btn--wa"
                        title="Discuter sur WhatsApp"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  <div className="contact-phone-item">
                    <span className="contact-phone-val">{PHONE_2_DISPLAY}</span>
                    <div className="contact-phone-actions">
                      <a href={`tel:${PHONE_2}`} className="contact-action-btn" title="Appeler">
                        Appeler
                      </a>
                      <a
                        href={`https://wa.me/${PHONE_2.replace('+', '')}?text=Bonjour%20JogaLook%2C%20je%20souhaite%20des%20informations.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-action-btn contact-action-btn--wa"
                        title="Discuter sur WhatsApp"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>

                <div className="contact-card__note">
                  <ClockIcon size={14} /> Lun – Sam : 09h00 – 20h00
                </div>
              </div>

              {/* Carte 2 : Email */}
              <div className="contact-card contact-card--email">
                <div className="contact-card__icon">
                  <MailIcon size={28} />
                </div>
                <h3>Email Service Client</h3>
                <p className="contact-card__lead">
                  Pour vos demandes détaillées, devis, réclamations ou envois de maquettes :
                </p>

                <div className="contact-email-box">
                  <a href={`mailto:${EMAIL}`} className="contact-email-val">
                    {EMAIL}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="contact-copy-btn"
                    title="Copier l'adresse email"
                  >
                    {copiedEmail ? '✓ Copié !' : 'Copier'}
                  </button>
                </div>

                <a
                  href={`mailto:${EMAIL}?subject=Demande%20d%27information%20JogaLook`}
                  className="contact-action-btn contact-action-btn--primary"
                  style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
                >
                  Envoyer un email directement
                </a>

                <div className="contact-card__note">
                  <ClockIcon size={14} /> Réponse sous 24h ouvrées garantie
                </div>
              </div>

              {/* Carte 3 : Adresse physique */}
              <div className="contact-card contact-card--address">
                <div className="contact-card__icon">
                  <MapPinIcon size={28} />
                </div>
                <h3>Boutique &amp; Point Relais</h3>
                <p className="contact-card__lead">
                  Venez découvrir nos maillots, essayer vos tailles et retirer vos colis :
                </p>

                <div className="contact-address-box">
                  <strong>JogaLook Sportswear</strong>
                  <p>{ADDRESS}</p>
                </div>

                <a
                  href="https://maps.google.com/?q=HLM+Dakar+Senegal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-action-btn contact-action-btn--outline"
                  style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
                >
                  Ouvrir sur Google Maps
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>

                <div className="contact-card__note">
                  <ClockIcon size={14} /> Ouvert 6 jours sur 7
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Main Form & Map Section ── */}
        <section className="contact-main-section">
          <div className="container">
            <div className="contact-main-grid">

              {/* Formulaire à gauche */}
              <div className="contact-form-panel">
                <div className="contact-panel-head">
                  <span className="contact-panel-tag">Formulaire de contact</span>
                  <h2>Envoyez-nous un message</h2>
                  <p>
                    Remplissez ce formulaire et recevez un email d'accusé de réception automatique.
                    Notre équipe commerciale vous répondra très rapidement.
                  </p>
                </div>

                {error && (
                  <div className="contact-alert contact-alert--error" role="alert">
                    <AlertTriangleIcon size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="contact-alert contact-alert--success" role="alert">
                    <div className="contact-alert__icon">✓</div>
                    <div>
                      <strong>Message envoyé avec succès !</strong>
                      <p>
                        Nous avons bien reçu votre demande. Un email de confirmation vient de vous être envoyé.
                        Notre équipe vous répondra sous 24h.
                      </p>
                    </div>
                  </div>
                )}

                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="contact-form-row">
                    <div className="contact-field">
                      <label htmlFor="c-name">Nom complet *</label>
                      <input
                        id="c-name"
                        type="text"
                        value={form.name}
                        onChange={set('name')}
                        placeholder="Mamadou Diop"
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="c-email">Adresse email *</label>
                      <input
                        id="c-email"
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        placeholder="mamadou@exemple.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="contact-form-row">
                    <div className="contact-field">
                      <label htmlFor="c-phone">
                        Téléphone <span className="contact-label-opt">(facultatif)</span>
                      </label>
                      <input
                        id="c-phone"
                        type="tel"
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="+221 77 000 0000"
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="c-subject">Sujet de votre message</label>
                      <select
                        id="c-subject"
                        value={form.subject}
                        onChange={set('subject')}
                      >
                        {SUBJECT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="contact-field">
                    <label htmlFor="c-message">Votre message *</label>
                    <textarea
                      id="c-message"
                      rows={5}
                      value={form.message}
                      onChange={set('message')}
                      placeholder="Décrivez votre besoin, les maillots qui vous intéressent ou toute question que vous souhaitez nous poser…"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="contact-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="contact-spinner" />
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        <SendIcon size={18} />
                        Envoyer mon message
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Panneau latéral : Localisation & Avantages */}
              <div className="contact-sidebar">
                {/* Carte interactive / embed OpenStreetMap Dakar */}
                <div className="contact-map-card">
                  <div className="contact-map-card__head">
                    <MapPinIcon size={18} color="var(--primary, #f15a24)" />
                    <div>
                      <strong>Localisation à Dakar</strong>
                      <small>HLM-Bentaly, Dakar – Sénégal</small>
                    </div>
                  </div>
                  <div className="contact-map-frame">
                    <iframe
                      title="Emplacement JogaLook Dakar HLM Bentaly"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=-17.4660%2C14.7080%2C-17.4360%2C14.7280&amp;layer=mapnik&amp;marker=14.7180%2C-17.4510"
                      loading="lazy"
                    />
                  </div>
                  <div className="contact-map-card__foot">
                    <span>Point de retrait disponible sur rendez-vous</span>
                  </div>
                </div>

                {/* Engagements & Avantages */}
                <div className="contact-perks-card">
                  <h3>Pourquoi nous contacter ?</h3>
                  <ul className="contact-perks-list">
                    <li>
                      <div className="contact-perk-icon">
                        <ClockIcon size={18} />
                      </div>
                      <div>
                        <strong>Réactivité garantie</strong>
                        <p>Une réponse humaine sous 24h ouvrées pour toute question.</p>
                      </div>
                    </li>
                    <li>
                      <div className="contact-perk-icon">
                        <ShieldCheckIcon size={18} />
                      </div>
                      <div>
                        <strong>Maillots authentiques</strong>
                        <p>Qualité premium et flocages durables contrôlés avant chaque envoi.</p>
                      </div>
                    </li>
                    <li>
                      <div className="contact-perk-icon">
                        <TruckIcon size={18} />
                      </div>
                      <div>
                        <strong>Expédition partout au Sénégal</strong>
                        <p>Livraison à domicile ou en point relais dans toutes les régions.</p>
                      </div>
                    </li>
                  </ul>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ── FAQ Accordion ── */}
        <section className="contact-faq-section">
          <div className="container">
            <div className="contact-faq-head">
              <span className="contact-panel-tag">Foire aux questions</span>
              <h2>Questions fréquentes</h2>
              <p>Vous trouverez peut-être votre réponse ici avant de nous écrire</p>
            </div>

            <div className="contact-faq-list">
              {FAQS.map((item, idx) => (
                <div
                  key={idx}
                  className={`contact-faq-item ${openFaq === idx ? 'contact-faq-item--open' : ''}`}
                >
                  <button
                    type="button"
                    className="contact-faq-question"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    aria-expanded={openFaq === idx}
                  >
                    <span>{item.q}</span>
                    <span className="contact-faq-chevron">
                      {openFaq === idx ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div className="contact-faq-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
