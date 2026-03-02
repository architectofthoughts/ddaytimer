import { useState } from 'react';
import { getFunUnits, formatNumber } from '../utils/funUnits';

interface FunFactsProps {
  totalMs: number;
}

export default function FunFacts({ totalMs }: FunFactsProps) {
  const [expanded, setExpanded] = useState(false);
  const funUnits = getFunUnits(totalMs);
  const displayed = expanded ? funUnits : funUnits.slice(0, 4);

  if (totalMs <= 0) return null;

  return (
    <div className="fun-facts">
      <h3 className="fun-facts-title">
        In another perspective...
      </h3>
      <div className="fun-facts-grid">
        {displayed.map((unit) => (
          <div key={unit.label} className="fun-fact-card">
            <span className="fun-fact-emoji">{unit.emoji}</span>
            <span className="fun-fact-value">{formatNumber(unit.value)}</span>
            <span className="fun-fact-label">{unit.label}</span>
          </div>
        ))}
      </div>
      {funUnits.length > 4 && (
        <button
          className="fun-facts-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : `Show ${funUnits.length - 4} more`}
        </button>
      )}
    </div>
  );
}
