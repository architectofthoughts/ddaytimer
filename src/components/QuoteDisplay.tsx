import { useState, useEffect, useCallback } from 'react';
import { getRandomQuote } from '../utils/quotes';

export default function QuoteDisplay() {
  const [quote, setQuote] = useState(() => getRandomQuote());
  const [fading, setFading] = useState(false);

  const refresh = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setQuote(getRandomQuote());
      setFading(false);
    }, 400);
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className={`quote-display ${fading ? 'fading' : ''}`}>
      <blockquote>
        <p>"{quote.text}"</p>
        <footer>- {quote.author}</footer>
      </blockquote>
      <button className="quote-refresh" onClick={refresh} title="New quote">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 4v6h-6M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
      </button>
    </div>
  );
}
