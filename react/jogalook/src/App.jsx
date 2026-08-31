import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import SearchPage from './pages/SearchPage';
import CustomPage from './pages/CustomPage';
import CustomEditorPage from './pages/CustomEditorPage';
import ProductDetailPage from './pages/ProductDetailPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
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
import {
  AdminShops, AdminSuppliers, AdminCategories,
  AdminVariants, AdminPayments, AdminDeliveries,
  AdminCarts, AdminCustomizations, AdminLogs,
} from './pages/admin/AdminPages';
import CartPage from './pages/CartPage';
import FloatingCart from './components/FloatingCart';
import './App.css';

// ── Garde : redirige vers /admin/login (si admin) ou /login (si client) ──────
function RequireAuth({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E9ECEF', borderTopColor: '#F15A24', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin/login" state={{ error: "Accès refusé : Ce compte ne dispose pas des privilèges administrateur." }} replace />;
  }

  return children;
}

// ── Redirige si déjà connecté (pages login/register clients) ─────────────────
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppShell() {
  const location = useLocation();
  const showFloatingCart = ['/', '/catalogue'].includes(location.pathname);

  return (
    <>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"                  element={<CatalogPage />} />
        <Route path="/catalogue"         element={<CatalogPage />} />
        <Route path="/recherche"         element={<SearchPage />} />
        <Route path="/catalogue/:id"     element={<ProductDetailPage />} />
        <Route path="/custom"            element={<CustomPage />} />
        <Route path="/custom/:id"        element={<CustomEditorPage />} />
        <Route path="/actualites"        element={<NewsPage />} />
        <Route path="/actualites/:id"    element={<NewsDetailPage />} />
        <Route path="/actus"             element={<Navigate to="/actualites" replace />} />
        <Route path="/panier"            element={<CartPage />} />
        <Route path="/cart"              element={<Navigate to="/panier" replace />} />

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