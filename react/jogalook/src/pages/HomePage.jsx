import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import AnimatedJersey from '../components/AnimatedJersey';
import {
  FootballIcon,
  BasketballIcon,
  RugbyIcon,
  RunningIcon,
  TennisIcon,
  FitnessIcon,
  FlameIcon,
} from '../components/icons/AppIcons';
import hero1Img from '../assets/hero/Hero1.png';
import hero3Img from '../assets/hero/Hero3.png';
import hero4Img from '../assets/hero/Hero4.png';
import './HomePage.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const HERO_SLIDES = [
  { id: 'hero1', type: 'image', src: hero1Img, duration: 3000, alt: 'Équipement JogaLook 1' },
  { id: 'jersey', type: 'jersey', duration: 7000 },
  { id: 'hero3', type: 'image', src: hero3Img, duration: 3000, alt: 'Équipement JogaLook 3' },
  { id: 'hero4', type: 'image', src: hero4Img, duration: 3000, alt: 'Équipement JogaLook 4' },
];

const SPORT_ICONS = [
  <FootballIcon size={36} />,
  <BasketballIcon size={36} />,
  <RugbyIcon size={36} />,
  <RunningIcon size={36} />,
  <TennisIcon size={36} />,
  <FitnessIcon size={36} />,
];

const stats = [
  { value: '10K+', label: 'Clients satisfaits' },
  { value: '500+', label: 'Maillots disponibles' },
  { value: '98%',  label: 'Avis positifs' },
  { value: '24/7', label: 'Service client' },
];


// ── Contact Modal ─────────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', email: '', phone: '', organization: '', quantity: '', city: '', message: '' };

