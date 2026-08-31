import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { EyeIcon, FootballIcon } from '../components/icons/AppIcons';
import './NewsDetailPage.css';

function formatDate(val) {
  if (!val) return '';
  return new Date(val).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export default function NewsDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function loadArticle() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/sports-news/${id}`);
        const json = await res.json();

        if (json.success && json.data) {
          setArticle(json.data);

          // Charger des articles connexes depuis la BD
          const relatedRes = await fetch(`/api/sports-news?status=PUBLISHED&limit=4`);
          const relatedJson = await relatedRes.json();
          if (relatedJson.success && Array.isArray(relatedJson.data)) {
            setRelatedArticles(relatedJson.data.filter(a => a.id !== json.data.id && a.slug !== json.data.slug).slice(0, 3));
          }
        } else {
          setError(json.message || 'Article introuvable dans la base de données.');
        }
      } catch (err) {
        console.error('Erreur chargement article:', err);
        setError('Impossible de charger cet article depuis la base de données.');
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="news-detail-loading">
          <div className="admin-spinner" style={{ width: 44, height: 44 }} />
          <p>Chargement de l’actualité…</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !article) {
    return (
      <>
        <Navbar />
        <div className="container news-detail-error">
          <h2>Article introuvable</h2>
          <p>{error || 'L’article que vous recherchez n’existe pas dans la base de données.'}</p>
          <Link to="/actualites" className="btn-primary">
            ← Retour aux actualités
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const categoryName = article.sports_news_categories?.name || 'Actualité';

  return (
    <>
      <Navbar />

      <main className="news-detail-page">
        {/* ── Fil d'Ariane & Retour ── */}
        <div className="container news-detail-breadcrumb">
          <Link to="/actualites" className="news-back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Toutes les actualités
          </Link>
          <span className="news-breadcrumb-sep">/</span>
          <span className="news-breadcrumb-current">{categoryName}</span>
        </div>

        {/* ── Entête de l'Article ── */}
        <article className="container news-detail-article">
          <header className="news-detail-header">
            <div className="news-detail-meta">
              <span className="news-detail-category">{categoryName}</span>
              <span className="news-detail-date">
                Publié le {formatDate(article.published_at || article.created_at)}
              </span>
              {article.views_count > 0 && (
                <span className="news-detail-views">
                  <EyeIcon size={14} /> {article.views_count} vues
                </span>
              )}
            </div>

            <h1 className="news-detail-title">{article.title}</h1>

            {article.excerpt && (
              <p className="news-detail-lead">{article.excerpt}</p>
            )}
          </header>

          {/* Image de couverture principale */}
          {article.cover_image_url && (
            <div className="news-detail-cover">
              <img src={article.cover_image_url} alt={article.title} />
            </div>
          )}

          {/* Corps de l'article en HTML */}
          <div
            className="news-detail-body"
            dangerouslySetInnerHTML={{ __html: article.content || '<p>Contenu en cours de rédaction...</p>' }}
          />

          {/* Partage & Liens */}
          <div className="news-detail-footer">
            <Link to="/actualites" className="btn-primary news-footer-back">
              ← Voir d’autres actualités
            </Link>
            <Link to="/catalogue" className="btn-outline-dark news-footer-shop">
              Découvrir la boutique JogaLook →
            </Link>
          </div>
        </article>

        {/* ── Articles Connexes ── */}
        {relatedArticles.length > 0 && (
          <section className="news-related-section">
            <div className="container">
              <h2 className="news-section-title">À lire également</h2>
              <div className="news-grid">
                {relatedArticles.map((rel) => (
                  <Link key={rel.id} to={`/actualites/${rel.slug || rel.id}`} className="news-card">
                    <div className="news-card-img-wrap">
                      {rel.cover_image_url ? (
                        <img src={rel.cover_image_url} alt={rel.title} />
                      ) : (
                        <div className="sports-table-cover-placeholder" style={{ height: '100%' }}>
                          <FootballIcon size={36} color="#CBD5E1" />
                        </div>
                      )}
                      <span className="news-card-tag">{rel.sports_news_categories?.name || 'Sport'}</span>
                    </div>
                    <div className="news-card-body">
                      <h3 className="news-card-title">{rel.title}</h3>
                      <p className="news-card-excerpt">{rel.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
