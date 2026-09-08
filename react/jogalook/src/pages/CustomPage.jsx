import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  CameraIcon,
  EyeIcon,
  JerseyIcon,
  PaletteIcon,
  PencilIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TagIcon
} from '../components/icons/AppIcons';
import { normalizeSvgForDisplay } from '../utils/svgUtils';
import './CustomPage.css';

function formatFCFA(value) {
  return `${Math.round(Number(value) || 0).toLocaleString('fr-FR')} FCFA`;
}

function CustomPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [modalTemplate, setModalTemplate] = useState(null);
  const [modalViewSide, setModalViewSide] = useState('front'); // 'front' | 'back'
  const [searchQuery, setSearchQuery] = useState('');

  // Charger la liste des templates depuis l'API backend
  useEffect(() => {
    async function fetchTemplates() {
      setLoadingTemplates(true);
      try {
        const res = await fetch('/api/templates');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTemplates(json.data);
        } else {
          setTemplates([]);
        }
      } catch (err) {
        console.error('Erreur chargement templates:', err);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleOpenModal = (tpl) => {
    setModalTemplate(tpl);
    setModalViewSide('front');
  };

  const handleStartCustomizing = (tplId) => {
    setModalTemplate(null);
    navigate(`/custom/${tplId}`);
  };

  const filteredTemplates = templates.filter((t) =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <section className="custom-page">
        <div className="container">
          <div className="template-selection-section">
            <div className="custom-header">
              <h1>Choisissez votre modèle de maillot</h1>
              <p>
                Sélectionnez un template vectoriel officiel parmi notre collection pour lancer le studio de création personnalisé.
              </p>
            </div>

            {/* Barre de recherche */}
            <div className="template-search-bar">
              <input
                type="text"
                placeholder="Rechercher un modèle de maillot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Grille des Cadres Templates */}
            {loadingTemplates ? (
              <div className="templates-loading">
                <div className="spinner"></div>
                <p>Chargement des modèles...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="templates-empty">
                <p>{templates.length === 0 ? 'Aucun modèle de maillot pour le moment.' : `Aucun modèle trouvé pour "${searchQuery}".`}</p>
              </div>
            ) : (
              <div className="templates-grid">
                {filteredTemplates.map((tpl) => {
                  const svgPreview = normalizeSvgForDisplay(tpl.svg_front || tpl.svg_content);
                  const editable = tpl.editable_elements || {};

                  return (
                    <div key={tpl.id} className="template-card">
                      <div className="template-card__badge">
                        {tpl.is_free ? 'Gratuit' : formatFCFA(tpl.price)}
                      </div>

                      {/* Zone d'aperçu du Template (Photo HD ou SVG) */}
                      <div className="template-card__preview">
                        {tpl.template_type === 'MOCKUP' && tpl.image_front ? (
                          <div className="template-mockup-box" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                            <img src={tpl.image_front} alt={tpl.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          </div>
                        ) : svgPreview ? (
                          <div
                            className="template-svg-box"
                            dangerouslySetInnerHTML={{ __html: svgPreview }}
                          />
                        ) : (
                          <div className="template-fallback-box">
                            <JerseyIcon size={64} color="#1d3557" />
                          </div>
                        )}
                      </div>

                      {/* Infos Template */}
                      <div className="template-card__content">
                        <h3>{tpl.name}</h3>
                        <p className="template-card__desc">
                          {tpl.description || 'Modèle de maillot professionnel personnalisable.'}
                        </p>

                        {/* Badges de personnalisation activés */}
                        <div className="template-card-tags">
                          {tpl.template_type === 'MOCKUP' ? (
                            <>
                              <span className="custom-feature-tag" style={{ background: '#f3e8ff', color: '#7e22ce', borderColor: '#d8b4fe' }}><CameraIcon size={14} /> Photo HD</span>
                              <span className="custom-feature-tag"><PencilIcon size={14} /> Flockage Nom & N°</span>
                            </>
                          ) : (
                            <>
                              {editable.body !== false && <span className="custom-feature-tag"><PaletteIcon size={14} /> Couleurs</span>}
                              {editable.collar !== false && <span className="custom-feature-tag"><JerseyIcon size={14} /> Col</span>}
                              {editable.badge !== false && <span className="custom-feature-tag"><ShieldCheckIcon size={14} /> Blason</span>}
                              {(editable.name_zone !== false || editable.number_zone !== false) && (
                                <span className="custom-feature-tag"><PencilIcon size={14} /> Flockage</span>
                              )}
                            </>
                          )}
                        </div>

                        <div className="template-card__meta">
                          <span><SparklesIcon size={14} /> {tpl.usage_count || 0} créations</span>
                        </div>

                        {/* Boutons d'action : Voir & Personnaliser */}
                        <div className="template-card__actions">
                          <button
                            className="btn-template-voir"
                            onClick={() => handleOpenModal(tpl)}
                          >
                            <><EyeIcon size={16} /> Voir</>
                          </button>
                          <button
                            className="btn-template-custom"
                            onClick={() => handleStartCustomizing(tpl.id)}
                          >
                            <><SparklesIcon size={16} /> Personnaliser</>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MODAL VOIR LE TEMPLATE (DOUBLE FACE) */}
          {modalTemplate && (
            <div className="template-modal-overlay" onClick={() => setModalTemplate(null)}>
              <div className="template-modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="template-modal-close" onClick={() => setModalTemplate(null)}>
                  ✕
                </button>

                <div className="template-modal-body">
                  <div className="template-modal-preview">
                    {/* Switcher Face / Dos dans le modal */}
                    <div className="modal-view-toggle">
                      <button
                        className={`modal-view-btn ${modalViewSide === 'front' ? 'active' : ''}`}
                        onClick={() => setModalViewSide('front')}
                      >
                        Face Avant
                      </button>
                      <button
                        className={`modal-view-btn ${modalViewSide === 'back' ? 'active' : ''}`}
                        onClick={() => setModalViewSide('back')}
                      >
                        Dos / Arrière
                      </button>
                    </div>

                    {modalTemplate.template_type === 'MOCKUP' && modalTemplate.image_front ? (
                      <div className="modal-svg-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={modalViewSide === 'front' ? modalTemplate.image_front : (modalTemplate.image_back || modalTemplate.image_front)}
                          alt={modalTemplate.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <div
                        className="modal-svg-container"
                        dangerouslySetInnerHTML={{
                          __html: normalizeSvgForDisplay(
                            modalViewSide === 'front'
                              ? (modalTemplate.svg_front || modalTemplate.svg_content || '')
                              : (modalTemplate.svg_back || modalTemplate.svg_front || modalTemplate.svg_content || '')
                          )
                        }}
                      />
                    )}
                  </div>

                  <div className="template-modal-details">
                    <h2>{modalTemplate.name}</h2>
                    <span className="template-modal-price">
                      {modalTemplate.is_free ? 'Template Inclus' : formatFCFA(modalTemplate.price)}
                    </span>

                    <p className="template-modal-desc">
                      {modalTemplate.description || 'Maillot vectoriel haute définition prêt pour la personnalisation en direct.'}
                    </p>

                    <div className="template-modal-stats">
                      <div className="stat-item">
                        <span className="stat-label">Utilisations</span>
                        <span className="stat-value">{modalTemplate.usage_count || 0} créations</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Format</span>
                        <span className="stat-value">{modalTemplate.template_type === 'MOCKUP' ? 'Photo HD & Flockage' : 'Multi-Face SVG'}</span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                        Fonctionnalités personnalisables :
                      </span>
                      <div className="template-card-tags">
                        {modalTemplate.editable_elements?.body !== false && <span className="custom-feature-tag"><PaletteIcon size={14} /> Couleur Principale</span>}
                        {modalTemplate.editable_elements?.collar !== false && <span className="custom-feature-tag"><JerseyIcon size={14} /> Forme de Col</span>}
                        {modalTemplate.editable_elements?.badge !== false && <span className="custom-feature-tag"><ShieldCheckIcon size={14} /> Import Logo/Blason</span>}
                        {modalTemplate.editable_elements?.name_zone !== false && <span className="custom-feature-tag"><PencilIcon size={14} /> Nom Joueur</span>}
                        {modalTemplate.editable_elements?.number_zone !== false && <span className="custom-feature-tag"><TagIcon size={14} /> Numéro Joueur</span>}
                      </div>
                    </div>

                    <div className="template-modal-actions">
                      <button
                        className="btn-outline"
                        onClick={() => setModalTemplate(null)}
                      >
                        Fermer
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() => handleStartCustomizing(modalTemplate.id)}
                      >
                        <><SparklesIcon size={16} /> Personnaliser ce modèle</>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
      <Footer />
    </>
  );
}

export default CustomPage;