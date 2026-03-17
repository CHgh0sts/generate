'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check } from 'lucide-react';

const ACCENT = '#f472b6';

const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

function generateLorem(type, qty) {
  const words = () => Array.from({length: qty}, (_, i) => { const w = LOREM_WORDS[(i) % LOREM_WORDS.length]; return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w; }).join(' ') + '.';
  if (type === 'words') return Array.from({length: qty}, (_, i) => LOREM_WORDS[i % LOREM_WORDS.length]).join(' ');
  if (type === 'sentences') return Array.from({length: qty}, (_, i) => {
    const len = 8 + (i % 7);
    return Array.from({length: len}, (__, j) => { const w = LOREM_WORDS[(i * 7 + j) % LOREM_WORDS.length]; return j === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w; }).join(' ') + '.';
  }).join(' ');
  if (type === 'paragraphs') return Array.from({length: qty}, (_, i) => {
    const sCount = 3 + (i % 4);
    return Array.from({length: sCount}, (__, s) => {
      const len = 8 + (s % 8);
      return Array.from({length: len}, (___, j) => { const w = LOREM_WORDS[((i*4+s)*7+j) % LOREM_WORDS.length]; return j === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w; }).join(' ') + '.';
    }).join(' ');
  }).join('\n\n');
  return words();
}

function textStats(text) {
  if (!text) return { chars: 0, charsNoSpace: 0, words: 0, sentences: 0, paragraphs: 0, lines: 0, readTime: 0 };
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return {
    chars: text.length,
    charsNoSpace: text.replace(/\s/g, '').length,
    words,
    sentences: text.split(/[.!?]+/).filter(s => s.trim()).length,
    paragraphs: text.split(/\n\s*\n/).filter(Boolean).length,
    lines: text.split('\n').length,
    readTime: Math.max(1, Math.ceil(words / 200)),
  };
}

// LCS-based diff for arrays
function lcs(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const seq = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i-1] === b[j-1]) { seq.unshift({ type: 'same', val: a[i-1] }); i--; j--; }
    else if (dp[i-1][j] > dp[i][j-1]) { seq.unshift({ type: 'del', val: a[i-1] }); i--; }
    else { seq.unshift({ type: 'add', val: b[j-1] }); j--; }
  }
  while (i > 0) { seq.unshift({ type: 'del', val: a[i-1] }); i--; }
  while (j > 0) { seq.unshift({ type: 'add', val: b[j-1] }); j--; }
  return seq;
}

// Word-level highlighting for changed lines
function wordDiff(textA, textB) {
  const wA = textA.split(/(\s+)/);
  const wB = textB.split(/(\s+)/);
  if (wA.length > 200 || wB.length > 200) return null; // fallback for large lines
  return lcs(wA, wB);
}

// Line-based diff with word-level highlighting
function computeDiff(a, b) {
  const aLines = a.split('\n');
  const bLines = b.split('\n');

  // Use LCS on lines (limit for performance)
  if (aLines.length > 500 || bLines.length > 500) {
    const result = [];
    let i = 0, j = 0;
    while (i < aLines.length || j < bLines.length) {
      if (i >= aLines.length) { result.push({ type: 'add', text: bLines[j++] }); continue; }
      if (j >= bLines.length) { result.push({ type: 'del', text: aLines[i++] }); continue; }
      if (aLines[i] === bLines[j]) { result.push({ type: 'same', text: aLines[i] }); i++; j++; }
      else { result.push({ type: 'del', text: aLines[i++] }); result.push({ type: 'add', text: bLines[j++] }); }
    }
    return result;
  }

  const lineDiff = lcs(aLines, bLines);
  const result = [];

  // Pair up consecutive del/add for word-level highlight
  for (let k = 0; k < lineDiff.length; k++) {
    const cur = lineDiff[k];
    const nxt = lineDiff[k + 1];
    if (cur.type === 'del' && nxt?.type === 'add') {
      const words = wordDiff(cur.val, nxt.val);
      result.push({ type: 'del', text: cur.val, words });
      result.push({ type: 'add', text: nxt.val, words: words ? lcs(cur.val.split(/(\s+)/), nxt.val.split(/(\s+)/)) : null });
      k++;
    } else {
      result.push({ type: cur.type === 'same' ? 'same' : cur.type, text: cur.val });
    }
  }
  return result;
}

function DiffLine({ line }) {
  const bg = line.type === 'add' ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300'
           : line.type === 'del' ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300'
           : 'text-[#525252] dark:text-[#a3a3a3]';
  const sign = line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' ';

  if (!line.words) {
    return (
      <div className={`px-4 py-1 flex gap-3 ${bg}`}>
        <span className="select-none shrink-0 w-4 text-center">{sign}</span>
        <span className="whitespace-pre-wrap break-all">{line.text || ' '}</span>
      </div>
    );
  }

  // Word-level highlights
  const isAdd = line.type === 'add';
  const tokens = line.words.filter(w => w.type === 'same' || w.type === (isAdd ? 'add' : 'del'));
  return (
    <div className={`px-4 py-1 flex gap-3 ${bg}`}>
      <span className="select-none shrink-0 w-4 text-center">{sign}</span>
      <span className="whitespace-pre-wrap break-all">
        {tokens.map((w, i) => (
          w.type === 'same'
            ? <span key={i}>{w.val}</span>
            : <mark key={i} className={`rounded px-0.5 ${isAdd ? 'bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100' : 'bg-red-300 dark:bg-red-700 text-red-900 dark:text-red-100'}`}>{w.val}</mark>
        ))}
      </span>
    </div>
  );
}

