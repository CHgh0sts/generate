'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Upload, Download, RefreshCw, Copy, Check } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#10b981';

const PLUGIN_LABELS = {
  removeDoctype:        'Supprimer DOCTYPE',
  removeXMLProcInst:    'Supprimer <?xml ...?>',
  removeViewBox:        'Supprimer viewBox',
  convertColors:        'Convertir les couleurs (rgb → hex)',
  cleanupNumericValues: 'Arrondir les valeurs numériques',
  mergePaths:           'Fusionner les chemins',
  convertShapeToPath:   'Convertir shapes → path',
  pretty:               'Sortie formatée (pretty print)',
};
const PLUGIN_DEFAULTS = {
  removeDoctype: true, removeXMLProcInst: true, removeViewBox: false,
  convertColors: true, cleanupNumericValues: true, mergePaths: true,
  convertShapeToPath: false, pretty: false,
};

function fmtBytes(n) {
  if (n < 1024) return `${n} o`;
  return `${(n / 1024).toFixed(2)} Ko`;
}

export default function SvgPage() {
  const [input, setInput]   = useState('');
  const [output, setOutput] = useState('');
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [plugins, setPlugins] = useState(PLUGIN_DEFAULTS);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();
  const pushToast = useToast();

  const togglePlugin = (k) => setPlugins(p => ({ ...p, [k]: !p[k] }));

  async function optimize() {
    if (!input.trim()) return;
    setLoading(true); setError(''); setOutput(''); setStats(null);
    try {
      const res = await fetch('/api/svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svg: input, plugins }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setOutput(data.svg);
      setStats({ original: data.originalSize, optimized: data.optimizedSize, saving: data.saving });
      pushToast?.(`Optimisé — ${data.saving}% plus léger`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function loadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInput(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  }

  function download() {
    const blob = new Blob([output], { type: 'image/svg+xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'optimized.svg'; a.click();
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true); pushToast?.('SVG copié !');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Optimiseur SVG</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Nettoyez et réduisez vos fichiers SVG avec SVGO</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-6 py-8 space-y-5">
        <div className="grid lg:grid-cols-[1fr_240px] gap-5">
          {/* Editor columns */}
          <div className="space-y-5">
            {/* Input / Output */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Input */}
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                  <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] flex-1">SVG source</span>
                  <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                    <Upload className="w-3 h-3" /> Charger
                  </button>
                  <input ref={fileRef} type="file" accept=".svg,image/svg+xml" onChange={loadFile} className="hidden" />
                </div>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\n  <path d="M12 2L2 22h20L12 2z"/>\n</svg>'}
                  className="flex-1 min-h-[280px] p-4 text-xs font-mono bg-transparent text-[#171717] dark:text-[#ededed] resize-none focus:outline-none"
                />
                {input && (
                  <div className="px-4 py-2 border-t border-[#f5f5f5] dark:border-[#1a1a1a] text-[10px] text-[#a3a3a3]">
                    Taille : {fmtBytes(new TextEncoder().encode(input).length)}
                  </div>
                )}
              </div>

              {/* Output */}
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                  <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] flex-1">SVG optimisé</span>
                  {output && (
                    <>
                      <button onClick={copyOutput} className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copier
                      </button>
                      <button onClick={download} className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                        <Download className="w-3 h-3" /> Télécharger
                      </button>
                    </>
                  )}
                </div>
                <textarea
                  readOnly value={output}
                  placeholder="Le SVG optimisé apparaîtra ici…"
                  className="flex-1 min-h-[280px] p-4 text-xs font-mono bg-transparent text-[#171717] dark:text-[#ededed] resize-none focus:outline-none placeholder:text-[#a3a3a3]"
                />
                {stats && (
                  <div className="px-4 py-2 border-t border-[#f5f5f5] dark:border-[#1a1a1a] text-[10px] text-[#a3a3a3]">
                    Taille : {fmtBytes(stats.optimized)}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Avant', fmtBytes(stats.original), '#737373'],
                  ['Après', fmtBytes(stats.optimized), ACCENT],
                  ['Gain', `${stats.saving}%`, stats.saving > 0 ? ACCENT : '#ef4444'],
                ].map(([label, value, color]) => (
                  <div key={label} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 text-center">
                    <div className="text-xl font-bold font-mono" style={{ color }}>{value}</div>
                    <div className="text-[10px] text-[#a3a3a3] mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Preview */}
            {(input || output) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {[['Avant', input], ['Après', output]].map(([label, svg]) => svg ? (
                  <div key={label} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
                    <p className="text-[10px] font-semibold text-[#a3a3a3] mb-3">{label}</p>
                    <div className="flex items-center justify-center h-32 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23f0f0f0%22/%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23f0f0f0%22/%3E%3C/svg%3E')] rounded-lg">
                      <div dangerouslySetInnerHTML={{ __html: svg }} className="max-w-full max-h-32 [&>svg]:max-w-full [&>svg]:max-h-32" />
                    </div>
                  </div>
                ) : null)}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <button onClick={optimize} disabled={!input.trim() || loading}
              style={{ backgroundColor: ACCENT }}
              className="w-full py-3 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Optimisation…' : 'Optimiser le SVG'}
            </button>
          </div>

          {/* Sidebar – options */}
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 h-fit">
            <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] mb-3">Options SVGO</p>
            <div className="space-y-2">
              {Object.entries(PLUGIN_LABELS).map(([k, label]) => (
                <label key={k} className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={plugins[k]} onChange={() => togglePlugin(k)}
                    className="mt-0.5 accent-emerald-500 shrink-0" />
                  <span className="text-xs text-[#525252] dark:text-[#a3a3a3] leading-tight">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
