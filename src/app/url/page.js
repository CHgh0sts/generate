'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, X, XCircle, ArrowRight } from 'lucide-react';

const ACCENT = '#06b6d4';

function parseUrl(raw) {
  try { return new URL(raw); } catch { return null; }
}

export default function UrlPage() {
  const [tab, setTab]         = useState('encode'); // encode | decode | parse | build
  const [input, setInput]     = useState('');
  const [copied, setCopied]   = useState('');
  // Build tab
  const [scheme, setScheme]   = useState('https');
  const [host, setHost]       = useState('');
  const [path, setPath]       = useState('');
  const [params, setParams]   = useState([{ k: '', v: '' }]);
  const [fragment, setFragment] = useState('');

  const copy = (text, id = 'main') => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(''), 1500); });
  };

  const encoded = tab === 'encode' ? encodeURIComponent(input) : '';
  const decoded = tab === 'decode' ? (() => { try { return decodeURIComponent(input); } catch { return 'URL invalide'; } })() : '';
  const parsed  = tab === 'parse'  ? parseUrl(input) : null;

  const builtUrl = (() => {
    if (!host) return '';
    try {
      const u = new URL(`${scheme}://${host}${path || '/'}`);
      params.forEach(({ k, v }) => { if (k) u.searchParams.set(k, v); });
      if (fragment) u.hash = fragment;
      return u.toString();
    } catch { return ''; }
  })();

  const TABS = [
    { id: 'encode', label: 'Encoder' },
    { id: 'decode', label: 'Décoder' },
    { id: 'parse',  label: 'Analyser' },
    { id: 'build',  label: 'Construire' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Retour" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Outils URL</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Encoder, décoder, analyser, construire</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#e5e5e5] dark:border-[#262626]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setInput(''); }}
              style={tab === t.id ? { borderColor: ACCENT, color: ACCENT } : {}}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? '' : 'border-transparent text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Encode / Decode */}
        {(tab === 'encode' || tab === 'decode') && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 space-y-2">
              <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">
                {tab === 'encode' ? 'Texte / URL brute' : 'URL encodée'}
              </label>
              <textarea rows={8} value={input} onChange={e => setInput(e.target.value)} placeholder={tab === 'encode' ? 'https://example.com/path?q=hello world&lang=fr' : 'https%3A%2F%2Fexample.com%2F...'}
                className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none resize-none" />
            </div>
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">
                  {tab === 'encode' ? 'URL encodée' : 'URL décodée'}
                </label>
                <button onClick={() => copy(tab === 'encode' ? encoded : decoded)} style={copied === 'main' ? { backgroundColor: '#10b981' } : { backgroundColor: ACCENT }}
                  className="flex items-center gap-1 px-2.5 py-1 text-white text-[10px] font-semibold rounded-md">
                  {copied === 'main' ? <><Check className="w-3 h-3" />Copié</> : 'Copier'}
                </button>
              </div>
              <textarea rows={8} readOnly value={tab === 'encode' ? encoded : decoded}
                className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none resize-none" />
            </div>
          </div>
        )}

        {/* Parse */}
        {tab === 'parse' && (
          <div className="space-y-4">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="https://example.com/path?foo=bar&baz=qux#anchor"
              className="w-full px-4 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-sm font-mono bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': ACCENT }} />
            {parsed ? (
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
                {[
                  ['Protocole',    parsed.protocol.replace(':','')],
                  ['Hôte',        parsed.hostname],
                  ['Port',        parsed.port || '(défaut)'],
                  ['Chemin',      parsed.pathname],
                  ['Fragment',    parsed.hash || '(aucun)'],
                  ['Origin',      parsed.origin],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-4 py-2.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a] last:border-0">
                    <span className="text-xs text-[#737373] dark:text-[#a3a3a3] w-24 shrink-0">{k}</span>
                    <code className="text-xs font-mono text-[#171717] dark:text-[#ededed] flex-1 text-right">{v}</code>
                  </div>
                ))}
                {parsed.searchParams.size > 0 && (
                  <div className="px-4 py-3 bg-[#fafafa] dark:bg-[#0a0a0a] border-t border-[#e5e5e5] dark:border-[#262626]">
                    <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] mb-2">Paramètres ({parsed.searchParams.size})</p>
                    <div className="space-y-1.5">
                      {[...parsed.searchParams].map(([k, v]) => (
                        <div key={k} className="flex gap-3 text-xs">
                          <code className="font-mono font-semibold text-[#171717] dark:text-[#ededed]" style={{ color: ACCENT }}>{k}</code>
                          <span className="text-[#737373]">=</span>
                          <code className="font-mono text-[#525252] dark:text-[#a3a3a3]">{v}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : input ? (
              <p className="text-sm text-red-500 flex items-center gap-1"><XCircle className="w-4 h-4" /> URL invalide</p>
            ) : null}
          </div>
        )}

        {/* Build */}
        {tab === 'build' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1 block">Protocole</label>
                <select value={scheme} onChange={e => setScheme(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed]">
                  <option>https</option><option>http</option><option>ftp</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1 block">Hôte</label>
                <input value={host} onChange={e => setHost(e.target.value)} placeholder="example.com" className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] font-mono focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1 block">Chemin</label>
              <input value={path} onChange={e => setPath(e.target.value)} placeholder="/api/v1/users" className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] font-mono focus:outline-none" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-[#737373] dark:text-[#a3a3a3] font-medium">Paramètres de requête</label>
                <button onClick={() => setParams([...params, { k: '', v: '' }])} style={{ color: ACCENT }} className="text-xs font-semibold">+ Ajouter</button>
              </div>
              <div className="space-y-2">
                {params.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input placeholder="clé" value={p.k} onChange={e => setParams(params.map((x, j) => j === i ? { ...x, k: e.target.value } : x))} className="flex-1 px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] font-mono focus:outline-none" />
                    <input placeholder="valeur" value={p.v} onChange={e => setParams(params.map((x, j) => j === i ? { ...x, v: e.target.value } : x))} className="flex-1 px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] font-mono focus:outline-none" />
                    <button onClick={() => setParams(params.filter((_, j) => j !== i))} className="text-[#a3a3a3] hover:text-red-500 px-2"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1 block">Fragment (#anchor)</label>
              <input value={fragment} onChange={e => setFragment(e.target.value)} placeholder="section-id" className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] font-mono focus:outline-none" />
            </div>
            {builtUrl && (
              <div className="bg-[#fafafa] dark:bg-[#0a0a0a] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">URL générée</p>
                  <button onClick={() => copy(builtUrl)} style={copied === 'main' ? { backgroundColor: '#10b981' } : { backgroundColor: ACCENT }} className="flex items-center gap-1 px-2.5 py-1 text-white text-[10px] font-semibold rounded-md">{copied === 'main' ? <><Check className="w-3 h-3" />Copié</> : 'Copier'}</button>
                </div>
                <code className="text-sm font-mono text-[#171717] dark:text-[#ededed] break-all">{builtUrl}</code>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
