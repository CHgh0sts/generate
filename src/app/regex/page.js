'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, X } from 'lucide-react';

const ACCENT = '#9333ea';

const CHEAT = [
  { cat: 'Quantificateurs', items: [
    { p: 'a*',    d: '0 ou plus de "a"' },
    { p: 'a+',    d: '1 ou plus de "a"' },
    { p: 'a?',    d: '0 ou 1 "a"' },
    { p: 'a{3}',  d: 'exactement 3 "a"' },
    { p: 'a{2,5}',d: 'de 2 à 5 "a"' },
    { p: 'a*?',   d: 'non-greedy' },
  ]},
  { cat: 'Classes', items: [
    { p: '.',     d: 'Tout caractère (sauf \\n)' },
    { p: '\\d',   d: 'Chiffre [0-9]' },
    { p: '\\w',   d: 'Alphanumérique + _' },
    { p: '\\s',   d: 'Espace, tab, newline' },
    { p: '\\D',   d: 'Non-chiffre' },
    { p: '[abc]', d: 'a, b ou c' },
    { p: '[^abc]',d: 'Ni a, ni b, ni c' },
    { p: '[a-z]', d: 'Lettre minuscule' },
  ]},
  { cat: 'Ancres', items: [
    { p: '^',     d: 'Début de ligne' },
    { p: '$',     d: 'Fin de ligne' },
    { p: '\\b',   d: 'Limite de mot' },
    { p: '\\B',   d: 'Non-limite de mot' },
  ]},
  { cat: 'Groupes', items: [
    { p: '(abc)', d: 'Groupe capturant' },
    { p: '(?:abc)',d:'Non-capturant' },
    { p: '(?=abc)',d:'Lookahead positif' },
    { p: '(?!abc)',d:'Lookahead négatif' },
    { p: 'a|b',   d: 'a ou b' },
  ]},
  { cat: 'Patterns utiles', items: [
    { p: '^[\\w.-]+@[\\w.-]+\\.\\w{2,}$', d: 'Email' },
    { p: '^(https?:\\/\\/)[\\w\\-]+(\\.\\w+)+', d: 'URL' },
    { p: '^\\d{4}-\\d{2}-\\d{2}$', d: 'Date YYYY-MM-DD' },
    { p: '^[0-9]{10}$', d: 'Téléphone 10 chiffres' },
    { p: '^(?=.*[A-Z])(?=.*\\d).{8,}$', d: 'Mot de passe fort' },
    { p: '<[^>]+>', d: 'Balises HTML' },
  ]},
];

function highlightMatches(text, regex) {
  if (!regex || !text) return [{ text, match: false }];
  try {
    const parts = []; let last = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) parts.push({ text: text.slice(last, m.index), match: false });
      parts.push({ text: m[0], match: true });
      last = m.index + m[0].length;
      if (!regex.global) break;
    }
    if (last < text.length) parts.push({ text: text.slice(last), match: false });
    return parts.length ? parts : [{ text, match: false }];
  } catch { return [{ text, match: false }]; }
}

