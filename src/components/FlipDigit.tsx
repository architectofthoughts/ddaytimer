import { useEffect, useRef, useState } from 'react';

interface FlipDigitProps {
  value: number;
  label: string;
}

export default function FlipDigit({ value, label }: FlipDigitProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setFlipping(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setFlipping(false);
      }, 300);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const formatted = String(displayValue).padStart(2, '0');

  return (
    <div className="flip-digit-container">
      <div className={`flip-digit ${flipping ? 'flipping' : ''}`}>
        <div className="flip-digit-top">
          <span>{formatted}</span>
        </div>
        <div className="flip-digit-bottom">
          <span>{formatted}</span>
        </div>
        <div className="flip-digit-divider" />
      </div>
      <span className="flip-digit-label">{label}</span>
    </div>
  );
}
