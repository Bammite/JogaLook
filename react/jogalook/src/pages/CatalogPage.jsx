import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { SearchIcon } from '../components/icons/AppIcons';
import './CatalogPage.css';

const fallbackProducts = [
  { id: 'fallback-1', name: 'Maillot Domicile 2025', team: 'Collection sport', price: 89.99, image: 'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=400&h=500&fit=crop', badge: { type: 'new', text: 'Nouveau' }, colors: ['#A50044', '#004D98', '#FFED02'], category: 'Football' },
  { id: 'fallback-2', name: 'Maillot Extérieur 2025', team: 'Collection sport', price: 94.99, image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=500&fit=crop', badge: { type: 'hot', text: 'Best-seller' }, colors: ['#FFFFFF', '#004170', '#DA291C'], category: 'Football' },
];

function CatalogSkeleton() {
  return (
    <div className="catalog-grid catalog-grid--skeleton" aria-label="Chargement du catalogue">
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

function CatalogPage() {
  const [products, setProducts] = useState(fallbackProducts);
  const [categories, setCategories] = useState(['Tous']);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products?limit=100'),
          fetch('/api/categories'),
        ]);

        const productsJson = await productsRes.json();
        const categoriesJson = await categoriesRes.json();

        const realProducts = (productsJson.data || []).filter((p) => p.is_active !== false).map((product) => {
          const categoryName = product.categories?.name || product.category_name || 'Autre';
          const colors = Array.from(
            new Set((product.product_variants || []).map((variant) => variant.color_hex).filter(Boolean))
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

        const realCategories = (categoriesJson.data || []).map((category) => category.name).filter(Boolean);

        setProducts(realProducts.length ? realProducts : fallbackProducts);
        setCategories(['Tous', ...new Set(realCategories)]);
      } catch (error) {
        setProducts(fallbackProducts);
        setCategories(['Tous', 'Football']);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, []);

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

  return (
    <>
      <Navbar />
      <section className="catalog-page">
        <div className="container">
          <div className="catalog-toolbar">
            <div className="search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="catalog-filters">
            <div className="filter-group">
              <div className="filter-chips">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <CatalogSkeleton />
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
              <p>Essayez de modifier vos filtres ou votre recherche.</p>
              <button className="btn-primary" onClick={() => { setActiveCategory('Tous'); setSearchQuery(''); }}>
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

export default CatalogPage;