const TEXT_FROM_OCR_KEY = 'text_from_ocr';

export default function TextPage() {
  const [tab, setTab]       = useState('lorem');
  const [loremType, setLoremType] = useState('paragraphs');
  const [loremQty, setLoremQty]   = useState(3);
  const [loremText, setLoremText] = useState(() => generateLorem('paragraphs', 3));
  const [countText, setCountText] = useState('');
  const [diffA, setDiffA]   = useState('');
  const [diffB, setDiffB]   = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const fromOcr = sessionStorage.getItem(TEXT_FROM_OCR_KEY);
      if (fromOcr) {
        setCountText(fromOcr);
        setTab('count');
        sessionStorage.removeItem(TEXT_FROM_OCR_KEY);
      }
    } catch {}
  }, []);

  const stats = useMemo(() => textStats(countText), [countText]);
  const diff  = useMemo(() => diffA || diffB ? computeDiff(diffA, diffB) : [], [diffA, diffB]);

  const copy = (text) => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });

  const TABS = [
    { id: 'lorem',  label: 'Lorem ipsum' },
    { id: 'count',  label: 'Compteur' },
    { id: 'diff',   label: 'Diff texte' },
  ];

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Outils texte</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Lorem ipsum, compteur, diff</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        <div className="flex gap-1 border-b border-[#e5e5e5] dark:border-[#262626]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={tab === t.id ? { borderColor: ACCENT, color: ACCENT } : {}}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? '' : 'border-transparent text-[#737373] dark:text-[#a3a3a3]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Lorem ipsum */}
        {tab === 'lorem' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-3">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-xs text-[#737373] dark:text-[#a3a3a3] block mb-1">Type</label>
                  <select value={loremType} onChange={e => setLoremType(e.target.value)} className="px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed]">
                    <option value="words">Mots</option>
                    <option value="sentences">Phrases</option>
                    <option value="paragraphs">Paragraphes</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#737373] dark:text-[#a3a3a3] block mb-1">Quantité</label>
                  <input type="number" value={loremQty} onChange={e => setLoremQty(Math.max(1, Math.min(50, Number(e.target.value))))} min={1} max={50}
                    className="w-20 px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-center" />
                </div>
                <button onClick={() => setLoremText(generateLorem(loremType, loremQty))} style={{ backgroundColor: ACCENT }} className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90">
                  Générer
                </button>
                <button onClick={() => copy(loremText)} style={copied ? { backgroundColor: '#10b981' } : {}} className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${copied ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                  {copied ? <><Check className="inline w-3 h-3 mr-0.5" />Copié</> : 'Copier'}
                </button>
              </div>
              <textarea rows={12} readOnly value={loremText} className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-[#fafafa] dark:bg-[#0a0a0a] text-[#525252] dark:text-[#a3a3a3] resize-none leading-relaxed" />
            </div>
          </div>
        )}

        {/* Compteur */}
        {tab === 'count' && (
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
              <textarea rows={16} value={countText} onChange={e => setCountText(e.target.value)} placeholder="Collez ou tapez votre texte ici…"
                className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] resize-none leading-relaxed focus:outline-none" />
            </div>
            <div className="space-y-3">
              {[
                { label: 'Caractères',            val: stats.chars },
                { label: 'Car. sans espaces',     val: stats.charsNoSpace },
                { label: 'Mots',                  val: stats.words },
                { label: 'Phrases',               val: stats.sentences },
                { label: 'Paragraphes',           val: stats.paragraphs },
                { label: 'Lignes',                val: stats.lines },
                { label: 'Temps de lecture',      val: `≈ ${stats.readTime} min` },
              ].map(({ label, val }) => (
                <div key={label} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">{label}</span>
                  <span className="text-lg font-bold tabular-nums" style={{ color: ACCENT }}>{val}</span>
                </div>
              ))}
              <button onClick={() => setCountText('')} className="w-full py-2 text-xs border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">Effacer</button>
            </div>
          </div>
        )}

        {/* Diff */}
        {tab === 'diff' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1.5 uppercase tracking-wider">Texte original (A)</label>
                <textarea rows={10} value={diffA} onChange={e => setDiffA(e.target.value)} placeholder="Premier texte…"
                  className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-mono bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1.5 uppercase tracking-wider">Texte modifié (B)</label>
                <textarea rows={10} value={diffB} onChange={e => setDiffB(e.target.value)} placeholder="Second texte…"
                  className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-mono bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none" />
              </div>
            </div>
            {diff.length > 0 && (
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a] flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700" />Ajouté ({diff.filter(d=>d.type==='add').length})</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700" />Supprimé ({diff.filter(d=>d.type==='del').length})</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#f5f5f5] dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#404040]" />Inchangé ({diff.filter(d=>d.type==='same').length})</span>
                </div>
                <div className="font-mono text-xs overflow-auto max-h-96">
                  {diff.map((line, i) => <DiffLine key={i} line={line} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
