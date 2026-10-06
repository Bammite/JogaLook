import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MerchantSpace.css';

const SECTIONS = [
  { id: 'products', label: 'Mes produits', icon: '▣' },
  { id: 'orders', label: 'Commandes', icon: '▤' },
  { id: 'home', label: 'Accueil', icon: '⌂' },
  { id: 'profile', label: 'Mon profil', icon: '○' },
];

const EMPTY_PRODUCT = { name: '', category_id: '', base_price: '', image_url: '', images: [], description: '', stock_quantity: 1 };
const AUTH_KEY = 'jogalook-token';

function money(value) {
  return `${Math.round(Number(value) || 0).toLocaleString('fr-FR')} FCFA`;
}

function productUrl(product) {
  return `${window.location.origin}/catalogue/${product.slug || product.id}`;
}

export default function MerchantSpace() {
  const { user, token, logout, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('products');
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token || localStorage.getItem(AUTH_KEY) || ''}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'Une erreur est survenue.');
    return json;
  }, [token]);

  const loadBaseData = useCallback(async () => {
    setLoading(true);
    setError('');
    const [overviewResult, productsResult, categoriesResult] = await Promise.allSettled([
      request('/api/merchant/overview'),
      request('/api/merchant/products?limit=500'),
      fetch('/api/categories').then(async (response) => {
        if (!response.ok) throw new Error('Impossible de charger les catégories.');
        const json = await response.json();
        if (!json.success) throw new Error(json.message || 'Impossible de charger les catégories.');
        return json;
      }),
    ]);

    if (categoriesResult.status === 'fulfilled') {
      setCategories(categoriesResult.value.data || []);
    } else {
      setCategories([]);
      setError(categoriesResult.reason?.message || 'Impossible de charger les catégories.');
    }

    try {
      if (overviewResult.status === 'rejected') throw overviewResult.reason;
      if (productsResult.status === 'rejected') throw productsResult.reason;
      const overviewJson = overviewResult.value;
      const productsJson = productsResult.value;
      const currentShop = overviewJson.data.shop;
      setOverview(overviewJson.data);
      setShop(currentShop);
      setProducts(productsJson.data || []);
      setProfileForm({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
        shop_name: currentShop.name || '',
        description: currentShop.description || '',
        logo_url: currentShop.logo_url || '',
      });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [request, user]);

  useEffect(() => { loadBaseData(); }, [loadBaseData]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const json = await request('/api/merchant/orders');
      setOrders(json.data || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({ ...EMPTY_PRODUCT, category_id: categories[0]?.id || '' });
    setProductModal(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      ...EMPTY_PRODUCT,
      name: product.name || '',
      category_id: product.category_id || '',
      base_price: product.base_price || '',
      image_url: product.image_url || '',
      images: (product.product_images?.length ? product.product_images : [{ url: product.image_url, is_primary: true }])
        .map((image) => typeof image === 'string' ? { url: image } : image),
      description: product.description || '',
      stock_quantity: product.product_variants?.[0]?.stock_quantity ?? 1,
    });
    setProductModal(true);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: productForm.name.trim(),
        category_id: productForm.category_id,
        base_price: Number(productForm.base_price),
        image_url: productForm.image_url.trim(),
        images: productForm.images,
        description: productForm.description.trim(),
        is_active: editingProduct ? editingProduct.is_active !== false : true,
        ...(!editingProduct ? {
          variants: [{ size: null, color_name: null, color_hex: null, stock_quantity: Math.max(0, Number(productForm.stock_quantity) || 0) }],
        } : {}),
      };
      await request(editingProduct ? `/api/merchant/products/${editingProduct.id}` : '/api/merchant/products', {
        method: editingProduct ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setProductModal(false);
      setNotice(editingProduct ? 'Produit modifié.' : 'Produit ajouté.');
      await loadBaseData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadProductImage = async (event) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    const invalidFile = files.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      setError('Choisissez uniquement des fichiers image.');
      input.value = '';
      return;
    }

    setUploadingImage(true);
    setError('');
    try {
      const uploadedImages = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'products');
        formData.append('folder', 'products');
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token || localStorage.getItem(AUTH_KEY) || ''}` },
          body: formData,
        });
        const json = await response.json();
        if (!response.ok || !json.success || !json.data?.publicUrl) throw new Error(json.message || `La photo « ${file.name} » n’a pas pu être envoyée.`);
        uploadedImages.push({ url: json.data.publicUrl, alt_text: file.name.replace(/\.[^/.]+$/, '') });
      }
      setProductForm((form) => {
        const images = [...form.images, ...uploadedImages];
        return { ...form, images, image_url: form.image_url || images[0]?.url || '' };
      });
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploadingImage(false);
      input.value = '';
    }
  };

  const removeProductImage = (imageIndex) => {
    setProductForm((form) => {
      const images = form.images.filter((_, index) => index !== imageIndex);
      return { ...form, images, image_url: images[0]?.url || '' };
    });
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Supprimer « ${product.name} » ?`)) return;
    try {
      await request(`/api/merchant/products/${product.id}`, { method: 'DELETE' });
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setNotice('Produit supprimé.');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const copyProductLink = async (product) => {
    try {
      await navigator.clipboard.writeText(productUrl(product));
      setCopiedId(product.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setNotice(productUrl(product));
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    try {
      const json = await request('/api/merchant/profile', { method: 'PUT', body: JSON.stringify(profileForm) });
      setShop(json.data.shop);
      updateCurrentUser({
        first_name: json.data.user.first_name,
        last_name: json.data.user.last_name,
        phone: json.data.user.phone,
      });
      setNotice('Profil mis à jour.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const changeSection = (nextSection) => {
    setSection(nextSection);
    setError('');
    setNotice('');
    if (nextSection === 'orders') loadOrders();
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.first_name || shop?.name || 'Boutique';

  return (
    <main className="merchant-shell">
      <aside className="merchant-sidebar">
        <Link to="/" className="merchant-brand"><span className="merchant-brand__mark">J</span><span>JogaLook</span></Link>
        <div className="merchant-shop-chip"><span className="merchant-shop-chip__avatar">{(shop?.name || 'B')[0].toUpperCase()}</span><span>{shop?.name || 'Ma boutique'}</span></div>
        <nav className="merchant-nav" aria-label="Espace boutique">
          {SECTIONS.map((item) => (
            <button key={item.id} type="button" className={section === item.id ? 'is-active' : ''} onClick={() => changeSection(item.id)}>
              <span className="merchant-nav__icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="merchant-sidebar__bottom">
          <Link to="/">← Voir la boutique</Link>
          <button type="button" onClick={handleLogout}>Se déconnecter</button>
        </div>
      </aside>

      <section className="merchant-main">
        <header className="merchant-topbar">
          <div><span className="merchant-eyebrow">ESPACE BOUTIQUE</span><h1>{SECTIONS.find((item) => item.id === section)?.label}</h1></div>
          <div className="merchant-user"><span>{displayName}</span><span className="merchant-user__avatar">{displayName[0]?.toUpperCase()}</span></div>
        </header>

        <div className="merchant-content">
          {error && <div className="merchant-alert merchant-alert--error" role="alert">{error}<button onClick={() => setError('')} aria-label="Fermer">×</button></div>}
          {notice && <div className="merchant-alert" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Fermer">×</button></div>}

          {loading && <div className="merchant-loading">Chargement…</div>}

          {!loading && section === 'home' && (
            <>
              <div className="merchant-welcome"><div><h2>Bonjour{user?.first_name ? ` ${user.first_name}` : ''} 👋</h2><p>Voici l’activité de votre boutique.</p></div><button className="merchant-button" onClick={openCreateProduct}>＋ Ajouter un produit</button></div>
              <div className="merchant-stat-grid">
                <article><span>Produits</span><strong>{overview?.products ?? products.length}</strong><small>{overview?.activeProducts ?? products.length} en ligne</small></article>
                <article><span>Commandes reçues</span><strong>{overview?.orders ?? 0}</strong><small>Sur vos produits</small></article>
                <article><span>Boutique</span><strong className="merchant-stat-shop">{shop?.name || 'Ma boutique'}</strong><small>{shop?.is_verified ? 'Vérifiée' : 'Boutique active'}</small></article>
              </div>
              <section className="merchant-panel"><div className="merchant-panel__heading"><div><h2>Vos produits</h2><p>Gérez votre catalogue et partagez vos liens.</p></div><button className="merchant-link-button" onClick={() => changeSection('products')}>Tout voir →</button></div>
                {products.length ? <div className="merchant-product-list merchant-product-list--home">{products.slice(0, 4).map((product) => <ProductRow key={product.id} product={product} onEdit={openEditProduct} onDelete={deleteProduct} onCopy={copyProductLink} copiedId={copiedId} />)}</div> : <EmptyState text="Aucun produit pour l’instant." action="Ajouter un produit" onClick={openCreateProduct} />}
              </section>
            </>
          )}

          {!loading && section === 'products' && (
            <section className="merchant-panel"><div className="merchant-panel__heading"><div><h2>Mes produits</h2><p>{products.length} produit{products.length > 1 ? 's' : ''}</p></div><button className="merchant-button" onClick={openCreateProduct}>＋ Ajouter</button></div>
              {products.length ? <div className="merchant-product-list">{products.map((product) => <ProductRow key={product.id} product={product} onEdit={openEditProduct} onDelete={deleteProduct} onCopy={copyProductLink} copiedId={copiedId} />)}</div> : <EmptyState text="Votre catalogue est vide." action="Ajouter un produit" onClick={openCreateProduct} />}
            </section>
          )}

          {!loading && section === 'orders' && (
            <section className="merchant-panel"><div className="merchant-panel__heading"><div><h2>Commandes</h2><p>Commandes contenant vos produits</p></div><button className="merchant-link-button" onClick={loadOrders}>Actualiser ↻</button></div>
              {orders.length ? <div className="merchant-orders">{orders.map((order) => <article className="merchant-order" key={order.id}><div className="merchant-order__top"><strong>{order.order_number}</strong><span className={`merchant-status merchant-status--${String(order.status).toLowerCase()}`}>{order.status}</span></div><div className="merchant-order__meta"><span>{new Date(order.created_at).toLocaleDateString('fr-FR')}</span><strong>{money(order.order_items.reduce((sum, item) => sum + Number(item.total_price || 0), 0))}</strong></div><div className="merchant-order__customer">{[order.users?.first_name, order.users?.last_name].filter(Boolean).join(' ') || order.users?.email || 'Client'}</div><ul>{order.order_items.map((item) => <li key={item.id}><span>{item.product_name} {item.variant_info ? `· ${item.variant_info}` : ''} × {item.quantity}</span><strong>{money(item.total_price)}</strong></li>)}</ul></article>)}</div> : <EmptyState text="Aucune commande sur vos produits pour le moment." />}
            </section>
          )}

          {!loading && section === 'profile' && (
            <section className="merchant-panel merchant-profile"><div className="merchant-panel__heading"><div><h2>Mon profil</h2><p>Informations de contact et boutique</p></div></div>
              <form onSubmit={saveProfile} className="merchant-form">
                <div className="merchant-form__section"><h3>Votre compte</h3><div className="merchant-form__grid"><label>Prénom<input value={profileForm.first_name || ''} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} /></label><label>Nom<input value={profileForm.last_name || ''} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} /></label><label>Email<input value={user?.email || ''} disabled /></label><label>Téléphone<input value={profileForm.phone || ''} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></label></div></div>
                <div className="merchant-form__section"><h3>Votre boutique</h3><div className="merchant-form__grid"><label className="merchant-form__full">Nom de la boutique<input required value={profileForm.shop_name || ''} onChange={(e) => setProfileForm({ ...profileForm, shop_name: e.target.value })} /></label><label className="merchant-form__full">Description<textarea rows="4" value={profileForm.description || ''} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} /></label><label className="merchant-form__full">Lien du logo<input type="url" value={profileForm.logo_url || ''} onChange={(e) => setProfileForm({ ...profileForm, logo_url: e.target.value })} placeholder="https://…" /></label></div></div>
                <button type="submit" className="merchant-button" disabled={savingProfile}>{savingProfile ? 'Enregistrement…' : 'Enregistrer'}</button>
              </form>
            </section>
          )}
        </div>
      </section>

      {productModal && <div className="merchant-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setProductModal(false)}><form className="merchant-modal" onSubmit={saveProduct}><div className="merchant-modal__heading"><div><span className="merchant-eyebrow">CATALOGUE</span><h2>{editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h2></div><button type="button" onClick={() => setProductModal(false)} aria-label="Fermer">×</button></div>
        {error && <div className="merchant-alert merchant-alert--error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Fermer">×</button></div>}
        <label>Nom du produit<input required maxLength="200" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></label>
        <label>Catégorie<select required value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}><option value="">Choisir une catégorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <div className="merchant-form__grid"><label>Prix (FCFA)<input required min="1" type="number" value={productForm.base_price} onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })} /></label>{!editingProduct && <label>Stock initial<input min="0" type="number" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} /> </label>}</div>
        <label>Photos du produit<input type="file" accept="image/*" multiple onChange={uploadProductImage} disabled={uploadingImage} />{uploadingImage && <small>Envoi des photos…</small>}</label>
        {!!productForm.images.length && <div className="merchant-image-gallery">{productForm.images.map((image, index) => <div className="merchant-image-gallery__item" key={`${image.url}-${index}`}><img src={image.url} alt={image.alt_text || `Photo ${index + 1}`} /><button type="button" onClick={() => removeProductImage(index)} aria-label={`Retirer la photo ${index + 1}`}>×</button></div>)}</div>}
        <label>URL de l’image principale<input required type="url" placeholder="https://…" value={productForm.image_url} onChange={(e) => {
          const imageUrl = e.target.value;
          const images = imageUrl
            ? [{ url: imageUrl, is_primary: true }, ...productForm.images.filter((image) => image.url !== imageUrl).map((image) => ({ ...image, is_primary: false }))]
            : productForm.images.map((image) => ({ ...image, is_primary: false }));
          setProductForm({ ...productForm, image_url: imageUrl, images });
        }} /></label>
        <label>Description<textarea rows="4" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></label>
        <div className="merchant-modal__actions"><button type="button" className="merchant-button merchant-button--ghost" onClick={() => setProductModal(false)}>Annuler</button><button type="submit" className="merchant-button" disabled={saving || uploadingImage}>{saving ? 'Enregistrement…' : editingProduct ? 'Enregistrer' : 'Créer le produit'}</button></div>
      </form></div>}
    </main>
  );
}

function ProductRow({ product, onEdit, onDelete, onCopy, copiedId }) {
  return <article className="merchant-product-row"><img src={product.image_url || '/favicon.svg'} alt="" /><div className="merchant-product-row__details"><strong>{product.name}</strong><span>{product.categories?.name || 'Sans catégorie'} · {money(product.base_price)}</span><small>{product.is_active === false ? 'Masqué' : 'En ligne'}</small></div><div className="merchant-product-row__actions"><button title="Copier le lien" onClick={() => onCopy(product)}>{copiedId === product.id ? 'Copié ✓' : 'Lien ↗'}</button><button title="Modifier" onClick={() => onEdit(product)}>Modifier</button><button className="is-danger" title="Supprimer" onClick={() => onDelete(product)}>Supprimer</button></div></article>;
}

function EmptyState({ text, action, onClick }) {
  return <div className="merchant-empty"><span>▣</span><p>{text}</p>{action && <button className="merchant-link-button" onClick={onClick}>{action} →</button>}</div>;
}
