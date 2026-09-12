import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { SearchIcon } from '../components/icons/AppIcons';
import './CatalogPage.css';

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

function mapProduct(product) {
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
}

function mergeProducts(currentProducts, newProducts) {
  const ids = new Set(currentProducts.map((product) => product.id));
  return [...currentProducts, ...newProducts.filter((product) => !ids.has(product.id))];
}

async function fetchProductsPage(limit, offset, { signal, categoryId } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (categoryId) params.set('category_id', categoryId);

  const response = await fetch(`/api/products?${params}`, { signal });
  if (!response.ok) throw new Error('Impossible de charger les produits');

  const json = await response.json();
  if (!json.success) throw new Error(json.message || 'Impossible de charger les produits');

  const data = json.data || [];
  return {
    products: data.filter((product) => product.is_active !== false).map(mapProduct),
    nextOffset: json.pagination?.next_offset ?? offset + data.length,
    hasMore: json.pagination?.has_more ?? data.length === limit,
  };
}

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: null, name: 'Tous' }]);
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoryInitialLoading, setCategoryInitialLoading] = useState(false);
  const [allPage, setAllPage] = useState({ nextOffset: 0, hasMore: false });
  const [categoryPages, setCategoryPages] = useState({});
  const [loadingBackgroundScopes, setLoadingBackgroundScopes] = useState({});
  const [loadingMoreScope, setLoadingMoreScope] = useState(null);
  const isMounted = useRef(true);
  const productsRef = useRef([]);
  const categoryPagesRef = useRef({});

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const updateCategoryPage = (categoryId, page) => {
    categoryPagesRef.current = { ...categoryPagesRef.current, [categoryId]: page };
    setCategoryPages(categoryPagesRef.current);
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    } else {
      setActiveCategory('Tous');
    }
  }, [categoryParam]);

  useEffect(() => {
    const controller = new AbortController();
    let backgroundTimer;
    let cancelled = false;

    const loadCatalog = async () => {
      setLoading(true);
      setCategoryInitialLoading(false);
      setLoadingBackgroundScopes({});
      setLoadingMoreScope(null);
      setProducts([]);
      productsRef.current = [];
      setAllPage({ nextOffset: 0, hasMore: false });
      categoryPagesRef.current = {};
      setCategoryPages({});

      try {
        // Les catégories ne doivent pas retarder l'affichage des 8 premiers produits.
        void fetch('/api/categories', { signal: controller.signal })
          .then((response) => response.ok ? response.json() : Promise.reject())
          .then((json) => {
            if (cancelled) return;
            const realCategories = (json.data || [])
              .filter((category) => category.id && category.name)
              .map((category) => ({ id: category.id, name: category.name }));
            setCategories([{ id: null, name: 'Tous' }, ...realCategories]);
          })
          .catch(() => {
            if (!cancelled) setCategories([{ id: null, name: 'Tous' }]);
          });

        // 1. Priorité au premier écran : seulement 8 produits.
        const firstPage = await fetchProductsPage(8, 0, { signal: controller.signal });
        if (cancelled) return;

        setProducts(firstPage.products);
        productsRef.current = firstPage.products;
        setAllPage({ nextOffset: firstPage.nextOffset, hasMore: firstPage.hasMore });
        setLoading(false);

        // 2. Une deuxième page est ensuite récupérée en arrière-plan, sans bloquer le rendu.
        if (firstPage.hasMore) {
          setLoadingBackgroundScopes((scopes) => ({ ...scopes, all: true }));
          backgroundTimer = window.setTimeout(async () => {
            try {
              const secondPage = await fetchProductsPage(32, firstPage.nextOffset, { signal: controller.signal });
              if (cancelled) return;

              setProducts((currentProducts) => {
                const mergedProducts = mergeProducts(currentProducts, secondPage.products);
                productsRef.current = mergedProducts;
                return mergedProducts;
              });
              setAllPage({ nextOffset: secondPage.nextOffset, hasMore: secondPage.hasMore });
            } catch (error) {
              if (error.name !== 'AbortError' && !cancelled) {
                setAllPage((page) => ({ ...page, hasMore: false }));
              }
            } finally {
              if (!cancelled) {
                setLoadingBackgroundScopes((scopes) => ({ ...scopes, all: false }));
              }
            }
          }, 0);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && !cancelled) {
          setProducts([]);
          setCategories([{ id: null, name: 'Tous' }]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCatalog();

    return () => {
      cancelled = true;
      window.clearTimeout(backgroundTimer);
      controller.abort();
    };
  }, []);

  const selectedCategory = categories.find((category) => category.name === activeCategory);
  const activeScope = activeCategory === 'Tous' ? 'all' : selectedCategory?.id;
  const activePage = activeCategory === 'Tous'
    ? allPage
    : (selectedCategory ? categoryPages[selectedCategory.id] : null);
  const loadingBackground = Boolean(activeScope && loadingBackgroundScopes[activeScope]);
  const loadingMore = loadingMoreScope === activeScope;

  useEffect(() => {
    if (loading || activeCategory === 'Tous') {
      setCategoryInitialLoading(false);
      return undefined;
    }

    const category = categories.find((item) => item.name === activeCategory);
    if (!category?.id || categoryPagesRef.current[category.id]) return undefined;

    const controller = new AbortController();
    const requestKey = category.id;
    let cancelled = false;
    let backgroundTimer;

    const loadCategory = async () => {
      const cachedProducts = productsRef.current.filter((product) => product.category === category.name);
      const hasCachedProducts = cachedProducts.length > 0;

      // La catégorie est visible immédiatement si elle existe déjà dans « Tous ».
      setCategoryInitialLoading(!hasCachedProducts);
      setLoadingBackgroundScopes((scopes) => ({ ...scopes, [requestKey]: hasCachedProducts }));

      try {
        if (hasCachedProducts) {
          // Premier passage : compléter le cache de la catégorie avec 30 produits.
          const page = await fetchProductsPage(30, 0, { signal: controller.signal, categoryId: category.id });
          if (cancelled) return;

          setProducts((currentProducts) => {
            const mergedProducts = mergeProducts(currentProducts, page.products);
            productsRef.current = mergedProducts;
            return mergedProducts;
          });
          updateCategoryPage(category.id, { nextOffset: page.nextOffset, hasMore: page.hasMore });
          return;
        }

        // Aucune donnée de cette catégorie n'est encore en mémoire : 8, puis 32 en arrière-plan.
        const firstPage = await fetchProductsPage(8, 0, { signal: controller.signal, categoryId: category.id });
        if (cancelled) return;

        setProducts((currentProducts) => {
          const mergedProducts = mergeProducts(currentProducts, firstPage.products);
          productsRef.current = mergedProducts;
          return mergedProducts;
        });
        updateCategoryPage(category.id, { nextOffset: firstPage.nextOffset, hasMore: firstPage.hasMore });
        setCategoryInitialLoading(false);

        if (firstPage.hasMore) {
          setLoadingBackgroundScopes((scopes) => ({ ...scopes, [requestKey]: true }));
          backgroundTimer = window.setTimeout(async () => {
            try {
              const secondPage = await fetchProductsPage(32, firstPage.nextOffset, { signal: controller.signal, categoryId: category.id });
              if (cancelled) return;

              setProducts((currentProducts) => {
                const mergedProducts = mergeProducts(currentProducts, secondPage.products);
                productsRef.current = mergedProducts;
                return mergedProducts;
              });
              updateCategoryPage(category.id, { nextOffset: secondPage.nextOffset, hasMore: secondPage.hasMore });
            } finally {
              if (!cancelled) {
                setLoadingBackgroundScopes((scopes) => ({ ...scopes, [requestKey]: false }));
              }
            }
          }, 0);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && !cancelled) {
          setCategoryInitialLoading(false);
        }
      } finally {
        if (!cancelled && !hasCachedProducts) {
          setCategoryInitialLoading(false);
        }
        if (!cancelled && (hasCachedProducts || !backgroundTimer)) {
          setLoadingBackgroundScopes((scopes) => ({ ...scopes, [requestKey]: false }));
        }
      }
    };

    loadCategory();

    return () => {
      cancelled = true;
      window.clearTimeout(backgroundTimer);
      controller.abort();
    };
  }, [activeCategory, categories, loading]);

  const loadMoreProducts = async () => {
    if (!activeScope || loadingMore || loadingBackground || !activePage?.hasMore) return;

    setLoadingMoreScope(activeScope);
    try {
      // 3. Chaque clic charge 40 produits supplémentaires.
      const page = await fetchProductsPage(40, activePage.nextOffset, {
        categoryId: activeCategory === 'Tous' ? undefined : selectedCategory.id,
      });
      if (!isMounted.current) return;

      setProducts((currentProducts) => {
        const mergedProducts = mergeProducts(currentProducts, page.products);
        productsRef.current = mergedProducts;
        return mergedProducts;
      });
      if (activeCategory === 'Tous') {
        setAllPage({ nextOffset: page.nextOffset, hasMore: page.hasMore });
      } else {
        updateCategoryPage(selectedCategory.id, { nextOffset: page.nextOffset, hasMore: page.hasMore });
      }
    } catch {
      // Conserver le bouton afin de permettre une nouvelle tentative.
    } finally {
      if (isMounted.current) setLoadingMoreScope(null);
    }
  };

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
                    key={cat.id || cat.name}
                    className={`filter-chip ${activeCategory === cat.name ? 'active' : ''}`}
                    onClick={() => {
                      setActiveCategory(cat.name);
                      if (cat.name === 'Tous') {
                        setSearchParams({});
                      } else {
                        setSearchParams({ category: cat.name });
                      }
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading || categoryInitialLoading ? (
            <CatalogSkeleton />
          ) : filtered.length > 0 ? (
            <div className="catalog-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="catalog-empty">
              <span className="empty-icon"><SearchIcon size={44} color="#94A3B8" /></span>
              <h3>Aucun produit pour le moment</h3>
              <p>Le catalogue sera bientôt mis à jour avec nos nouveaux maillots et équipements.</p>
            </div>
          ) : (
            <div className="catalog-empty">
              <span className="empty-icon"><SearchIcon size={44} color="#94A3B8" /></span>
              <h3>Aucun résultat trouvé</h3>
              <p>Essayez de modifier vos filtres ou votre recherche.</p>
              <button className="btn-primary" onClick={() => { setActiveCategory('Tous'); setSearchQuery(''); }}>
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {!loading && !categoryInitialLoading && products.length > 0 && (activePage?.hasMore || loadingBackground) && (
            <div className="catalog-load-more">
              <button
                type="button"
                className="catalog-load-more__button"
                onClick={loadMoreProducts}
                disabled={loadingBackground || loadingMore}
              >
                {loadingBackground || loadingMore ? 'Chargement…' : 'Voir plus'}
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
