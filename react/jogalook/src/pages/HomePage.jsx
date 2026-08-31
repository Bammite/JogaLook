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
  BoltIcon,
  FlameIcon,
} from '../components/icons/AppIcons';
import hero1Img from '../assets/hero/Hero1.png';
import hero3Img from '../assets/hero/Hero3.png';
import hero4Img from '../assets/hero/Hero4.png';
import './HomePage.css';

const HERO_SLIDES = [
  { id: 'hero1', type: 'image', src: hero1Img, duration: 3000, alt: 'Équipement JogaLook 1' },
  { id: 'jersey', type: 'jersey', duration: 7000 },
  { id: 'hero3', type: 'image', src: hero3Img, duration: 3000, alt: 'Équipement JogaLook 3' },
  { id: 'hero4', type: 'image', src: hero4Img, duration: 3000, alt: 'Équipement JogaLook 4' },
];

const fallbackCategories = [
  { name: 'Football', icon: <FootballIcon size={36} />, count: 245, color: '#e63946' },
  { name: 'Basketball', icon: <BasketballIcon size={36} />, count: 89, color: '#f4a261' },
  { name: 'Rugby', icon: <RugbyIcon size={36} />, count: 56, color: '#2a9d8f' },
  { name: 'Running', icon: <RunningIcon size={36} />, count: 134, color: '#264653' },
  { name: 'Tennis', icon: <TennisIcon size={36} />, count: 42, color: '#e9c46a' },
  { name: 'Training', icon: <FitnessIcon size={36} />, count: 78, color: '#6d6875' },
];

const SPORT_ICONS = [
  <FootballIcon size={36} />,
  <BasketballIcon size={36} />,
  <RugbyIcon size={36} />,
  <RunningIcon size={36} />,
  <TennisIcon size={36} />,
  <FitnessIcon size={36} />
];

