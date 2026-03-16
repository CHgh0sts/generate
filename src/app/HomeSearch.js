'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Clock, Heart } from 'lucide-react';
import { ToolCard, getFavorites } from './ToolCard';

const RECENT_KEY = 'generate_recent_tools';
const MAX_RECENT = 4;

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

export function HomeSearch({ groups }) {
  const [query, setQuery]       = useState('');
  const [category, setCategory] = useState(''); // '' = all
  const [recent, setRecent]     = useState([]);
  const [favorites, setFavorites] = useState([]);
  const inputRef = useRef(null);

  const totalTools = groups.reduce((s, g) => s + g.tools.length, 0);

  // Load recent + favorites from localStorage
  useEffect(() => {
    setRecent(getRecent());
    setFavorites(getFavorites());
    const handler = () => setFavorites(getFavorites());
    window.addEventListener('favorites-changed', handler);
    return () => window.removeEventListener('favorites-changed', handler);
  }, []);

  // Keyboard shortcut: "/" to focus search, Esc to clear
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setQuery('');
        setCategory('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const q = query.trim().toLowerCase();

  const allTools = useMemo(() =>
    groups.flatMap(g => g.tools.map(t => ({ ...t, groupLabel: g.label }))),
  [groups]);

  const recentTools = useMemo(() =>
    recent.map(href => allTools.find(t => t.href === href)).filter(Boolean),
  [recent, allTools]);

  const favoriteTools = useMemo(() =>
    favorites.map(href => allTools.find(t => t.href === href)).filter(Boolean),
  [favorites, allTools]);

  const filtered = useMemo(() => {
    if (!q && !category) return null;
    return allTools.filter(tool => {
      const matchCat = !category || tool.groupLabel === category;
      const matchQ = !q || tool.title.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q) || tool.groupLabel.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [q, category, allTools]);

  const activeGroups = useMemo(() => {
    if (category) return groups.filter(g => g.label === category);
    return groups;
  }, [category, groups]);

  return (
    <div className="space-y-6">
      {/* Search + category bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="flex flex-1 items-center gap-2 border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-white dark:bg-[#171717] px-3 focus-within:ring-2 focus-within:ring-[#171717]/10 dark:focus-within:ring-[#ededed]/10 transition-shadow">
          <Search className="w-4 h-4 text-[#a3a3a3] shrink-0 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Rechercher parmi ${totalTools} outils…`}
            className="flex-1 py-2.5 bg-transparent text-sm text-[#171717] dark:text-[#ededed] placeholder:text-[#a3a3a3] focus:outline-none"
            aria-label="Rechercher un outil"
          />
          {query ? (
            <button onClick={() => setQuery('')} aria-label="Effacer"
              className="text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#d4d4d4] shrink-0">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="text-[10px] text-[#a3a3a3] border border-[#e5e5e5] dark:border-[#404040] rounded px-1 hidden sm:block shrink-0">/</kbd>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setCategory('')}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${!category ? 'bg-[#171717] dark:bg-[#ededed] text-white dark:text-[#171717] border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#404040]'}`}>
            Tous
          </button>
          {groups.map(g => (
            <button key={g.label}
              onClick={() => setCategory(category === g.label ? '' : g.label)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${category === g.label ? 'bg-[#171717] dark:bg-[#ededed] text-white dark:text-[#171717] border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#404040]'}`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search results */}
      {filtered !== null ? (
        filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#a3a3a3]">
            <Search className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucun outil trouvé{query ? ` pour "${query}"` : ''}</p>
            <p className="text-xs mt-1">Essayez un autre mot-clé ou retirez le filtre</p>
            <button onClick={() => { setQuery(''); setCategory(''); }} className="mt-3 text-xs underline text-[#737373] hover:text-[#171717] dark:hover:text-[#ededed]">
              Réinitialiser
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-[#a3a3a3] mb-4">
              <span className="font-medium text-[#525252] dark:text-[#737373]">{filtered.length}</span> résultat{filtered.length > 1 ? 's' : ''}
              {query && <> pour &quot;<span className="text-[#171717] dark:text-[#ededed]">{query}</span>&quot;</>}
              {category && <> dans <span className="text-[#171717] dark:text-[#ededed]">{category}</span></>}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(tool => (
                <li key={tool.href}><ToolCard {...tool} /></li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <div className="space-y-8">
          {/* Favorites */}
          {favoriteTools.length > 0 && (
            <section aria-label="Favoris">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-3.5 h-3.5 text-red-400 fill-current" />
                <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[#a3a3a3] dark:text-[#737373]">Favoris</h3>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {favoriteTools.map(tool => (
                  <li key={tool.href}><ToolCard {...tool} /></li>
                ))}
              </ul>
            </section>
          )}

          {/* Recently used */}
          {recentTools.length > 0 && (
            <section aria-label="Récemment utilisés">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-[#a3a3a3]" />
                <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[#a3a3a3] dark:text-[#737373]">Récemment utilisés</h3>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recentTools.map(tool => (
                  <li key={tool.href}><ToolCard {...tool} /></li>
                ))}
              </ul>
            </section>
          )}

          {/* Normal grouped layout */}
          {activeGroups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[#a3a3a3] dark:text-[#737373] mb-3">
                {group.label}
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.tools.map((tool) => (
                  <li key={tool.href}><ToolCard {...tool} /></li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
