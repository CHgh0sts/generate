'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, X, Download, ExternalLink } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#16a34a';

function syntaxHighlight(json) {
  return json
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'color:#d97706'; // number
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'color:#2563eb;font-weight:600' : 'color:#059669';
      else if (/true|false/.test(match)) cls = 'color:#7c3aed';
      else if (/null/.test(match)) cls = 'color:#ef4444';
      return `<span style="${cls}">${match}</span>`;
    });
}

function jsonToCsv(data) {
  const arr = Array.isArray(data) ? data : [data];
  if (!arr.length || typeof arr[0] !== 'object') throw new Error('Le JSON doit être un tableau d\'objets');
  const keys = [...new Set(arr.flatMap(Object.keys))];
  const rows = arr.map(r => keys.map(k => {
    const v = r[k];
    if (v === null || v === undefined) return '';
    const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g,'""')}"` : str;
  }).join(','));
  return [keys.join(','), ...rows].join('\n');
}

export default function JsonPage() {
  const [input, setInput]   = useState('');
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState('');
  const pushToast = useToast();

  const copy = (t, id='main') => navigator.clipboard.writeText(t).then(() => { setCopied(id); setTimeout(() => setCopied(''), 1500); });

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: null, data: null, error: null };
    try { return { ok: true, data: JSON.parse(input), error: null }; }
    catch (e) { return { ok: false, data: null, error: e.message }; }
  }, [input]);

  const formatted = useMemo(() => {
    if (!parsed.ok) return '';
    return JSON.stringify(parsed.data, null, indent);
  }, [parsed, indent]);

  const minified = useMemo(() => {
    if (!parsed.ok) return '';
    return JSON.stringify(parsed.data);
  }, [parsed]);

  const stats = useMemo(() => {
    if (!parsed.ok) return null;
    const str = JSON.stringify(parsed.data);
    const countKeys = (obj, depth = 0) => {
      let keys = 0, maxDepth = depth;
      if (Array.isArray(obj)) { obj.forEach(v => { const [k,d] = countKeys(v, depth+1); keys+=k; maxDepth=Math.max(maxDepth,d); }); }
      else if (obj && typeof obj === 'object') { Object.values(obj).forEach(v => { keys++; const [k,d] = countKeys(v, depth+1); keys+=k; maxDepth=Math.max(maxDepth,d); }); }
      return [keys, maxDepth];
    };
    const [keys, depth] = countKeys(parsed.data);
    return { size: new Blob([str]).size, keys, depth, type: Array.isArray(parsed.data) ? `Array (${parsed.data.length})` : typeof parsed.data };
  }, [parsed]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Retour" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">JSON Tools</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Formatter, validator, minifier, explorer</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">JSON brut</label>
              <div className="flex gap-2">
                <button onClick={() => setInput(JSON.stringify({example:'data',arr:[1,2,3],nested:{key:'value'}}))} className="text-xs text-[#737373] hover:text-[#525252] border border-[#e5e5e5] dark:border-[#262626] px-2 py-1 rounded-lg">Exemple</button>
                <button onClick={() => setInput('')} className="text-xs text-[#737373] hover:text-[#525252] border border-[#e5e5e5] dark:border-[#262626] px-2 py-1 rounded-lg">Effacer</button>
              </div>
            </div>
            <div className="relative">
              <textarea rows={18} value={input} onChange={e => setInput(e.target.value)} placeholder='{ "key": "value", "arr": [1, 2, 3] }'
                className={`w-full px-3 py-2.5 border rounded-xl text-sm font-mono bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none focus:ring-2 ${parsed.ok === false ? 'border-red-400 dark:border-red-700' : parsed.ok ? 'border-green-400 dark:border-green-700' : 'border-[#e5e5e5] dark:border-[#262626]'}`}
                style={{ '--tw-ring-color': ACCENT }} />
              {parsed.ok !== null && (
                <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold ${parsed.ok ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}>
                  {parsed.ok ? <><Check className="inline w-3 h-3 mr-0.5" />Valide</> : <><X className="inline w-3 h-3 mr-0.5" />Invalide</>}
                </div>
              )}
            </div>
            {parsed.error && <p className="text-xs text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">{parsed.error}</p>}
          </div>

          {/* Output */}
          <div className="space-y-3">
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  {l:'Type', v: stats.type},
                  {l:'Clés', v: stats.keys},
                  {l:'Profondeur', v: stats.depth},
                  {l:'Taille', v: stats.size > 1024 ? `${(stats.size/1024).toFixed(1)}Ko` : `${stats.size}o`},
                ].map(({l,v}) => (
                  <div key={l} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-2 text-center">
                    <p className="text-[10px] text-[#a3a3a3]">{l}</p>
                    <p className="text-sm font-semibold text-[#171717] dark:text-[#ededed] truncate">{v}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Formatted */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">Formaté</span>
                  <div className="flex gap-1">
                    {[2,4].map(n => (
                      <button key={n} onClick={() => setIndent(n)} style={indent===n?{backgroundColor:ACCENT}:{}} className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors ${indent===n?'text-white border-transparent':'border-[#e5e5e5] dark:border-[#262626] text-[#737373]'}`}>{n}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => formatted && copy(formatted)} style={copied==='main'?{backgroundColor:'#10b981'}:{backgroundColor:ACCENT}} className="px-2 py-1 text-white text-[10px] font-semibold rounded-md">
                  {copied==='main'?<><Check className="inline w-3 h-3 mr-0.5" />Copié</>:'Copier'}
                </button>
              </div>
              <div className="overflow-auto max-h-52 p-3">
                {formatted ? (
                  <pre className="text-xs font-mono leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: syntaxHighlight(formatted) }} />
                ) : <p className="text-xs text-[#a3a3a3] italic">Entrez du JSON valide…</p>}
              </div>
            </div>

            {/* Minified */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">Minifié</span>
                <div className="flex gap-2">
                  {parsed.ok && parsed.data && (
                    <>
                      <Link href="/data" onClick={() => { try { sessionStorage.setItem('data_from_json', input); } catch {} }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded-md text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                        <ExternalLink className="w-3 h-3" /> Convertir
                      </Link>
                      <button onClick={() => {
                        try {
                          const csv = jsonToCsv(parsed.data);
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'export.csv'; a.click();
                          pushToast?.('CSV exporté !');
                        } catch(e) { pushToast?.(e.message, 'error'); }
                      }} className="flex items-center gap-1 px-2 py-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded-md text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                        <Download className="w-3 h-3" /> CSV
                      </button>
                    </>
                  )}
                  <button onClick={() => minified && copy(minified, 'min')} style={copied==='min'?{backgroundColor:'#10b981'}:{backgroundColor:ACCENT}} className="px-2 py-1 text-white text-[10px] font-semibold rounded-md">
                    {copied==='min'?<Check className="inline w-3 h-3" />:'Copier'}
                  </button>
                </div>
              </div>
              <div className="p-3 max-h-24 overflow-auto">
                <code className="text-xs font-mono text-[#525252] dark:text-[#a3a3a3] break-all">{minified || <span className="italic text-[#a3a3a3]">—</span>}</code>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
