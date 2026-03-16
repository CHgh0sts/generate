'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, Download } from 'lucide-react';

const ACCENT = '#c026d3';

// ── Minifiers ─────────────────────────────────────────────────────────────────

function minifyHTML(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')                // remove comments
    .replace(/\s*\n\s*/g, ' ')                       // collapse newlines
    .replace(/>\s+</g, '><')                         // remove whitespace between tags
    .replace(/\s{2,}/g, ' ')                         // collapse spaces
    .replace(/\s*=\s*/g, '=')                        // remove spaces around =
    .trim();
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')               // remove comments
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')           // remove spaces around symbols
    .replace(/;\s*}/g, '}')                          // remove last semicolon in block
    .replace(/\s{2,}/g, ' ')                         // collapse spaces
    .replace(/\n/g, '')                              // remove newlines
    .trim();
}

function minifyJS(js) {
  // Basic: remove single-line comments, collapse whitespace (not full AST)
  return js
    .replace(/\/\/[^\n]*/g, '')                      // remove // comments
    .replace(/\/\*[\s\S]*?\*\//g, '')               // remove /* */ comments
    .replace(/\s*([=+\-*/%&|^~<>!?:;,{}()[\]])\s*/g, '$1') // spaces around operators
    .replace(/\s{2,}/g, ' ')                         // collapse spaces
    .replace(/\n/g, '')                              // remove newlines
    .trim();
}

function minifyJSON(json) {
  try { return JSON.stringify(JSON.parse(json)); }
  catch (e) { throw new Error('JSON invalide : ' + e.message); }
}

// ── Beautifiers ───────────────────────────────────────────────────────────────

function beautifyHTML(html, indent = 2) {
  const tab = ' '.repeat(indent);
  const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
  let result = '', depth = 0;
  const tokens = html.match(/<[^>]+>|[^<]+/g) || [];
  for (const tok of tokens) {
    const text = tok.trim();
    if (!text) continue;
    if (tok.startsWith('</')) {
      depth = Math.max(0, depth - 1);
      result += tab.repeat(depth) + tok.trim() + '\n';
    } else if (tok.startsWith('<') && !tok.startsWith('<!') && !tok.startsWith('<?')) {
      const tag = (tok.match(/<(\w+)/) || [])[1] || '';
      result += tab.repeat(depth) + tok.trim() + '\n';
      if (!VOID.test(tag) && !tok.endsWith('/>')) depth++;
    } else {
      if (text) result += tab.repeat(depth) + text + '\n';
    }
  }
  return result.trim();
}

function beautifyCSS(css, indent = 2) {
  const tab = ' '.repeat(indent);
  return css
    .replace(/\s*\{\s*/g, ' {\n' + tab)
    .replace(/;\s*/g, ';\n' + tab)
    .replace(/\s*}\s*/g, '\n}\n\n')
    .replace(/,\s*/g, ',\n')
    .split('\n').map(l => l.trimEnd()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function beautifyJS(js, indent = 2) {
  const tab = ' '.repeat(indent);
  let result = '', depth = 0;
  let inStr = false, strChar = '';
  for (let i = 0; i < js.length; i++) {
    const c = js[i];
    if (inStr) {
      result += c;
      if (c === strChar && js[i-1] !== '\\') inStr = false;
    } else if (c === '"' || c === "'" || c === '`') {
      result += c; inStr = true; strChar = c;
    } else if (c === '{' || c === '[') {
      result += c + '\n' + tab.repeat(++depth);
    } else if (c === '}' || c === ']') {
      result = result.trimEnd() + '\n' + tab.repeat(Math.max(0, --depth)) + c;
    } else if (c === ';') {
      result += c + '\n' + tab.repeat(depth);
    } else {
      result += c;
    }
  }
  return result.split('\n').map(l => l.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function beautifyJSON(json, indent = 2) {
  try { return JSON.stringify(JSON.parse(json), null, indent); }
  catch (e) { throw new Error('JSON invalide : ' + e.message); }
}

// ── Component ─────────────────────────────────────────────────────────────────

const LANGS = ['HTML', 'CSS', 'JavaScript', 'JSON'];

export default function MinifyPage() {
  const [lang, setLang]     = useState('HTML');
  const [input, setInput]   = useState('');
  const [action, setAction] = useState('minify'); // minify | beautify
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);

  const copy = (t) => navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });

  const { output, error, stats } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null, stats: null };
    try {
      let out = '';
      if (action === 'minify') {
        if (lang === 'HTML') out = minifyHTML(input);
        else if (lang === 'CSS') out = minifyCSS(input);
        else if (lang === 'JavaScript') out = minifyJS(input);
        else out = minifyJSON(input);
      } else {
        if (lang === 'HTML') out = beautifyHTML(input, indent);
        else if (lang === 'CSS') out = beautifyCSS(input, indent);
        else if (lang === 'JavaScript') out = beautifyJS(input, indent);
        else out = beautifyJSON(input, indent);
      }
      const ratio = input.length > 0 ? Math.round((1 - out.length / input.length) * 100) : 0;
      return { output: out, error: null, stats: { before: input.length, after: out.length, ratio } };
    } catch (e) {
      return { output: '', error: e.message, stats: null };
    }
  }, [input, lang, action, indent]);

  const download = () => {
    const ext = lang === 'HTML' ? 'html' : lang === 'CSS' ? 'css' : lang === 'JavaScript' ? 'js' : 'json';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([output], { type: 'text/plain' }));
    a.download = `output.${ext}`; a.click();
  };

  const EXAMPLES = {
    HTML: `<!DOCTYPE html>\n<html lang="fr">\n  <head>\n    <!-- Meta tags -->\n    <meta charset="UTF-8">\n    <title>Page titre</title>\n    <link rel="stylesheet" href="style.css">\n  </head>\n  <body>\n    <header>\n      <h1>Bienvenue</h1>\n    </header>\n    <main>\n      <p>Contenu principal de la page.</p>\n    </main>\n  </body>\n</html>`,
    CSS: `body {\n  margin: 0;\n  padding: 0;\n  font-family: system-ui, sans-serif;\n  color: #171717;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 0 1rem;\n}\n\n@media (max-width: 768px) {\n  .container {\n    padding: 0 0.5rem;\n  }\n}`,
    JavaScript: `function fetchUser(id) {\n  const url = \`/api/users/\${id}\`;\n  return fetch(url)\n    .then(res => {\n      if (!res.ok) throw new Error('Not found');\n      return res.json();\n    })\n    .then(data => {\n      console.log('User:', data);\n      return data;\n    });\n}`,
    JSON: `{\n  "name": "generate",\n  "version": "1.0.0",\n  "tools": [\n    { "id": "convert", "label": "Convertisseur" },\n    { "id": "hash", "label": "Hash" }\n  ],\n  "active": true\n}`,
  };

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Minify / Beautify</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">HTML, CSS, JavaScript, JSON</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Language */}
          <div className="flex gap-1">
            {LANGS.map(l => (
              <button key={l} onClick={() => { setLang(l); setInput(''); }}
                style={lang === l ? { backgroundColor: ACCENT } : {}}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-colors ${lang === l ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                {l}
              </button>
            ))}
          </div>
          {/* Action */}
          <div className="flex gap-1 border border-[#e5e5e5] dark:border-[#262626] rounded-lg p-0.5 bg-white dark:bg-[#171717]">
            {[{id:'minify',label:'Minifier'},{id:'beautify',label:'Formater'}].map(a => (
              <button key={a.id} onClick={() => setAction(a.id)}
                style={action === a.id ? { backgroundColor: ACCENT } : {}}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${action === a.id ? 'text-white' : 'text-[#737373] dark:text-[#a3a3a3]'}`}>
                {a.label}
              </button>
            ))}
          </div>
          {/* Indent (beautify only) */}
          {action === 'beautify' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">Indentation</span>
              {[2, 4].map(n => (
                <button key={n} onClick={() => setIndent(n)}
                  style={indent === n ? { backgroundColor: ACCENT } : {}}
                  className={`w-7 h-7 rounded-lg text-xs font-mono border transition-colors ${indent === n ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#737373]'}`}>
                  {n}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setInput(EXAMPLES[lang] || '')} className="ml-auto text-xs text-[#737373] hover:text-[#525252] border border-[#e5e5e5] dark:border-[#262626] px-3 py-1.5 rounded-lg">
            Exemple
          </button>
        </div>

        {/* Editors */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Code source</label>
              <button onClick={() => setInput('')} className="text-xs text-[#a3a3a3] hover:text-[#737373]">Effacer</button>
            </div>
            <textarea rows={20} value={input} onChange={e => setInput(e.target.value)}
              placeholder={`Collez votre code ${lang} ici…`}
              className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-sm font-mono bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none focus:ring-2 leading-relaxed"
              style={{ '--tw-ring-color': ACCENT }}
              spellCheck={false} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Résultat</label>
              <div className="flex gap-2">
                {output && <button onClick={download} className="flex items-center gap-1 text-xs text-[#737373] hover:text-[#525252] border border-[#e5e5e5] dark:border-[#262626] px-2 py-1 rounded-lg"><Download className="w-3 h-3" /> Télécharger</button>}
                <button onClick={() => output && copy(output)} disabled={!output}
                  style={copied ? { backgroundColor: '#10b981' } : { backgroundColor: ACCENT }}
                  className="flex items-center gap-1 px-2.5 py-1 text-white text-xs font-semibold rounded-md disabled:opacity-30">
                  {copied ? <><Check className="w-3 h-3" /> Copié</> : 'Copier'}
                </button>
              </div>
            </div>
            {error ? (
              <div className="h-full min-h-[20rem] flex items-start p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-mono">{error}</div>
            ) : (
              <textarea rows={20} readOnly value={output}
                placeholder={`Le code ${action === 'minify' ? 'minifié' : 'formaté'} apparaîtra ici…`}
                className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-sm font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none leading-relaxed"
                spellCheck={false} />
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Taille originale', val: `${stats.before.toLocaleString()} car.` },
              { label: action === 'minify' ? 'Taille minifiée' : 'Taille formatée', val: `${stats.after.toLocaleString()} car.` },
              { label: action === 'minify' ? 'Réduction' : 'Différence', val: `${stats.ratio > 0 ? '-' : stats.ratio < 0 ? '+' : ''}${Math.abs(stats.ratio)}%`, color: stats.ratio > 0 ? '#10b981' : '#ef4444' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-3 text-center">
                <p className="text-[10px] text-[#a3a3a3] mb-1">{label}</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: color || ACCENT }}>{val}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