const fallbackProducts = [
  { id: 1, name: 'Maillot Domicile 2025', team: 'FC Barcelone', price: 99.99, oldPrice: 119.99, image: 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=400&h=500&fit=crop', badge: { type: 'sale', text: '-17%' }, colors: ['#A50044', '#004D98', '#FFED02'], category: 'Football' },
  { id: 2, name: 'Maillot Extérieur 2025', team: 'Paris Saint-Germain', price: 109.99, image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=400&h=500&fit=crop', badge: { type: 'new', text: 'Nouveau' }, colors: ['#FFFFFF', '#004170', '#DA291C'], category: 'Football' },
  { id: 3, name: 'Maillot Third 2025', team: 'Manchester City', price: 94.99, oldPrice: 109.99, image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=500&fit=crop', badge: { type: 'hot', text: 'Best-seller' }, colors: ['#6CABDD', '#1C2C5B', '#FFC659'], category: 'Football' },
  { id: 4, name: 'Maillot Domicile 2025', team: 'Juventus FC', price: 89.99, image: 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=400&h=500&fit=crop', badge: { type: 'new', text: 'Nouveau' }, colors: ['#000000', '#FFFFFF', '#D3D3D3'], category: 'Football' },
  { id: 5, name: 'Maillot Domicile 2025', team: 'Bayern Munich', price: 99.99, image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=500&fit=crop', badge: { type: 'sale', text: '-10%' }, colors: ['#DC052D', '#FFFFFF', '#0066B2'], category: 'Football' },
  { id: 6, name: 'Maillot Extérieur 2025', team: 'AC Milan', price: 104.99, oldPrice: 119.99, image: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=400&h=500&fit=crop', badge: { type: 'sale', text: '-13%' }, colors: ['#FFFFFF', '#FB090B', '#000000'], category: 'Football' },
  { id: 7, name: 'Maillot Domicile 2025', team: 'Liverpool FC', price: 99.99, image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=500&fit=crop', badge: { type: 'hot', text: 'Populaire' }, colors: ['#C8102E', '#00B2A9', '#FFFFFF'], category: 'Football' },
  { id: 8, name: 'Maillot Third 2025', team: 'Arsenal FC', price: 94.99, image: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&h=500&fit=crop', badge: { type: 'new', text: 'Nouveau' }, colors: ['#EF0107', '#FFFFFF', '#063672'], category: 'Football' },
];

const stats = [
  { value: '10K+', label: 'Clients satisfaits' },
  { value: '500+', label: 'Maillots disponibles' },
  { value: '98%', label: 'Avis positifs' },
  { value: '24/7', label: 'Service client' },
];

function HomePage() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState(fallbackProducts);
  const [categories, setCategories] = useState(fallbackCategories);

  useEffect(() => {
    const currentSlide = HERO_SLIDES[currentSlideIndex];
    const timer = setTimeout(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, currentSlide.duration);

    return () => clearTimeout(timer);
  }, [currentSlideIndex, resetKey]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products?limit=8'),
          fetch('/api/categories'),
        ]);

        const productsJson = await productsRes.json();
        const categoriesJson = await categoriesRes.json();

        const mappedProducts = (productsJson.data || []).filter((p) => p.is_active !== false).slice(0, 8).map((product) => {
          const categoryName = product.categories?.name || product.category_name || 'Autre';
          const colors = Array.from(new Set((product.product_variants || []).map((variant) => variant.color_hex).filter(Boolean)));

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

        const mappedCategories = (categoriesJson.data || []).slice(0, 6).map((category, index) => ({
          name: category.name,
          icon: SPORT_ICONS[index % SPORT_ICONS.length],
          count: 42 + index * 12,
          color: ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#e9c46a', '#6d6875'][index % 6],
        }));

        if (mappedProducts.length) setFeaturedProducts(mappedProducts);
        if (mappedCategories.length) setCategories(mappedCategories);
      } catch (error) {
        setFeaturedProducts(fallbackProducts);
        setCategories(fallbackCategories);
      }
    };

    loadHomeData();
  }, []);

  const handleJerseyInteraction = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="container hero-content">

          <h1 className="hero-title">
            Portez la passion,<br />
            <span className="hero-highlight">vivez le jeu</span>
          </h1>

          <div className="hero-image">
            <div className="hero-image-bg"></div>

            {/* Hero Carousel Slides */}
            <div className="hero-carousel-container">
              {HERO_SLIDES.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`hero-carousel-slide ${idx === currentSlideIndex ? 'active' : ''}`}
                >
                  {slide.type === 'jersey' ? (
                    <AnimatedJersey onUserInteraction={handleJerseyInteraction} />
                  ) : (
                    <img src={slide.src} alt={slide.alt} className="hero-slide-img" />
                  )}
                </div>
              ))}
            </div>

            <div className="hero-floating-card card-1">
              <span className="floating-icon">
                <FootballIcon size={24} color="var(--primary, #F15A24)" />
              </span>
              <div>
                <strong>Nouveau</strong>
                <small>Maillot Barça 2025</small>
              </div>
            </div>
            <div className="hero-floating-card card-2">
              <span className="floating-icon">
                <FlameIcon size={24} color="#F59E0B" />
              </span>
              <div>
                <strong>-30%</strong>
                <small>Offre flash</small>
              </div>
            </div>
          </div>

          <div className="hero-buttons">
            <Link to="/catalogue" className="btn-primary">
              Voir la collection
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <a href="#promo" className="btn-outline-dark">Promotions</a>
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

      {/* Categories Section */}
      {/* <section className="categories-section" id="categories">
        <div className="container">
          <div className="section-title">
            <h2>Nos Catégories</h2>
            <p>Choisissez votre sport et trouvez le maillot parfait</p>
          </div>
          <div className="categories-grid">
            {categories.map((cat, i) => (
              <Link to="/catalogue" key={i} className="category-card" style={{ '--cat-color': cat.color }}>
                <span className="category-icon">{cat.icon}</span>
                <h3>{cat.name}</h3>
                <span className="category-count">{cat.count} articles</span>
              </Link>
            ))}
          </div>
        </div>
      </section> */}

      {/* Featured Products Section */}
      <section className="featured-section" id="featured">
        <div className="container">
          <div className="section-title">
            <h2>Nouveautés & Meilleures Ventes</h2>
            <p>Les maillots les plus populaires de la saison</p>
          </div>
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="section-cta">
            <Link to="/catalogue" className="btn-primary">
              Voir tous les maillots
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Promo Banner Section */}
      <section className="promo-section" id="promo">
        <div className="container">
          <div className="promo-banner">
            <div className="promo-content">
              <span className="promo-badge">
                <BoltIcon size={14} /> Offre limitée
              </span>
              <h2>Jusqu'à <span className="promo-highlight">-40%</span> sur les maillots 2024</h2>
              <p>
                Profitez de réductions exceptionnelles sur notre collection de la saison passée.
                Des maillots authentiques à prix réduits, c'est le moment d'en profiter !
              </p>
              <div className="promo-timer">
                <div className="timer-block">
                  <span className="timer-value">08</span>
                  <span className="timer-label">Jours</span>
                </div>
                <span className="timer-separator">:</span>
                <div className="timer-block">
                  <span className="timer-value">14</span>
                  <span className="timer-label">Heures</span>
                </div>
                <span className="timer-separator">:</span>
                <div className="timer-block">
                  <span className="timer-value">32</span>
                  <span className="timer-label">Min</span>
                </div>
                <span className="timer-separator">:</span>
                <div className="timer-block">
                  <span className="timer-value">07</span>
                  <span className="timer-label">Sec</span>
                </div>
              </div>
              <a href="#" className="btn-primary promo-btn">
                Voir les promos
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
            </div>
            <div className="promo-visual">
              <div className="promo-circle">
                <span className="promo-percent">-40%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <h4>Livraison Gratuite</h4>
              <p>Dès 50€ d'achat</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h4>Paiement Sécurisé</h4>
              <p>Transactions 100% protégées</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h4>Retours Faciles</h4>
              <p>Sous 30 jours</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p>À votre écoute</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default HomePage;