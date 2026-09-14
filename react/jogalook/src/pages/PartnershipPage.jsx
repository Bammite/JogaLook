import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './PartnershipPage.css';

const PARTNERSHIP_TYPES = [
  {
    id: 'CLUB',
    icon: '🏆',
    label: 'Clubs & associations',
    title: 'Faites grandir votre club avec JogaLook',
    text: 'Votre club veut proposer des maillots officiels à ses membres ou les vendre lors de ses événements ? Devenez partenaire JogaLook et bénéficiez de conditions exclusives.',
    accent: 'blue',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&h=620&fit=crop',
    points: ['Maillots co-brandés aux couleurs du club', 'Commission attractive sur les ventes', 'Page club et support merchandising'],
  },
  {
    id: 'SCHOOL',
    icon: '🎓',
    label: 'Écoles & établissements',
    title: 'Équipez vos élèves pour chaque saison',
    text: 'École, collège, lycée ou association sportive : nous proposons des lots personnalisés pour habiller toute une classe ou une équipe, avec des tarifs dégressifs attractifs.',
    accent: 'green',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&h=620&fit=crop',
    points: ['Personnalisation complète des maillots', 'Tailles XS à 3XL pour tous les gabarits', 'Devis gratuit et facturation administrative'],
  },
  {
    id: 'WHOLESALER',
    icon: '🏪',
    label: 'Revendeurs & boutiques',
    title: 'Développez votre offre sport',
    text: 'Vous êtes revendeur ou gérant d’une boutique sport ? Profitez de nos tarifs préférentiels dès 20 unités et d’un accompagnement commercial dédié.',
    accent: 'orange',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=620&fit=crop',
    points: ['Tarifs dégressifs dès 20 unités', 'Large catalogue multi-sports', 'Livraison rapide et conseiller dédié'],
  },
];

const EMPTY_FORM = { name: '', email: '', phone: '', organization: '', quantity: '', city: '', message: '' };