export default function RegexPage() {
  const [pattern, setPattern] = useState('\\b\\w{4}\\b');
  const [flags, setFlags]     = useState({ g: true, i: false, m: false });
  const [testText, setTestText] = useState('Le regex tester avec une cheat sheet intégrée. Testez vos patterns ici !');
  const [replaceWith, setReplaceWith] = useState('***');
  const [showCheat, setShowCheat]     = useState(false);
  const [copied, setCopied]    = useState('');

  const copy = (t, id) => navigator.clipboard.writeText(t).then(() => { setCopied(id); setTimeout(() => setCopied(''), 1500); });

  const flagStr = Object.entries(flags).filter(([,v])=>v).map(([k])=>k).join('');

  const { regex, error, matches, replaced, parts } = useMemo(() => {
    if (!pattern) return { regex: null, error: null, matches: [], replaced: '', parts: [{text: testText, match: false}] };
    try {
      const r = new RegExp(pattern, flagStr);
      const ms = [...testText.matchAll(new RegExp(pattern, flagStr.includes('g') ? flagStr : flagStr + 'g'))];
      const rp = testText.replace(new RegExp(pattern, flagStr.includes('g') ? flagStr : flagStr + 'g'), replaceWith);
      return { regex: r, error: null, matches: ms, replaced: rp, parts: highlightMatches(testText, new RegExp(pattern, flagStr.includes('g') ? flagStr : flagStr + 'g')) };
    } catch (e) { return { regex: null, error: e.message, matches: [], replaced: '', parts: [{text:testText,match:false}] }; }
  }, [pattern, flagStr, testText, replaceWith]);

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Regex Tester</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Test, replace, cheat sheet</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCheat(!showCheat)} style={showCheat?{backgroundColor:ACCENT}:{}} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${showCheat?'text-white border-transparent':'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
              Cheat Sheet
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        {/* Pattern input */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Expression régulière</label>
            <div className="flex items-center gap-2">
              <span className="text-[#a3a3a3] text-xl font-mono">/</span>
              <input value={pattern} onChange={e => setPattern(e.target.value)}
                className={`flex-1 px-3 py-2.5 border rounded-lg text-sm font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2 ${error ? 'border-red-400' : 'border-[#e5e5e5] dark:border-[#262626]'}`}
                style={{ '--tw-ring-color': ACCENT }} />
              <span className="text-[#a3a3a3] text-xl font-mono">/</span>
              <div className="flex gap-1.5">
                {['g','i','m','s'].map(f => (
                  <button key={f} onClick={() => setFlags({...flags, [f]: !flags[f]})}
                    style={flags[f]?{backgroundColor:ACCENT}:{}}
                    className={`w-7 h-7 text-xs font-mono font-bold rounded border transition-colors ${flags[f]?'text-white border-transparent':'border-[#e5e5e5] dark:border-[#262626] text-[#737373] dark:text-[#a3a3a3]'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${error ? 'bg-red-100 text-red-600' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'}`}>
                {error ? <X className="inline w-3 h-3" /> : `${matches.length} match${matches.length !== 1 ? 's' : ''}`}
              </div>
            </div>
            {error && <p className="text-xs text-red-500 mt-1 font-mono">{error}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Texte à tester</label>
            <textarea rows={5} value={testText} onChange={e => setTestText(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none" />
          </div>

          {/* Highlighted result */}
          {pattern && !error && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Résultat</label>
              <div className="px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] text-sm font-mono leading-relaxed break-all">
                {parts.map((p, i) => p.match
                  ? <mark key={i} className="rounded px-0.5" style={{ backgroundColor: ACCENT + '33', color: ACCENT, fontWeight: 600 }}>{p.text}</mark>
                  : <span key={i} className="text-[#525252] dark:text-[#a3a3a3]">{p.text}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Replace */}
        {pattern && !error && (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Remplacer</p>
            <div className="flex gap-3">
              <input value={replaceWith} onChange={e => setReplaceWith(e.target.value)} placeholder="Texte de remplacement (ex: ***)"
                className="flex-1 px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none" />
              <button onClick={() => copy(replaced, 'rep')} style={copied==='rep'?{backgroundColor:'#10b981'}:{backgroundColor:ACCENT}} className="flex items-center gap-1 px-3 py-2 text-white text-xs font-semibold rounded-lg">{copied==='rep'?<><Check className="w-3 h-3" />Copié</>:'Copier'}</button>
            </div>
            <div className="px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] text-sm font-mono text-[#525252] dark:text-[#a3a3a3] break-all">{replaced}</div>
          </div>
        )}

        {/* Matches detail */}
        {matches.length > 0 && (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">{matches.length} correspondance{matches.length > 1 ? 's' : ''}</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {matches.map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] text-xs">
                  <span className="text-[#a3a3a3] w-5 text-right shrink-0">{i+1}</span>
                  <code className="font-mono" style={{ color: ACCENT }}>&ldquo;{m[0]}&rdquo;</code>
                  <span className="text-[#a3a3a3]">index: {m.index}</span>
                  {m.slice(1).map((g, j) => g !== undefined && <span key={j} className="text-[#737373]">G{j+1}: <code className="font-mono">{g}</code></span>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cheat sheet */}
        {showCheat && (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-4">Cheat Sheet Regex</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CHEAT.map(section => (
                <div key={section.cat}>
                  <p className="text-xs font-semibold text-[#171717] dark:text-[#ededed] mb-2">{section.cat}</p>
                  <div className="space-y-1">
                    {section.items.map(item => (
                      <div key={item.p} className="flex items-center gap-2 cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] px-2 py-1 rounded-lg group" onClick={() => setPattern(item.p)}>
                        <code className="text-xs font-mono shrink-0" style={{ color: ACCENT }}>{item.p}</code>
                        <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] group-hover:text-[#525252]">{item.d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