function ContactModal({ config, onClose }) {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  if (!config) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: config.type, ...form }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Erreur lors de l\'envoi');
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hp-modal-overlay" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hp-modal-card">
        <button className="hp-modal-close" onClick={onClose} aria-label="Fermer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {success ? (
          <div className="hp-modal-success">
            <div className="hp-modal-success-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h3>Demande envoyée !</h3>
            <p>Nous avons bien reçu votre demande et vous répondrons sous <strong>24 à 48 heures ouvrées</strong>. Un email de confirmation vient de vous être adressé.</p>
            <button className="hp-btn-primary" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <>
            <div className="hp-modal-head">
              <span className="hp-modal-badge" style={{ background: config.accentLight, color: config.accent }}>{config.icon} {config.badge}</span>
              <h2 className="hp-modal-title">{config.title}</h2>
              <p className="hp-modal-desc">{config.desc}</p>
            </div>

            {error && (
              <div className="hp-modal-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <form className="hp-modal-form" onSubmit={handleSubmit} noValidate>
              <div className="hp-form-row">
                <div className="hp-form-group">
                  <label>Nom complet *</label>
                  <input type="text" value={form.name} onChange={set('name')} placeholder="Jean Dupont" required />
                </div>
                <div className="hp-form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.com" required />
                </div>
              </div>

              <div className="hp-form-row">
                <div className="hp-form-group">
                  <label>Téléphone <span className="hp-label-opt">(optionnel)</span></label>
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+221 77 000 0000" />
                </div>
                <div className="hp-form-group">
                  <label>{config.orgLabel || 'Organisation'} <span className="hp-label-opt">(optionnel)</span></label>
                  <input type="text" value={form.organization} onChange={set('organization')} placeholder={config.orgPlaceholder || 'Nom de votre structure'} />
                </div>
              </div>

              {config.showQuantity && (
                <div className="hp-form-row">
                  <div className="hp-form-group">
                    <label>Quantité souhaitée</label>
                    <input type="number" min="1" value={form.quantity} onChange={set('quantity')} placeholder="Ex: 50" />
                  </div>
                  <div className="hp-form-group">
                    <label>Ville / Région</label>
                    <input type="text" value={form.city} onChange={set('city')} placeholder="Dakar" />
                  </div>
                </div>
              )}

              <div className="hp-form-group">
                <label>Message *</label>
                <textarea value={form.message} onChange={set('message')} rows={4} placeholder={config.messagePlaceholder} required />
              </div>

              <button className="hp-btn-primary hp-btn-full" type="submit" disabled={loading} style={{ '--btn-accent': config.accent }}>
                {loading
                  ? <><span className="hp-spinner" /> Envoi en cours…</>
                  : <>{config.submitLabel} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function HomePage() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [resetKey, setResetKey]                   = useState(0);
  const [featuredProducts, setFeaturedProducts]   = useState([]);
  const [categories, setCategories]               = useState([]);
  const [blogPosts, setBlogPosts]                 = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [activeModal, setActiveModal]             = useState(null); // 'WHOLESALER' | 'CLUB' | 'SCHOOL'

  // Hero carousel
  useEffect(() => {
    const currentSlide = HERO_SLIDES[currentSlideIndex];
    const timer = setTimeout(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, currentSlide.duration);
    return () => clearTimeout(timer);
  }, [currentSlideIndex, resetKey]);

  // Load products, categories, blog
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes, newsRes] = await Promise.all([
          fetch('/api/products?limit=8'),
          fetch('/api/categories'),
          fetch('/api/sports-news?status=PUBLISHED&limit=3'),
        ]);
        const [pJson, cJson, nJson] = await Promise.all([productsRes.json(), categoriesRes.json(), newsRes.json()]);

        const mappedProducts = (pJson.data || []).filter((p) => p.is_active !== false).slice(0, 8).map((product) => {
          const categoryName = product.categories?.name || product.category_name || 'Autre';
          const colors = Array.from(new Set((product.product_variants || []).map((v) => v.color_hex).filter(Boolean)));
          return {
            id: product.id,
            name: product.name,
            team: categoryName,
            price: Number(product.base_price ?? 0),
            oldPrice: product.oldPrice ?? null,
            image: product.image_url || 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=400&h=500&fit=crop',
            badge: product.is_customizable ? { type: 'new', text: 'Personnalisable' } : null,
            colors: colors.length ? colors : ['#1F2937', '#F8FAFC', '#D1D5DB'],
            category: categoryName,
          };
        });

        const mappedCategories = (cJson.data || []).slice(0, 6).map((cat, i) => ({
          name: cat.name,
          icon: SPORT_ICONS[i % SPORT_ICONS.length],
          count: cat.product_count || 0,
          color: ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#e9c46a', '#6d6875'][i % 6],
        }));

        const mappedNews = (nJson.data || []).slice(0, 3).map((a) => ({
          id: a.id,
          title: a.title,
          excerpt: a.excerpt || a.content?.slice(0, 160) + '…',
          image: a.cover_image_url || null,
          category: a.sports_news_categories?.name || a.category_name || a.category || 'Actualité',
          date: a.published_at ? new Date(a.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
          readTime: a.read_time || `${Math.max(3, Math.ceil((a.content?.split(' ').length || 300) / 200))} min`,
          slug: a.slug || a.id,
        }));

        setFeaturedProducts(mappedProducts);
        setCategories(mappedCategories);
        setBlogPosts(mappedNews);
      } catch {
        setFeaturedProducts([]);
        setCategories([]);
        setBlogPosts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleJerseyInteraction = () => setResetKey((prev) => prev + 1);

  // Modal configs
  const MODAL_CONFIGS = {
    WHOLESALER: {
      type: 'WHOLESALER',
      icon: '🏪',
      badge: 'Revendeur',
      accentLight: '#fff7ed',
      accent: '#ea580c',
      title: 'Commander en gros',
      desc: 'Vous êtes revendeur ou gérant d\'une boutique sport ? Profitez de nos tarifs préférentiels dès 20 unités. Remplissez ce formulaire et notre équipe commerciale vous contactera.',
      orgLabel: 'Boutique / Enseigne',
      orgPlaceholder: 'Sport Express Dakar',
      showQuantity: true,
      messagePlaceholder: 'Décrivez votre besoin : types de maillots, quantités, délais, conditions souhaitées…',
      submitLabel: 'Envoyer ma demande revendeur',
    },
    CLUB: {
      type: 'CLUB',
      icon: '🏆',
      badge: 'Partenariat Club',
      accentLight: '#eff6ff',
      accent: '#2563eb',
      title: 'Partenariat de vente pour clubs',
      desc: 'Votre club veut proposer des maillots officiels à ses membres ou les vendre lors de ses événements ? Devenez partenaire JogaLook et bénéficiez de conditions exclusives.',
      orgLabel: 'Nom du club',
      orgPlaceholder: 'AS Liberté Dakar',
      showQuantity: true,
      messagePlaceholder: 'Présentez votre club, le nombre de membres, le type de sport, vos ambitions de vente…',
      submitLabel: 'Proposer un partenariat',
    },
    SCHOOL: {
      type: 'SCHOOL',
      icon: '🎓',
      badge: 'Lot Scolaire',
      accentLight: '#f0fdf4',
      accent: '#16a34a',
      title: 'Lot de maillots scolaire / équipe',
      desc: 'École, collège, lycée ou association sportive — nous proposons des lots personnalisés pour habiller toute une classe ou une équipe, avec des tarifs dégressifs attractifs.',
      orgLabel: 'Établissement / Association',
      orgPlaceholder: 'Lycée Lamine Guèye',
      showQuantity: true,
      messagePlaceholder: 'Indiquez le niveau scolaire, la discipline, le nombre d\'élèves/joueurs, et toute préférence de couleur ou personnalisation…',
      submitLabel: 'Demander un devis scolaire',
    },
  };

  return (
    <>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-section" id="home">
        <div className="container hero-content">
          <h1 className="hero-title">
            Portez la passion,<br />
            <span className="hero-highlight">vivez le jeu</span>
          </h1>

          <div className="hero-image">
            <div className="hero-image-bg" />
            <div className="hero-carousel-container">
              {HERO_SLIDES.map((slide, idx) => (
                <div key={slide.id} className={`hero-carousel-slide ${idx === currentSlideIndex ? 'active' : ''}`}>
                  {slide.type === 'jersey'
                    ? <AnimatedJersey onUserInteraction={handleJerseyInteraction} />
                    : <img src={slide.src} alt={slide.alt} className="hero-slide-img" />
                  }
                </div>
              ))}
            </div>
            <div className="hero-floating-card card-1">
              <span className="floating-icon"><FootballIcon size={24} color="var(--primary, #F15A24)" /></span>
              <div><strong>Nouveau</strong><small>Maillot Barça 2025</small></div>
            </div>
            <div className="hero-floating-card card-2">
              <span className="floating-icon"><FlameIcon size={24} color="#F59E0B" /></span>
              <div><strong>Arrivage</strong><small>Collection 2025–26</small></div>
            </div>
          </div>

          <div className="hero-buttons">
            <Link to="/catalogue" className="btn-primary">
              Voir la collection
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <a href="#blog" className="btn-outline-dark">Notre blog</a>
          </div>

          <div className="hero-stats">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>

          <p className="hero-description">
            Découvrez notre collection exclusive de maillots de sport authentiques.
            Des designs officiels aux éditions limitées, trouvez le maillot qui
            fera battre votre cœur de supporter.
          </p>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      <section className="featured-section" id="featured">
        <div className="container">
          <div className="section-title">
            <h2>Nouveautés &amp; Meilleures Ventes</h2>
            <p>Les maillots les plus populaires de la saison</p>
          </div>
          {loading ? (
            <div className="hp-empty-message">
              <p>Chargement des maillots…</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              <div className="products-grid">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="section-cta">
                <Link to="/catalogue" className="btn-primary">
                  Voir tous les maillots
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="hp-empty-message">
              <p>Aucun produit pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Blog ─────────────────────────────────────────────────────────── */}
      <section className="hp-blog-section" id="blog">
        <div className="container">
          <div className="section-title">
            <span className="section-eyebrow">Blog JogaLook</span>
            <h2>Dernières publications</h2>
            <p>Conseils, tendances et coulisses du monde du maillot de sport</p>
          </div>

          {loading ? (
            <div className="hp-empty-message">
              <p>Chargement des actualités…</p>
            </div>
          ) : blogPosts.length > 0 ? (
            <>
              <div className="hp-blog-grid">
                {blogPosts.map((post, i) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug || post.id}`}
                    className={`hp-blog-card ${i === 0 ? 'hp-blog-card--featured' : ''}`}
                  >
                    <div className="hp-blog-img-wrap">
                      {post.image ? (
                        <img src={post.image} alt={post.title} loading="lazy" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>📰</div>
                      )}
                      <span className="hp-blog-cat">{post.category}</span>
                    </div>
                    <div className="hp-blog-body">
                      <div className="hp-blog-meta">
                        {post.date && <span>{post.date}</span>}
                        {post.date && <span>·</span>}
                        <span>{post.readTime} de lecture</span>
                      </div>
                      <h3 className="hp-blog-title">{post.title}</h3>
                      <p className="hp-blog-excerpt">{post.excerpt}</p>
                      <span className="hp-blog-read">
                        Lire l'article
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="section-cta">
                <Link to="/blog" className="btn-outline-primary">
                  Voir tous les articles
                </Link>
              </div>
            </>
          ) : (
            <div className="hp-empty-message">
              <p>Aucune actualité pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Wholesaler (Revendeur) ────────────────────────────────────────── */}
      <section className="hp-biz-section hp-biz-section--wholesaler" id="revendeurs">
        <div className="container">
          <div className="hp-biz-inner">
            <div className="hp-biz-visual">
              <div className="hp-biz-img-stack">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=520&h=380&fit=crop"
                  alt="Boutique revendeur JogaLook"
                  className="hp-biz-img hp-biz-img--main"
                  loading="lazy"
                />
                <img
                  src="https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=260&h=200&fit=crop"
                  alt="Stock maillots revendeur"
                  className="hp-biz-img hp-biz-img--overlay"
                  loading="lazy"
                />
              </div>
              <div className="hp-biz-badge-float hp-biz-badge-float--orange">
                <span className="hp-biz-badge-val">-25%</span>
                <span className="hp-biz-badge-lbl">dès 20 pièces</span>
              </div>
            </div>

            <div className="hp-biz-content">
              <span className="section-eyebrow section-eyebrow--orange">🏪 Pour les revendeurs</span>
              <h2>Commandez en gros &amp; revendez avec profit</h2>
              <p className="hp-biz-lead">
                Vous êtes gérant d'une boutique, d'un corner sport ou d'un e-commerce ? JogaLook vous propose des tarifs préférentiels sur commandes groupées de maillots authentiques.
              </p>
              <ul className="hp-biz-list">
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#ea580c' }}>✓</span>
                  <div><strong>Tarifs dégressifs</strong> — dès 20, 50, 100 unités avec des remises croissantes</div>
                </li>
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#ea580c' }}>✓</span>
                  <div><strong>Large catalogue</strong> — Football, basketball, running et bien d'autres disciplines</div>
                </li>
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#ea580c' }}>✓</span>
                  <div><strong>Livraison rapide</strong> — Expédition sous 48 h pour les commandes validées</div>
                </li>
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#ea580c' }}>✓</span>
                  <div><strong>Accompagnement dédié</strong> — Un conseiller commercial à votre écoute</div>
                </li>
              </ul>
              <button className="hp-btn-primary hp-btn-accent-orange" onClick={() => setActiveModal('WHOLESALER')}>
                Faire une demande revendeur
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Club Partnership ──────────────────────────────────────────────── */}
      <section className="hp-biz-section hp-biz-section--club" id="clubs">
        <div className="container">
          <div className="hp-biz-inner hp-biz-inner--reverse">
            <div className="hp-biz-content">
              <span className="section-eyebrow section-eyebrow--blue">🏆 Pour les clubs sportifs</span>
              <h2>Devenez partenaire de vente JogaLook</h2>
              <p className="hp-biz-lead">
                Votre club veut proposer des maillots officiels à ses supporters ou les mettre en vente lors de matchs et événements ? Rejoignez notre réseau de clubs partenaires.
              </p>
              <ul className="hp-biz-list">
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#2563eb' }}>✓</span>
                  <div><strong>Maillots co-brandés</strong> — Votre logo + votre identité visuelle sur nos modèles</div>
                </li>
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#2563eb' }}>✓</span>
                  <div><strong>Commission attractive</strong> — Générez des revenus supplémentaires pour votre club</div>
                </li>
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#2563eb' }}>✓</span>
                  <div><strong>Page club dédiée</strong> — Boutique en ligne personnalisée pour vos membres</div>
                </li>
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#2563eb' }}>✓</span>
                  <div><strong>Support merchandising</strong> — Matériel d'affichage et communication fournis</div>
                </li>
              </ul>
              <button className="hp-btn-primary hp-btn-accent-blue" onClick={() => setActiveModal('CLUB')}>
                Proposer un partenariat
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>

            <div className="hp-biz-visual">
              <div className="hp-biz-img-stack">
                <img
                  src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=520&h=380&fit=crop"
                  alt="Club sportif partenaire JogaLook"
                  className="hp-biz-img hp-biz-img--main"
                  loading="lazy"
                />
                <img
                  src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=260&h=200&fit=crop"
                  alt="Maillots de club"
                  className="hp-biz-img hp-biz-img--overlay"
                  loading="lazy"
                />
              </div>
              <div className="hp-biz-badge-float hp-biz-badge-float--blue">
                <span className="hp-biz-badge-val">+30</span>
                <span className="hp-biz-badge-lbl">clubs partenaires</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── School / Team Bulk ────────────────────────────────────────────── */}
      <section className="hp-biz-section hp-biz-section--school" id="ecoles">
        <div className="container">
          <div className="hp-biz-inner">
            <div className="hp-biz-visual">
              <div className="hp-biz-img-stack">
                <img
                  src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=520&h=380&fit=crop"
                  alt="Équipe scolaire en maillots JogaLook"
                  className="hp-biz-img hp-biz-img--main"
                  loading="lazy"
                />
                <img
                  src="https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=260&h=200&fit=crop"
                  alt="Lot de maillots pour classe"
                  className="hp-biz-img hp-biz-img--overlay"
                  loading="lazy"
                />
              </div>
              <div className="hp-biz-badge-float hp-biz-badge-float--green">
                <span className="hp-biz-badge-val">Dès 15</span>
                <span className="hp-biz-badge-lbl">maillots / commande</span>
              </div>
            </div>

            <div className="hp-biz-content">
              <span className="section-eyebrow section-eyebrow--green">🎓 Pour les écoles &amp; équipes</span>
              <h2>Un lot complet pour votre classe ou votre équipe</h2>
              <p className="hp-biz-lead">
                Vous préparez une rentrée sportive, un tournoi inter-écoles ou une compétition régionale ? JogaLook habille vos équipes avec des maillots de qualité, personnalisés à vos couleurs.
              </p>
              <ul className="hp-biz-list">
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#16a34a' }}>✓</span>
                  <div><strong>Personnalisation complète</strong> — Numéros, noms, logo de l'établissement inclus</div>
                </li>
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#16a34a' }}>✓</span>
                  <div><strong>Tailles XS à 3XL</strong> — S'adapte à tous les gabarits, enfants comme adultes</div>
                </li>
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#16a34a' }}>✓</span>
                  <div><strong>Devis gratuit sous 24 h</strong> — Réponse rapide avec proposition tarifaire détaillée</div>
                </li>
                <li>
                  <span className="hp-biz-check" style={{ '--chk': '#16a34a' }}>✓</span>
                  <div><strong>Facturation administrative</strong> — Bon de commande et facture adaptés aux établissements</div>
                </li>
              </ul>
              <button className="hp-btn-primary hp-btn-accent-green" onClick={() => setActiveModal('SCHOOL')}>
                Demander un devis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────────────── */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <h4>Livraison Rapide</h4>
              <p>Expédié en 24–48 h</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h4>Paiement Sécurisé</h4>
              <p>Transactions 100% protégées</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <h4>Retours Faciles</h4>
              <p>Sous 30 jours</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h4>Support 24/7</h4>
              <p>À votre écoute</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── Contact Modal ─────────────────────────────────────────────────── */}
      <ContactModal
        config={activeModal ? MODAL_CONFIGS[activeModal] : null}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}

export default HomePage;