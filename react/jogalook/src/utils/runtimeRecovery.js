const RECOVERY_KEY = 'jogalook-runtime-recovery';
const RECOVERY_COOLDOWN_MS = 10 * 60 * 1000;

function canAttemptRecovery() {
  try {
    const previous = Number(sessionStorage.getItem(RECOVERY_KEY) || 0);
    return !previous || Date.now() - previous > RECOVERY_COOLDOWN_MS;
  } catch {
    return true;
  }
}

async function clearSiteCaches() {
  // CacheStorage et Service Workers sont les caches applicatifs contrôlables
  // depuis le site. Le cache HTTP général du navigateur reste inaccessible.
  try {
    if ('caches' in window) {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn('[JogaLook] Nettoyage CacheStorage impossible', error);
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch (error) {
    console.warn('[JogaLook] Désinscription Service Worker impossible', error);
  }
}

export async function recoverFromRuntimeError(reason = 'unknown') {
  if (!canAttemptRecovery()) return false;

  try {
    sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
  } catch {
    // Certains navigateurs bloquent le stockage privé : on continue quand même.
  }

  console.warn(`[JogaLook] Rechargement automatique après anomalie (${reason})`);
  await clearSiteCaches();

  const url = new URL(window.location.href);
  url.searchParams.set('__jgl_recovery', String(Date.now()));
  window.location.replace(url.toString());
  return true;
}

export function installRuntimeRecovery() {
  const onError = (event) => {
    const target = event.target;
    const reason = target?.src || target?.href || event.error?.message || event.message;
    void recoverFromRuntimeError(`resource:${reason || 'unknown'}`);
  };
  const onUnhandledRejection = (event) => {
    void recoverFromRuntimeError(`promise:${event.reason?.message || 'unknown'}`);
  };

  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  // Détecte le cas classique d'un shell React resté complètement blanc.
  const blankPageTimer = window.setTimeout(() => {
    const root = document.getElementById('root');
    if (root && root.childElementCount === 0) {
      void recoverFromRuntimeError('blank-root');
    }
  }, 8000);

  return () => {
    window.removeEventListener('error', onError, true);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    window.clearTimeout(blankPageTimer);
  };
}

