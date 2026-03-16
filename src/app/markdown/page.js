'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, Download, Pencil, Columns2, Eye } from 'lucide-react';
import { marked } from 'marked';

const ACCENT = '#0369a1';

const SAMPLE = `# Titre principal

## Introduction

Voici un **texte en gras**, du *texte en italique* et du \`code inline\`.

## Listes

- Premier élément
- Deuxième élément
  - Sous-élément
- Troisième élément

## Code

\`\`\`javascript
function hello(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

## Tableau

| Colonne A | Colonne B | Colonne C |
|-----------|-----------|-----------|
| Valeur 1  | Valeur 2  | Valeur 3  |
| Valeur 4  | Valeur 5  | Valeur 6  |

## Citation

> Ceci est une citation importante.
> Elle peut s'étendre sur plusieurs lignes.

---

[Lien exemple](https://example.com)
`;

const TOOLBAR = [
  { label: 'B',      wrap: ['**','**'],   title: 'Gras' },
  { label: 'I',      wrap: ['*','*'],     title: 'Italique' },
  { label: '~~',     wrap: ['~~','~~'],   title: 'Barré' },
  { label: '`',      wrap: ['`','`'],     title: 'Code inline' },
  { label: 'H1',     prefix: '# ',       title: 'Titre 1' },
  { label: 'H2',     prefix: '## ',      title: 'Titre 2' },
  { label: 'H3',     prefix: '### ',     title: 'Titre 3' },
  { label: '—',      prefix: '---\n',    title: 'Séparateur' },
  { label: '> ',     prefix: '> ',       title: 'Citation' },
  { label: '- ',     prefix: '- ',       title: 'Liste' },
];

