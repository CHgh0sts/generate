'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Copy, Check, Plus, Trash2, Download } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#64748b';

const CRAWLERS = [
  { id: 'all',        label: 'Tous les robots',          ua: '*' },
  { id: 'google',     label: 'Googlebot',                ua: 'Googlebot' },
  { id: 'googleimg',  label: 'Googlebot-Image',          ua: 'Googlebot-Image' },
  { id: 'bing',       label: 'Bingbot',                  ua: 'Bingbot' },
  { id: 'yandex',     label: 'YandexBot',                ua: 'YandexBot' },
  { id: 'duckduck',   label: 'DuckDuckBot',              ua: 'DuckDuckBot' },
  { id: 'gpt',        label: 'GPTBot (OpenAI)',          ua: 'GPTBot' },
  { id: 'ccbot',      label: 'CCBot (Common Crawl)',     ua: 'CCBot' },
  { id: 'anthropic',  label: 'Claude-Web (Anthropic)',   ua: 'Claude-Web' },
  { id: 'perplexity', label: 'PerplexityBot',            ua: 'PerplexityBot' },
];

const COMMON_PATHS = ['/admin','/api/','/private/','/tmp/','/cgi-bin/','/wp-admin/','/wp-login.php','/search','/login','/dashboard'];

let nextId = 1;
function uid() { return nextId++; }

export default function RobotsPage() {
  const [blocks, setBlocks] = useState([
    { id: uid(), ua: '*', allows: [], disallows: ['/admin/', '/private/'] }
  ]);
  const [sitemapUrl, setSitemapUrl] = useState('https://example.com/sitemap.xml');
  const [crawlDelay, setCrawlDelay] = useState('');
  const [copied, setCopied] = useState(false);
  const pushToast = useToast();

  const addBlock = () => setBlocks(prev => [...prev, { id: uid(), ua: '*', allows: [], disallows: [] }]);
  const removeBlock = (id) => setBlocks(prev => prev.filter(b => b.id !== id));
  const updateBlock = (id, k, v) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, [k]: v } : b));
  const addPath = (id, type) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, [type]: [...b[type], ''] } : b));
  const updatePath = (id, type, idx, val) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, [type]: b[type].map((p, i) => i === idx ? val : p) } : b));
  const removePath = (id, type, idx) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, [type]: b[type].filter((_, i) => i !== idx) } : b));

  const output = useMemo(() => {
    const lines = [];
    blocks.forEach(b => {
      lines.push(`User-agent: ${b.ua}`);
      if (crawlDelay) lines.push(`Crawl-delay: ${crawlDelay}`);
      b.disallows.forEach(p => p && lines.push(`Disallow: ${p}`));
      b.allows.forEach(p => p && lines.push(`Allow: ${p}`));
      if (!b.disallows.length && !b.allows.length) lines.push('Disallow:');
      lines.push('');
    });
    if (sitemapUrl) lines.push(`Sitemap: ${sitemapUrl}`);
    return lines.join('\n').trim();
  }, [blocks, sitemapUrl, crawlDelay]);

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true); pushToast?.('Copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'robots.txt'; a.click();
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Générateur robots.txt</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Contr&ocirc;lez l&apos;indexation de votre site</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Builder */}
          <div className="space-y-4">
            {blocks.map((b, bi) => (
              <div key={b.id} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">Bloc {bi + 1}</span>
                  {blocks.length > 1 && (
                    <button onClick={() => removeBlock(b.id)} className="text-red-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-[#a3a3a3] mb-1 block">User-agent</label>
                  <select value={b.ua} onChange={e => updateBlock(b.id, 'ua', e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed]">
                    {CRAWLERS.map(c => <option key={c.id} value={c.ua}>{c.label}</option>)}
                  </select>
                </div>

                {(['disallows', 'allows']).map(type => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-[#a3a3a3]">{type === 'disallows' ? 'Disallow' : 'Allow'}</span>
                      <button onClick={() => addPath(b.id, type)} className="text-[10px] flex items-center gap-0.5" style={{ color: ACCENT }}>
                        <Plus className="w-3 h-3" /> Ajouter
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {b[type].map((path, pi) => (
                        <div key={pi} className="flex gap-2">
                          <input value={path} onChange={e => updatePath(b.id, type, pi, e.target.value)}
                            list={`paths-${b.id}-${type}`}
                            placeholder="/chemin/"
                            className="flex-1 px-2 py-1.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-xs font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none" />
                          <datalist id={`paths-${b.id}-${type}`}>
                            {COMMON_PATHS.map(p => <option key={p} value={p} />)}
                          </datalist>
                          <button onClick={() => removePath(b.id, type, pi)} className="text-[#a3a3a3] hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <button onClick={addBlock}
              className="w-full py-2.5 border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl text-xs text-[#a3a3a3] hover:text-[#737373] flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Ajouter un bloc User-agent
            </button>

            {/* Global options */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 space-y-3">
              <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">Options globales</p>
              <div>
                <label className="text-[10px] text-[#a3a3a3] mb-1 block">URL du Sitemap</label>
                <input value={sitemapUrl} onChange={e => setSitemapUrl(e.target.value)}
                  placeholder="https://example.com/sitemap.xml"
                  className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-xs font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-[#a3a3a3] mb-1 block">Crawl-delay (secondes, optionnel)</label>
                <input type="number" value={crawlDelay} onChange={e => setCrawlDelay(e.target.value)} min={0}
                  placeholder="ex: 10"
                  className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-xs font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#0a0a0a] dark:bg-[#000] rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]">
              <span className="text-xs font-mono text-[#525252]">robots.txt</span>
              <div className="flex gap-2">
                <button onClick={copy} className="flex items-center gap-1 text-[10px] text-[#737373] hover:text-[#a3a3a3]">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copier
                </button>
                <button onClick={download} className="flex items-center gap-1 text-[10px] text-[#737373] hover:text-[#a3a3a3]">
                  <Download className="w-3 h-3" /> Télécharger
                </button>
              </div>
            </div>
            <pre className="flex-1 p-4 text-xs font-mono text-[#a3a3a3] overflow-auto min-h-[400px] whitespace-pre">
              {output}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
