import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import SearchPage from './pages/SearchPage';
import CustomPage from './pages/CustomPage';
import CustomEditorPage from './pages/CustomEditorPage';
import ProductDetailPage from './pages/ProductDetailPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import ContactPage from './pages/ContactPage';
import { LoginPage, RegisterPage } from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTemplates from './pages/admin/AdminTemplates';
import AdminSportsNews from './pages/admin/AdminSportsNews';
import AdminKeywords from './pages/admin/AdminKeywords';
import AdminCategoryGroups from './pages/admin/AdminCategoryGroups';
import {
  AdminShops, AdminSuppliers, AdminCategories,
  AdminVariants, AdminPayments, AdminDeliveries,
  AdminCarts, AdminCustomizations, AdminLogs,
} from './pages/admin/AdminPages';
import CartPage from './pages/CartPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import CategoryGroupPage from './pages/CategoryGroupPage';
import PartnershipPage from './pages/PartnershipPage';
import MerchantSpace from './pages/merchant/MerchantSpace';
import FloatingCart from './components/FloatingCart';
import { clearStoreContext, getStoreContext, setStoreContext } from './utils/storeContext';
import './App.css';

// ── Garde : redirige vers /admin/login (si admin) ou /login (si client) ──────
function RequireAuth({ children, adminOnly = false, merchantOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-loading-skeleton" aria-label="Chargement de la page">
        <div className="app-loading-skeleton__nav" />
        <div className="app-loading-skeleton__content">
          <div className="app-loading-skeleton__line app-loading-skeleton__line--wide" />
          <div className="app-loading-skeleton__line app-loading-skeleton__line--medium" />
          <div className="app-loading-skeleton__grid">
            {Array.from({ length: 6 }, (_, index) => <div className="app-loading-skeleton__card" key={index} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} state={{ from: location.pathname + location.search }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin/login" state={{ error: "Accès refusé : Ce compte ne dispose pas des privilèges administrateur." }} replace />;
  }

  if (merchantOnly && user.role !== 'SHOP_OWNER') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ── Redirige si déjà connecté (pages login/register clients) ─────────────────
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (user) {
    const from = location.state?.from || '/';
    return <Navigate to={from} replace />;
  }
  return children;
}

function AppShell() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const reservedFirstSegments = new Set(['admin', 'boutiquier', 'catalogue', 'groupe', 'partenariat', 'accueil', 'home', 'recherche', 'p', 'custom', 'actualites', 'actus', 'contact', 'panier', 'cart', 'mes-commandes', 'profil', 'profile', 'login', 'register', 'auth', 'boutique']);
  const storefrontSlug = pathSegments.length === 1 && !reservedFirstSegments.has(pathSegments[0]) ? pathSegments[0] : '';
  const searchStoreSlug = location.pathname === '/recherche' ? new URLSearchParams(location.search).get('shop') : '';
  const nestedStoreSlug = pathSegments[0] === 'boutique' && pathSegments.length === 4 ? pathSegments[1] : '';
  const classicCatalogPath = ['/', '/catalogue', '/accueil', '/home'].includes(location.pathname);

  useEffect(() => {
    if (storefrontSlug) setStoreContext(storefrontSlug);
    else if (nestedStoreSlug) setStoreContext(nestedStoreSlug);
    else if (searchStoreSlug) setStoreContext(searchStoreSlug);
    else if (classicCatalogPath) clearStoreContext();
  }, [storefrontSlug, nestedStoreSlug, searchStoreSlug, classicCatalogPath]);

  const hasStoreContext = Boolean(storefrontSlug || nestedStoreSlug || searchStoreSlug || getStoreContext());
  const storeProductPage = hasStoreContext && ((pathSegments[0] === 'p' || pathSegments[0] === 'catalogue') && pathSegments.length === 2 || nestedStoreSlug);
  const storeSearchPage = hasStoreContext && pathSegments[0] === 'recherche';
  const showFloatingCart = ['/', '/catalogue', '/accueil'].includes(location.pathname)
    || location.pathname.startsWith('/groupe')
    || Boolean(storefrontSlug)
    || storeProductPage
    || storeSearchPage;

  return (
    <>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"                  element={<CatalogPage />} />
        <Route path="/catalogue"         element={<CatalogPage />} />
        <Route path="/groupe/:slug"      element={<CategoryGroupPage />} />
        <Route path="/partenariat"       element={<PartnershipPage />} />
        <Route path="/accueil"           element={<HomePage />} />
        <Route path="/home"              element={<Navigate to="/accueil" replace />} />
        <Route path="/recherche"         element={<SearchPage />} />
        <Route path="/catalogue/:id"     element={<ProductDetailPage />} />
        <Route path="/p/:id"            element={<ProductDetailPage />} />
        <Route path="/boutique/:shopSlug/produit/:id" element={<ProductDetailPage />} />
        <Route path="/:shopSlug"         element={<CatalogPage standalone />} />
        <Route path="/custom"            element={<CustomPage />} />
        <Route path="/custom/:id"        element={<CustomEditorPage />} />
        <Route path="/actualites"        element={<NewsPage />} />
        <Route path="/actualites/:id"    element={<NewsDetailPage />} />
        <Route path="/actus"             element={<Navigate to="/actualites" replace />} />
        <Route path="/contact"           element={<ContactPage />} />
        <Route path="/panier"            element={<CartPage />} />
        <Route path="/cart"              element={<Navigate to="/panier" replace />} />
        <Route path="/mes-commandes"     element={<RequireAuth><MyOrdersPage /></RequireAuth>} />
        <Route path="/profil"            element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/profile"           element={<Navigate to="/profil" replace />} />
        <Route path="/boutiquier" element={<RequireAuth merchantOnly><MerchantSpace /></RequireAuth>} />

        {/* ── Auth Client ── */}
        <Route path="/login"         element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register"      element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* ── Auth Admin Dédiée ── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ── Espace Administration Protégé ── */}
        <Route
          path="/admin"
          element={
            <RequireAuth adminOnly>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index                   element={<AdminDashboard />} />
          <Route path="produits"         element={<AdminProducts />} />
          <Route path="variantes"        element={<AdminVariants />} />
          <Route path="categories"       element={<AdminCategories />} />
          <Route path="groupes-categories" element={<AdminCategoryGroups />} />
          <Route path="templates"        element={<AdminTemplates />} />
          <Route path="personnalisations" element={<AdminCustomizations />} />
          <Route path="mots-cles"         element={<AdminKeywords />} />
          <Route path="commandes"        element={<AdminOrders />} />
          <Route path="paniers"          element={<AdminCarts />} />
          <Route path="paiements"        element={<AdminPayments />} />
          <Route path="livraisons"       element={<AdminDeliveries />} />
          <Route path="utilisateurs"     element={<AdminUsers />} />
          <Route path="boutiques"        element={<AdminShops />} />
          <Route path="fournisseurs"     element={<AdminSuppliers />} />
          <Route path="actualites"       element={<AdminSportsNews />} />
          <Route path="logs"             element={<AdminLogs />} />
        </Route>

        {/* ── Page 404 Hors-Jeu ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {showFloatingCart && <FloatingCart />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
