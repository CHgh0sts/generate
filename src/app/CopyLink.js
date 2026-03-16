'use client';
import { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { useToast } from './Toast';

/**
 * CopyLink — copies the current page URL to clipboard.
 * Drop it anywhere in a tool header.
 */
export function CopyLink({ className = '' }) {
  const [copied, setCopied] = useState(false);
  const pushToast = useToast();

  const handleClick = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      pushToast?.('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleClick}
      title="Copier le lien"
      aria-label="Copier le lien de cette page"
      className={`flex items-center gap-1.5 text-xs text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#d4d4d4] transition-colors ${className}`}
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-emerald-500" />
        : <Link2 className="w-3.5 h-3.5" />}
      {copied ? 'Copié' : 'Lien'}
    </button>
  );
}
