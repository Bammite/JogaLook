import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './SearchPage.css';

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}

function ProductRow({ product }) {
  const image = product.image_url || product.image;
  return (
    <Link to={`/catalogue/${product.id}`} className="search-row">
      <div className="search-row__image">{image && <img src={image} alt="" />}</div>
      <div className="search-row__body"><strong>{product.name}</strong><span>{product.categories?.name || 'Collection'}</span></div>
      <div className="search-row__match">{product.match_type === 'name' ? 'Nom du produit' : `Mot-clé : ${product.matched_keyword}`}</div>
      {product.match_type === 'keyword' && <b>{product.match_score}%</b>}
      <span className="search-row__arrow">→</span>
    </Link>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState({ products: [], keywords: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(Boolean(searchParams.get('q')));
  const query = searchParams.get('q')?.trim() || '';

  useEffect(() => {
    setInput(query);
    if (!query) {
      setResults([]); setSuggestions({ products: [], keywords: [] });
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const response = await fetch(`/api/search/products?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.message || 'Recherche impossible.');
        setResults(json.data || []); setSuggestions(json.suggestions || { products: [], keywords: [] });
      } catch (searchError) {
        if (searchError.name !== 'AbortError') setError(searchError.message);
      } finally { setLoading(false); }
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  const changeInput = (event) => {
    const value = event.target.value;
    setInput(value); setShowResults(false); setSearchParams(value.trim() ? { q: value } : {}, { replace: true });
  };
  const chooseSuggestion = (value) => { setInput(value); setShowResults(true); setSearchParams({ q: value }); };

  return (
    <main className="search-page">
      <Navbar />
      <div className="search-page__inner">
        <div className="search-box"><SearchIcon /><input autoFocus value={input} onFocus={() => setShowResults(false)} onChange={changeInput} placeholder="Nom de produit ou mot-clé" aria-label="Rechercher un produit ou un mot-clé" />{input && <button type="button" onClick={() => changeInput({ target: { value: '' } })} aria-label="Effacer">×</button>}</div>
        {!showResults && query && (suggestions.products.length > 0 || suggestions.keywords.length > 0) && <section className="suggestions" aria-label="Suggestions"><div className="suggestions__row">{suggestions.products.map((product) => <button key={`p-${product.id}`} onClick={() => chooseSuggestion(product.name)}>{product.name}</button>)}{suggestions.keywords.map((keyword) => <button key={`k-${keyword.id}`} onClick={() => chooseSuggestion(keyword.word)}>{keyword.word}</button>)}</div></section>}
        <section className="results" aria-live="polite">
          {showResults && <>{loading && <div className="results__hint">Recherche en cours...</div>}{error && <div className="results__hint results__hint--error">{error}</div>}{!loading && !error && results.length === 0 && <div className="results__hint">Aucun produit ne correspond à « {query} ».</div>}{!loading && !error && results.length > 0 && <div className="results__list">{results.map((product) => <ProductRow key={product.id} product={product} />)}</div>}</>}
        </section>
      </div>
    </main>
  );
}
