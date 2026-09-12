import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { SearchIcon } from '../components/icons/AppIcons';
import './CategoryGroupPage.css';

function GroupSkeleton() {
  return (
    <div className="catalog-grid catalog-grid--skeleton" aria-label="Chargement des produits du groupe">
      {Array.from({ length: 8 }, (_, index) => (
        <div className="catalog-skeleton-card" key={index}>
          <div className="catalog-skeleton-image" />
          <div className="catalog-skeleton-line catalog-skeleton-line--title" />
          <div className="catalog-skeleton-line catalog-skeleton-line--meta" />
          <div className="catalog-skeleton-line catalog-skeleton-line--price" />
        </div>
      ))}
    </div>
  );
}

export default function CategoryGroupPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [group, setGroup] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Tous']);
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronisation avec l'URL paramètre de catégorie
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    } else {
      setActiveCategory('Tous');
    }
  }, [categoryParam]);

  // Chargement des données du groupe et de ses produits
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/category-groups/${slug}?include_products=true`)
      .then((res) => {
        if (!res.ok && res.status === 404) {
          throw new Error('Univers ou groupe de catégories introuvable.');
        }
        return res.json();
      })
      .then((json) => {
        if (!isMounted) return;
        if (!json.success || !json.data) {
          throw new Error(json.message || 'Impossible de charger ce groupe.');
        }

        const groupData = json.data;
        setGroup(groupData);

        // Normaliser les produits pour le ProductCard
        const mappedProducts = (groupData.products || [])
          .filter((p) => p.is_active !== false)
          .map((product) => {
            const categoryName = product.categories?.name || product.category_name || 'Autre';
            const colors = Array.from(
              new Set((product.product_variants || []).map((v) => v.color_hex).filter(Boolean))
            );

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
              product_variants: product.product_variants || [],
              product_images: product.product_images || [],
            };
          });

        setProducts(mappedProducts);

        const groupCats = (groupData.categories || []).map((c) => c.name).filter(Boolean);
        setCategories(['Tous', ...new Set(groupCats)]);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Filtrage par sous-catégorie et par recherche
  let filtered = products;

  if (activeCategory !== 'Tous') {
    filtered = filtered.filter((product) => product.category === activeCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (product) =>
        (product.name || '').toLowerCase().includes(q) ||
        (product.team || '').toLowerCase().includes(q) ||
        (product.category || '').toLowerCase().includes(q)
    );
  }

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    if (cat === 'Tous') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  return (
    <>
      <Navbar />

      <main className="group-page">
        <div className="container">
          {/* ── Fil d'Ariane ── */}
          <nav className="group-breadcrumbs" aria-label="Fil d'Ariane">
            <Link to="/">Accueil</Link>
            <span className="group-breadcrumbs__sep">/</span>
            <Link to="/catalogue">Catalogue</Link>
            <span className="group-breadcrumbs__sep">/</span>
            <span className="group-breadcrumbs__current">{group?.name || slug}</span>
          </nav>

          {/* ── En-tête / Bannière du Groupe ── */}
          <header className="group-header">
            <div className="group-header__content">
              <span className="group-header__badge">Univers</span>
              <h1 className="group-header__title">{group?.name || slug}</h1>
              {group?.description && (
                <p className="group-header__desc">{group.description}</p>
              )}
            </div>
            {!loading && !error && (
              <div className="group-header__count">
                <strong>{filtered.length}</strong>
                <span>produit{filtered.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </header>

          {/* ── Barre d'outils & Filtres ── */}
          {!error && (
            <div className="group-toolbar">
              <div className="search-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder={`Rechercher dans ${group?.name || 'ce groupe'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Chips des sous-catégories du groupe */}
              {categories.length > 1 && (
                <div className="group-chips">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => handleSelectCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Contenu / Grille Produits ── */}
          {loading ? (
            <GroupSkeleton />
          ) : error ? (
            <div className="catalog-empty">
              <span className="empty-icon"><SearchIcon size={44} color="#EF4444" /></span>
              <h3>Oups, cet univers est introuvable</h3>
              <p>{error}</p>
              <Link to="/catalogue" className="admin-btn admin-btn--primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
                Retourner au catalogue complet
              </Link>
            </div>
          ) : filtered.length > 0 ? (
            <div className="catalog-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <span className="empty-icon"><SearchIcon size={44} color="#94A3B8" /></span>
              <h3>Aucun produit trouvé</h3>
              <p>
                {searchQuery || activeCategory !== 'Tous'
                  ? 'Essayez de modifier vos filtres ou termes de recherche.'
                  : `Aucun produit n'a encore été rattaché aux catégories de ${group?.name || 'ce groupe'}.`}
              </p>
              {(searchQuery || activeCategory !== 'Tous') && (
                <button
                  type="button"
                  className="filter-chip active"
                  style={{ marginTop: '12px' }}
                  onClick={() => {
                    setActiveCategory('Tous');
                    setSearchQuery('');
                    setSearchParams({});
                  }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
