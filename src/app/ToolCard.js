'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const RECENT_KEY = 'generate_recent_tools';
const MAX_RECENT = 4;

function trackRecent(href) {
  try {
    const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const next = [href, ...prev.filter(h => h !== href)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

export function ToolCard({ href, color, title, description }) {
  return (
    <Link
      href={href}
      onClick={() => trackRecent(href)}
      style={{ borderColor: color + '40' }}
      className="flex h-full flex-col rounded-xl border bg-white dark:bg-[#171717] p-4 hover:-translate-y-0.5 hover:shadow-md transition-all group"
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = color + '40')}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed]">{title}</h4>
      </div>
      <p className="text-xs text-[#737373] dark:text-[#a3a3a3] flex-1 leading-relaxed pl-4">{description}</p>
      <span className="mt-3 pl-4 inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
        Ouvrir <ArrowRight className="w-3 h-3" />
      </span>
    </Link>
  );
}
