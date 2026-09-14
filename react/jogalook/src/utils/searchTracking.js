import { useEffect, useRef } from 'react';

const SEARCH_DEBOUNCE_MS = 700;
const TOKEN_KEY = 'jogalook-token';

function getAuthHeaders() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function buildPayload({ searchType, query, sourcePath, resultsCount, metadata }) {
  return {
    search_type: searchType,
    query_text: query.trim(),
    source_path: sourcePath || window.location.pathname,
    results_count: Number.isInteger(resultsCount) ? resultsCount : null,
    metadata: metadata || {},
  };
}

async function persistSearch(payload) {
  const response = await fetch('/api/search/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
    keepalive: true,
  });

  if (!response.ok) throw new Error('Impossible d’enregistrer la recherche.');
}

function persistSearchOnExit(payload) {
  const body = JSON.stringify(payload);
  const authHeaders = getAuthHeaders();

  // sendBeacon ne permet pas d'ajouter Authorization. Garder fetch pour les
  // comptes connectés afin que l'API puisse récupérer le user_id du token.
  if (authHeaders.Authorization) {
    void fetch('/api/search/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body,
      keepalive: true,
    }).catch(() => {});
    return;
  }

  if (navigator.sendBeacon) {
    const accepted = navigator.sendBeacon(
      '/api/search/history',
      new Blob([body], { type: 'application/json' })
    );
    if (accepted) return;
  }

  void fetch('/api/search/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Enregistre une recherche après une pause de saisie et force la dernière valeur
 * lors d'un blur, changement d'onglet, retour ou fermeture de page.
 */
export function useSearchTracking({ searchType, query, sourcePath, resultsCount, metadata = {} }) {
  const latestRef = useRef({ query: '', resultsCount: null, metadata });
  const lastSentQueryRef = useRef('');
  const timerRef = useRef(null);
  const flushRef = useRef(() => {});

  useEffect(() => {
    latestRef.current = { query, resultsCount, metadata };
  }, [query, resultsCount, metadata]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      window.clearTimeout(timerRef.current);
      lastSentQueryRef.current = '';
      return undefined;
    }

    const sendLatest = (isLeaving = false) => {
      const latest = latestRef.current;
      const value = latest.query.trim();
      if (!value || value === lastSentQueryRef.current) return;

      const payload = buildPayload({
        searchType,
        query: value,
        sourcePath,
        resultsCount: latest.resultsCount,
        metadata: latest.metadata,
      });
      lastSentQueryRef.current = value;
      if (isLeaving) persistSearchOnExit(payload);
      else void persistSearch(payload).catch(() => {});
    };

    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => sendLatest(), SEARCH_DEBOUNCE_MS);

    const flush = () => {
      window.clearTimeout(timerRef.current);
      sendLatest(true);
    };
    flushRef.current = flush;

    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, [query, searchType, sourcePath]);

  useEffect(() => {
    const flush = () => flushRef.current();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('blur', flush);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      flush();
      window.removeEventListener('blur', flush);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
