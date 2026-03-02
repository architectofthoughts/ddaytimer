import { useState } from 'react';
import type { DDay } from '../types';
import { encodeShareUrl } from '../utils/share';

interface ShareButtonProps {
  dday: DDay;
}

export default function ShareButton({ dday }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = encodeShareUrl(dday);

    if (navigator.share) {
      try {
        await navigator.share({ title: `D-Day: ${dday.title}`, url });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="share-button" onClick={handleShare} title="Share">
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
      )}
    </button>
  );
}
