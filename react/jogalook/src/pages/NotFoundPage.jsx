import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

function NotFoundPage() {
  return (
    <div className="notfound-wrapper">
      {/* Ambiance Stade & Lumieres */}
      <div className="notfound-stadium-glow"></div>
      <div className="notfound-ambient-1"></div>
      <div className="notfound-ambient-2"></div>
      <div className="notfound-pitch-lines"></div>

      {/* Carte Centrale */}
      <main className="notfound-card">
        {/* Logo JogaLook */}
        <Link to="/" className="notfound-brand" aria-label="Retour à l'accueil JogaLook">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="24" fill="#0b1329" />
            <path
              d="M10 14 L14 10 L18 13 C19.5 14 20.5 14 24 14 C27.5 14 28.5 14 30 13 L34 10 L38 14 L33 18 L33 38 L15 38 L15 18 Z"
              fill="#f15a24"
            />
            <path
              d="M20 14 Q24 17 28 14"
              stroke="#0b1329"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          Joga<span>Look</span>
        </Link>

        {/* Badge d'arbitrage */}
        <div>
          <div className="notfound-badge">
            <span className="notfound-dot"></span>
            Drapeau levé &bull; Hors-jeu
          </div>
        </div>

        {/* Grand chiffre 404 avec ballon animé */}
        <div className="notfound-code" aria-label="Erreur 404">
          <span>4</span>
          <span className="notfound-ball">⚽</span>
          <span>4</span>
        </div>

        {/* Titre & Message */}
        <h1>Oups, cette page est sortie du terrain !</h1>
        <p>
          Le maillot, la collection ou le lien que vous recherchez n'est plus en jeu ou a changé de position.
        </p>

        {/* Boutons d'action */}
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn notfound-btn-primary">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Retour au terrain (Accueil)
          </Link>

          <Link to="/catalogue" className="notfound-btn notfound-btn-secondary">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            Explorer nos maillots
          </Link>

          <Link to="/contact" className="notfound-btn notfound-btn-link">
            Besoin d'aide ? Contactez notre support →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default NotFoundPage;
