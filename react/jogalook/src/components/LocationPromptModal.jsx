import React from 'react';
import './LocationPromptModal.css';
import { MapPinIcon, NavigationIcon, PhoneCallIcon } from './icons/AppIcons';

/**
 * Modal d'autorisation de localisation / choix d'option alternative.
 * Affiché lorsque l'utilisateur tente de valider la commande en mode GPS
 * sans avoir accordé ou récupéré ses coordonnées de géolocalisation.
 */
export default function LocationPromptModal({
  open,
  onClose,
  onAuthorize,
  onChooseOther,
  isLocating = false,
  error = '',
}) {
  if (!open) return null;

  return (
    <div
      className="loc-prompt-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLocating) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loc-prompt-title"
    >
      <div className="loc-prompt-card">
        {/* Bouton fermeture */}
        <button
          type="button"
          className="loc-prompt-close"
          onClick={onClose}
          disabled={isLocating}
          aria-label="Fermer"
        >
          ✕
        </button>

        {/* Badge icône stylisé avec radar pulsant */}
        <div className="loc-prompt-icon-badge">
          <div className="loc-prompt-pulse-ring" />
          <div className="loc-prompt-icon-inner">
            <MapPinIcon size={32} color="#F15A24" />
          </div>
        </div>

        {/* Titre & Description */}
        <h3 id="loc-prompt-title" className="loc-prompt-title">
          Autoriser la localisation
        </h3>
        <p className="loc-prompt-desc">
          Pour que le livreur puisse acheminer votre colis directement à votre porte, nous avons besoin d'accéder à votre position GPS exacte.
        </p>

        {/* Affichage d'erreur éventuelle */}
        {error && (
          <div className="loc-prompt-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Deux boutons d'action */}
        <div className="loc-prompt-actions">
          {/* Bouton 1 : Autoriser la localisation */}
          <button
            type="button"
            className="loc-prompt-btn loc-prompt-btn--primary"
            onClick={onAuthorize}
            disabled={isLocating}
          >
            {isLocating ? (
              <>
                <span className="loc-prompt-spinner" />
                <span>Recherche du signal GPS…</span>
              </>
            ) : (
              <>
                <NavigationIcon size={18} color="#ffffff" />
                <span>Autoriser la localisation</span>
              </>
            )}
          </button>

          {/* Bouton 2 : Choisir une autre option */}
          <button
            type="button"
            className="loc-prompt-btn loc-prompt-btn--secondary"
            onClick={onChooseOther}
            disabled={isLocating}
          >
            <PhoneCallIcon size={18} color="currentColor" />
            <span>Choisir une autre option</span>
          </button>
        </div>

        {/* Note informative */}
        <p className="loc-prompt-hint">
          Autre option : Préciser votre position par appel téléphonique ou retrait en point relais (Dakar).
        </p>
      </div>
    </div>
  );
}
