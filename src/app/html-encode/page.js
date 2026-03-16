'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Copy, Check, ArrowLeftRight } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#db2777';

function encode(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

function encodeAll(str) {
  return [...str].map(c => {
    const code = c.codePointAt(0);
    if (code < 128 && /[a-zA-Z0-9 ]/.test(c)) return c;
    return `&#${code};`;
  }).join('');
}

function decode(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

const ENTITIES = [
  ['&amp;','&'],['&lt;','<'],['&gt;','>'],['&quot;','"'],['&#39;',"'"],[' ',' '],
  ['&copy;','©'],['&reg;','®'],['&trade;','™'],['&euro;','€'],['&pound;','£'],
  ['&yen;','¥'],['&cent;','¢'],['&mdash;','—'],['&ndash;','–'],['&hellip;','…'],
  ['&laquo;','«'],['&raquo;','»'],['&bull;','•'],['&sect;','§'],['&para;','¶'],
  ['&dagger;','†'],['&Dagger;','‡'],['&permil;','‰'],['&lsquo;','\u2018'],['&rsquo;','\u2019'],
  ['&ldquo;','\u201C'],['&rdquo;','\u201D'],['&times;','×'],['&divide;','÷'],
];

export default function HtmlEncodePage() {
  const [mode, setMode]     = useState('encode'); // encode | decode | encodeAll
  const [input, setInput]   = useState('');
  const [copied, setCopied] = useState(false);
  const pushToast = useToast();

  const output = useMemo(() => {
    if (!input) return '';
    if (mode === 'encode') return encode(input);
    if (mode === 'encodeAll') return encodeAll(input);
    try { return decode(input); } catch { return 'Erreur de décodage'; }
  }, [input, mode]);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true); pushToast?.('Copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const MODES = [
    { id: 'encode',    label: 'Encoder (essentiel)' },
    { id: 'encodeAll', label: 'Encoder tout' },
    { id: 'decode',    label: 'Décoder' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Encodeur HTML</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Encodez/décodez les entités HTML</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {/* Mode */}
        <div className="flex gap-1 flex-wrap">
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setInput(''); }}
              style={mode === m.id ? { backgroundColor: ACCENT } : {}}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${mode === m.id ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
              <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">
                {mode === 'decode' ? 'HTML encodé' : 'Texte brut'}
              </span>
              <span className="text-[10px] text-[#a3a3a3]">{input.length} car.</span>
            </div>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={12}
              placeholder={mode === 'decode' ? '&lt;p&gt;Hello &amp; world&lt;/p&gt;' : '<p>Hello & world "test" \'ok\'</p>'}
              className="flex-1 p-4 text-sm font-mono bg-transparent text-[#171717] dark:text-[#ededed] resize-none focus:outline-none" />
          </div>
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
              <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">
                {mode === 'decode' ? 'Texte décodé' : 'HTML encodé'}
              </span>
              <div className="flex gap-2">
                {output && (
                  <button onClick={() => { setInput(output); setMode(mode === 'decode' ? 'encode' : 'decode'); }}
                    className="text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-0.5 text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] flex items-center gap-1">
                    <ArrowLeftRight className="w-3 h-3" /> Inverser
                  </button>
                )}
                {output && (
                  <button onClick={() => copy(output)}
                    className="text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-0.5 text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] flex items-center gap-1">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copier
                  </button>
                )}
              </div>
            </div>
            <textarea readOnly value={output} rows={12}
              placeholder="Le résultat apparaîtra ici…"
              className="flex-1 p-4 text-sm font-mono bg-transparent text-[#171717] dark:text-[#ededed] resize-none focus:outline-none placeholder:text-[#a3a3a3]" />
          </div>
        </div>

        {/* Reference table */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Référence des entités courantes</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {ENTITIES.map(([entity, char]) => (
              <button key={entity} onClick={() => { setInput(prev => prev + entity); }}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors text-left">
                <code className="text-xs font-mono text-[#525252] dark:text-[#a3a3a3]">{entity}</code>
                <span className="text-sm font-bold text-[#171717] dark:text-[#ededed]">{char}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