function PartnershipContactModal({ config, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!config) return null;

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: config.type, ...form }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Erreur lors de l’envoi.');
      setSuccess(true);
    } catch (submitError) {
      setError(submitError.message || 'Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="partnership-modal-overlay" role="dialog" aria-modal="true" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="partnership-modal-card">
        <button className="partnership-modal-close" type="button" onClick={onClose} aria-label="Fermer">×</button>
        {success ? (
          <div className="partnership-modal-success">
            <div className="partnership-modal-success-icon">✓</div>
            <h3>Demande envoyée !</h3>
            <p>Nous avons bien reçu votre demande et vous répondrons sous <strong>24 à 48 heures ouvrées</strong>.</p>
            <button className="partnership-btn partnership-btn--primary" type="button" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <>
            <div className="partnership-modal-head">
              <span className="partnership-modal-badge" style={{ background: config.accentLight, color: config.accent }}>{config.icon} {config.badge}</span>
              <h2>{config.title}</h2>
              <p>{config.desc}</p>
            </div>
            {error && <div className="partnership-modal-error" role="alert">{error}</div>}
            <form className="partnership-modal-form" onSubmit={handleSubmit} noValidate>
              <div className="partnership-modal-form__row">
                <label>Nom complet *<input required value={form.name} onChange={set('name')} placeholder="Jean Dupont" /></label>
                <label>Email *<input required type="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.com" /></label>
              </div>
              <div className="partnership-modal-form__row">
                <label>Téléphone *<input required type="tel" value={form.phone} onChange={set('phone')} placeholder="+221 77 000 0000" /></label>
                <label>{config.orgLabel}<input value={form.organization} onChange={set('organization')} placeholder={config.orgPlaceholder} /></label>
              </div>
              <div className="partnership-modal-form__row">
                <label>Quantité souhaitée<input type="number" min="1" value={form.quantity} onChange={set('quantity')} placeholder="Ex : 30" /></label>
                <label>Ville / région<input value={form.city} onChange={set('city')} placeholder="Dakar" /></label>
              </div>
              <label>Message *<textarea required rows="4" value={form.message} onChange={set('message')} placeholder={config.messagePlaceholder} /></label>
              <button className="partnership-btn partnership-btn--primary" type="submit" disabled={loading}>{loading ? 'Envoi en cours…' : config.submitLabel}<span>→</span></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const FAQS = [
  ['À partir de combien de pièces puis-je demander un devis ?', 'Nous étudions les projets à partir de 15 pièces. Pour les revendeurs, les tarifs professionnels commencent généralement à 20 unités.'],
  ['Dans quelles villes livrez-vous ?', 'Nous livrons à Dakar et dans toutes les régions du Sénégal. Les délais varient selon la destination et le volume de la commande.'],
  ['Peut-on personnaliser les maillots ?', 'Oui. Nous pouvons intégrer noms, numéros, logos et couleurs selon le modèle retenu et la faisabilité technique.'],
  ['Comment se déroule le paiement ?', 'Après validation du devis, nous vous indiquons les modalités adaptées à votre projet : acompte, paiement mobile ou autre solution convenue.'],
];

function PartnershipPage() {
  const [selectedType, setSelectedType] = useState('CLUB');
  const [activeModal, setActiveModal] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  const selected = PARTNERSHIP_TYPES.find((item) => item.id === selectedType) || PARTNERSHIP_TYPES[0];

  const modalConfigs = Object.fromEntries(PARTNERSHIP_TYPES.map((item) => [item.id, {
    type: item.id,
    icon: item.icon,
    badge: item.label,
    accent: item.id === 'CLUB' ? '#2563eb' : item.id === 'SCHOOL' ? '#16a34a' : '#ea580c',
    accentLight: item.id === 'CLUB' ? '#eff6ff' : item.id === 'SCHOOL' ? '#f0fdf4' : '#fff7ed',
    title: item.id === 'WHOLESALER' ? 'Commander en gros' : item.id === 'CLUB' ? 'Partenariat de vente pour clubs' : 'Lot de maillots scolaire / équipe',
    desc: item.id === 'WHOLESALER' ? 'Vous êtes revendeur ou gérant d’une boutique sport ? Profitez de nos tarifs préférentiels dès 20 unités. Remplissez ce formulaire et notre équipe commerciale vous contactera.' : item.id === 'CLUB' ? 'Votre club veut proposer des maillots officiels à ses membres ou les vendre lors de ses événements ? Devenez partenaire JogaLook et bénéficiez de conditions exclusives.' : 'École, collège, lycée ou association sportive : nous proposons des lots personnalisés pour habiller toute une classe ou une équipe, avec des tarifs dégressifs attractifs.',
    orgLabel: item.id === 'WHOLESALER' ? 'Boutique / Enseigne' : item.id === 'SCHOOL' ? 'Établissement / Association' : 'Nom du club',
    orgPlaceholder: item.id === 'WHOLESALER' ? 'Sport Express Dakar' : item.id === 'SCHOOL' ? 'Lycée Lamine Guèye' : 'AS Liberté Dakar',
    messagePlaceholder: item.id === 'WHOLESALER' ? 'Décrivez votre besoin : types de maillots, quantités, délais, conditions souhaitées…' : item.id === 'SCHOOL' ? 'Indiquez le niveau scolaire, la discipline, le nombre d’élèves/joueurs, et toute préférence de couleur ou personnalisation…' : 'Présentez votre club, le nombre de membres, le type de sport, vos ambitions de vente…',
    submitLabel: item.id === 'WHOLESALER' ? 'Envoyer ma demande revendeur' : item.id === 'SCHOOL' ? 'Demander un devis scolaire' : 'Proposer un partenariat',
  }]));

  return (
    <>
      <Navbar />
      <main className="partnership-page">
        <section className="partnership-hero">
          <div className="partnership-container partnership-hero__layout">
            <div className="partnership-hero__content">
              <span className="partnership-kicker">JogaLook Business · Sénégal</span>
              <h1>Le bon maillot pour chaque projet collectif.</h1>
              <p>Vous représentez un club, une école ou une boutique sport ? Choisissez votre type de partenariat et construisons une offre adaptée à votre activité.</p>
              <div className="partnership-hero__actions">
                <a href="#demande" className="partnership-btn partnership-btn--primary">Démarrer un projet <span>→</span></a>
                <a href="https://wa.me/221781941351?text=Bonjour%20JogaLook%2C%20je%20souhaite%20parler%20d%27un%20partenariat." className="partnership-btn partnership-btn--outline" target="_blank" rel="noreferrer">Parler sur WhatsApp</a>
              </div>
              <div className="partnership-hero__trust"><span>✓ Devis gratuit</span><span>✓ Réponse sous 24–48 h</span><span>✓ Livraison au Sénégal</span></div>
            </div>
            <div className="partnership-hero__types" aria-label="Types de partenariats proposés">
              {PARTNERSHIP_TYPES.map((item) => (
                <button key={item.id} type="button" className={`partnership-hero-type partnership-hero-type--${item.accent}`} onClick={() => { setSelectedType(item.id); setActiveModal(item.id); }}>
                  <img src={item.image} alt="" className="partnership-hero-type__image" />
                  <span className="partnership-hero-type__icon">{item.icon}</span>
                  <span className="partnership-hero-type__copy"><strong>{item.label}</strong><small>{item.text}</small></span>
                  <span className="partnership-hero-type__arrow" aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="partnership-proof">
          <div className="partnership-container partnership-proof__grid">
            <div><strong>Une présence locale</strong><span>Équipe basée à Dakar</span></div>
            <div><strong>Une réponse concrète</strong><span>Devis clair et personnalisé</span></div>
            <div><strong>Un suivi de proximité</strong><span>Du premier échange à la livraison</span></div>
            <div><strong>Des projets qui durent</strong><span>Des tenues pensées pour le terrain</span></div>
          </div>
        </section>

        <section className="partnership-section partnership-offers" id="offres">
          <div className="partnership-container">
            <div className="partnership-section-heading"><span className="partnership-kicker">Une solution pour chaque ambition</span><h2>Quel partenariat vous ressemble ?</h2><p>Choisissez votre profil pour découvrir une proposition adaptée à votre réalité.</p></div>
            <div className="partnership-offer-tabs" role="tablist">
              {PARTNERSHIP_TYPES.map((item) => <button key={item.id} type="button" className={`partnership-offer-tab partnership-offer-tab--${item.accent} ${selectedType === item.id ? 'is-active' : ''}`} onClick={() => setSelectedType(item.id)}><span>{item.icon}</span><strong>{item.label}</strong></button>)}
            </div>
            <div className={`partnership-offer-detail partnership-offer-detail--${selected.accent}`}>
              <div><span className="partnership-offer-detail__eyebrow">{selected.icon} {selected.label}</span><h3>{selected.title}</h3><p>{selected.text}</p><button type="button" className="partnership-text-link partnership-text-button" onClick={() => setActiveModal(selected.id)}>Parler de votre projet <span>→</span></button></div>
              <img src={selected.image} alt={`Projet ${selected.label}`} className="partnership-offer-detail__image" />
              <ul>{selected.points.map((point) => <li key={point}><span>✓</span>{point}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="partnership-section partnership-process">
          <div className="partnership-container">
            <div className="partnership-section-heading"><span className="partnership-kicker">Simple, transparent, local</span><h2>De l’idée à vos maillots en 4 étapes</h2></div>
            <div className="partnership-process__grid">
              {[['01', 'Échange', 'Vous nous présentez votre structure, vos objectifs et vos contraintes.'], ['02', 'Proposition', 'Nous construisons une recommandation et un devis lisible, adapté à votre volume.'], ['03', 'Validation', 'Vous validez les modèles, les tailles, la personnalisation et le calendrier.'], ['04', 'Livraison', 'Nous coordonnons la production et la livraison jusqu’à Dakar ou votre région.']].map(([number, title, text]) => <article key={number} className="partnership-process-card"><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="partnership-local">
          <div className="partnership-container partnership-local__grid"><div><span className="partnership-kicker">Pensé pour le terrain sénégalais</span><h2>Un partenaire qui comprend vos réalités.</h2><p>Un tournoi à Thiès, une rentrée scolaire à Saint-Louis, une boutique à Dakar ou une association à Ziguinchor : nous adaptons les volumes, le calendrier et l’accompagnement à votre contexte.</p><a href="#demande" className="partnership-btn partnership-btn--light">Recevoir un accompagnement <span>→</span></a></div><div className="partnership-local__cities"><span>Dakar</span><span>Thiès</span><span>Saint-Louis</span><span>Mbour</span><span>Ziguinchor</span><span>Toutes les régions</span></div></div>
        </section>

        <section className="partnership-section partnership-faq"><div className="partnership-container partnership-faq__grid"><div className="partnership-section-heading"><span className="partnership-kicker">Questions fréquentes</span><h2>Tout savoir avant de commencer.</h2><p>Une question qui n’est pas ici ? Notre équipe est disponible par téléphone et WhatsApp.</p><a href="tel:+221781941351" className="partnership-text-link">+221 78 194 13 51 <span>→</span></a></div><div className="partnership-faq__list">{FAQS.map(([question, answer], index) => <div className={`partnership-faq__item ${openFaq === index ? 'is-open' : ''}`} key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{question}</span><b>{openFaq === index ? '−' : '+'}</b></button>{openFaq === index && <p>{answer}</p>}</div>)}</div></div></section>

        <section className="partnership-request" id="demande"><div className="partnership-container partnership-request__grid"><div className="partnership-request__intro"><span className="partnership-kicker">Votre projet commence ici</span><h2>Parlons de ce que nous pouvons construire ensemble.</h2><p>Décrivez-nous votre besoin. Un conseiller JogaLook vous recontactera avec les premières recommandations adaptées à votre structure.</p><div className="partnership-request__contact"><span>📍 Dakar, Sénégal</span><span>📞 +221 78 194 13 51</span><span>✉️ partenariat@jogalook.com</span></div><button type="button" className="partnership-btn partnership-btn--primary" onClick={() => setActiveModal(selectedType)}>Ouvrir le formulaire <span>→</span></button></div><img src={selected.image} alt="Équipe portant des maillots personnalisés" className="partnership-request__image" /></div></section>
      </main>
      <Footer />
      <PartnershipContactModal config={activeModal ? modalConfigs[activeModal] : null} onClose={() => setActiveModal(null)} />
    </>
  );
}

export default PartnershipPage;

