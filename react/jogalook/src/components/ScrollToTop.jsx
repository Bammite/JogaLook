import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant de réinitialisation automatique du défilement (Scroll to top).
 * Dans une SPA avec React Router, naviguer vers une nouvelle page ne remet pas
 * automatiquement la fenêtre à (0, 0). Ce composant écoute les changements
 * de route et replace immédiatement l'utilisateur au sommet de la page.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Si l'URL contient une ancre (#id), cibler l'élément s'il existe
    if (hash) {
      try {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } catch {
        // En cas de sélecteur invalide dans le hash, continuer vers le scroll haut
      }
    }

    // Remettre immédiatement le scroll en haut de page
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Double vérification sur le frame suivant pour les rendus dynamiques
    const rafId = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => cancelAnimationFrame(rafId);
  }, [pathname, search]);

  return null;
}