export default function MarkdownPage() {
  const [md, setMd]         = useState(SAMPLE);
  const [view, setView]     = useState('split'); // split | editor | preview
  const [copied, setCopied] = useState('');

  marked.setOptions({ breaks: true, gfm: true });
  const html = useMemo(() => marked(md), [md]);

  const copy = (text, id) => navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(''), 1500); });

  const download = (content, name, type) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; a.click();
  };

  const insertAt = (textarea, op) => {
    const s = textarea.selectionStart, e = textarea.selectionEnd;
    const sel = md.slice(s, e);
    let newText;
    if (op.wrap) {
      newText = md.slice(0, s) + op.wrap[0] + sel + op.wrap[1] + md.slice(e);
      setMd(newText);
    } else if (op.prefix) {
      newText = md.slice(0, s) + op.prefix + sel + md.slice(e);
      setMd(newText);
    }
  };

  const wordCount = md.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex flex-col">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-full px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" aria-label="Retour" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Éditeur Markdown</h1>
            <span className="text-xs text-[#a3a3a3]">{wordCount} mots · {md.length} car.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* View toggle */}
            <div className="flex gap-1 border border-[#e5e5e5] dark:border-[#262626] rounded-lg p-0.5">
              {[{id:'editor',icon:<Pencil className="w-3 h-3" />,label:'Éditer'},{id:'split',icon:<Columns2 className="w-3 h-3" />,label:'Split'},{id:'preview',icon:<Eye className="w-3 h-3" />,label:'Aperçu'}].map(v => (
                <button key={v.id} onClick={() => setView(v.id)}
                  style={view===v.id?{backgroundColor:ACCENT}:{}}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${view===v.id?'text-white':'text-[#737373] dark:text-[#a3a3a3]'}`}>
                  <span className="flex items-center gap-1">{v.icon}{v.label}</span>
                </button>
              ))}
            </div>
            {/* Actions */}
            <button onClick={() => copy(md, 'md')} style={copied==='md'?{backgroundColor:'#10b981'}:{backgroundColor:ACCENT}} className="flex items-center gap-1 px-3 py-1.5 text-white text-xs font-semibold rounded-lg">{copied==='md'?<><Check className="w-3 h-3" />Copié</>:'Copier MD'}</button>
            <button onClick={() => download(md,'document.md','text/markdown')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]"><Download className="w-3 h-3" /> .md</button>
            <button onClick={() => download(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Document</title><style>body{max-width:800px;margin:0 auto;padding:2rem;font-family:system-ui;line-height:1.6}pre{background:#f5f5f5;padding:1rem;border-radius:6px;overflow:auto}code{background:#f5f5f5;padding:2px 4px;border-radius:3px}blockquote{border-left:4px solid #e5e5e5;margin:0;padding-left:1rem;color:#737373}table{border-collapse:collapse}td,th{border:1px solid #e5e5e5;padding:.5rem 1rem}</style></head><body>${html}</body></html>`, 'document.html','text/html')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]"><Download className="w-3 h-3" /> HTML</button>
            <ThemeToggle />
          </div>
        </div>
        {/* Toolbar */}
        <div className="px-6 py-1.5 border-t border-[#f5f5f5] dark:border-[#1a1a1a] flex gap-0.5">
          {TOOLBAR.map(op => (
            <button key={op.label} title={op.title} onClick={() => {
              const ta = document.querySelector('#md-textarea');
              if (ta) insertAt(ta, op);
            }} className="px-2 py-1 text-xs font-mono text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded transition-colors">
              {op.label}
            </button>
          ))}
        </div>
      </header>

      <main id="main-content" className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 100px)' }}>
        {(view === 'editor' || view === 'split') && (
          <div className={`${view === 'split' ? 'w-1/2 border-r border-[#e5e5e5] dark:border-[#262626]' : 'w-full'} flex flex-col`}>
            <textarea id="md-textarea" value={md} onChange={e => setMd(e.target.value)}
              className="flex-1 p-6 text-sm font-mono bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none leading-relaxed"
              spellCheck={false} />
          </div>
        )}
        {(view === 'preview' || view === 'split') && (
          <div className={`${view === 'split' ? 'w-1/2' : 'w-full'} overflow-auto bg-white dark:bg-[#171717]`}>
            <div className="px-8 py-6 prose prose-sm max-w-none dark:prose-invert"
              style={{
                '--tw-prose-headings': '#171717',
                '--tw-prose-body': '#525252',
                color: 'var(--tw-prose-body)',
              }}
              dangerouslySetInnerHTML={{ __html: `<style>
                .prose h1,.prose h2,.prose h3,.prose h4{color:#171717;margin-top:1.5rem;margin-bottom:.5rem;font-weight:700}
                .prose h1{font-size:1.75rem}.prose h2{font-size:1.4rem}.prose h3{font-size:1.1rem}
                .prose p{line-height:1.7;color:#525252;margin-bottom:.75rem}
                .prose code{background:#f5f5f5;padding:2px 5px;border-radius:4px;font-size:.85em;color:#c026d3}
                .prose pre{background:#0a0a0a;color:#ededed;padding:1rem;border-radius:.75rem;overflow-x:auto;margin-bottom:1rem}
                .prose pre code{background:none;color:inherit;padding:0}
                .prose blockquote{border-left:3px solid #e5e5e5;margin:0 0 1rem;padding:.5rem 1rem;color:#737373}
                .prose ul,.prose ol{padding-left:1.5rem;margin-bottom:.75rem}
                .prose li{margin-bottom:.25rem;color:#525252}
                .prose table{width:100%;border-collapse:collapse;margin-bottom:1rem;font-size:.875rem}
                .prose th,.prose td{border:1px solid #e5e5e5;padding:.5rem .75rem;text-align:left}
                .prose th{background:#fafafa;font-weight:600}
                .prose hr{border:none;border-top:1px solid #e5e5e5;margin:1.5rem 0}
                .prose a{color:#0369a1;text-decoration:underline}
                .prose strong{color:#171717;font-weight:700}
                .dark .prose h1,.dark .prose h2,.dark .prose h3,.dark .prose strong{color:#ededed}
                .dark .prose p,.dark .prose li{color:#a3a3a3}
                .dark .prose code{background:#262626;color:#c084fc}
                .dark .prose blockquote{border-color:#404040;color:#a3a3a3}
                .dark .prose th{background:#171717}.dark .prose th,.dark .prose td{border-color:#262626}
              </style><div class="prose">${html}</div>` }} />
          </div>
        )}
      </main>
    </div>
  );
}
