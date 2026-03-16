'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';

const ACCENT = '#f97316';

// ── Micro ASCII font definitions ──────────────────────────────────────────────
// Each character is represented as an array of lines

const FONTS = {
  'Big': {
    chars: {
      'A': ['  /\\  ',' /  \\ ','/ /\\ \\','/__\\ \\','      '],
      'B': ['||\\ \\ ','|| \\_/','||  _ ','||_/ \\','      '],
      'C': [' /\\   ','/ /   ','| |   ','\\ \\__ ',' \\__/ '],
      ' ': ['   ','   ','   ','   ','   '],
    },
    height: 5,
  },
};

// Better approach: use a well-known ASCII font set
// We'll implement a simplified version of "standard" FIGlet font

const BANNER_CHARS = {
  'A': ['    _    ',' /\\ \\   ','/ \\ \\  ','/__\\ \\ ','    \\_\\'],
  'B': ['|_)  ','|_)  ','|_)  ','|_)  ','|_)  '],
};

// Full big ASCII font - simple block style
const BLOCK = {
  ' ': [' ',' ',' '],
  'A': [' █████╗ ','██╔══██╗','███████║','██╔══██║','██║  ██║','╚═╝  ╚═╝'],
  'B': ['██████╗ ','██╔══██╗','██████╔╝','██╔══██╗','██████╔╝','╚═════╝ '],
  'C': [' ██████╗','██╔════╝','██║     ','██║     ','╚██████╗',' ╚═════╝'],
  'D': ['██████╗ ','██╔══██╗','██║  ██║','██║  ██║','██████╔╝','╚═════╝ '],
  'E': ['███████╗','██╔════╝','█████╗  ','██╔══╝  ','███████╗','╚══════╝'],
  'F': ['███████╗','██╔════╝','█████╗  ','██╔══╝  ','██║     ','╚═╝     '],
  'G': [' ██████╗','██╔════╝','██║  ███╗','██║   ██║','╚██████╔╝',' ╚═════╝'],
  'H': ['██╗  ██╗','██║  ██║','███████║','██╔══██║','██║  ██║','╚═╝  ╚═╝'],
  'I': ['██╗','██║','██║','██║','██║','╚═╝'],
  'J': ['     ██╗','     ██║','     ██║','██   ██║','╚█████╔╝',' ╚════╝ '],
  'K': ['██╗  ██╗','██║ ██╔╝','█████╔╝ ','██╔═██╗ ','██║  ██╗','╚═╝  ╚═╝'],
  'L': ['██╗     ','██║     ','██║     ','██║     ','███████╗','╚══════╝'],
  'M': ['███╗   ███╗','████╗ ████║','██╔████╔██║','██║╚██╔╝██║','██║ ╚═╝ ██║','╚═╝     ╚═╝'],
  'N': ['███╗   ██╗','████╗  ██║','██╔██╗ ██║','██║╚██╗██║','██║ ╚████║','╚═╝  ╚═══╝'],
  'O': [' ██████╗ ','██╔═══██╗','██║   ██║','██║   ██║','╚██████╔╝',' ╚═════╝ '],
  'P': ['██████╗ ','██╔══██╗','██████╔╝','██╔═══╝ ','██║     ','╚═╝     '],
  'Q': [' ██████╗ ','██╔═══██╗','██║   ██║','██║▄▄ ██║','╚██████╔╝',' ╚══▀▀═╝ '],
  'R': ['██████╗ ','██╔══██╗','██████╔╝','██╔══██╗','██║  ██╗','╚═╝  ╚═╝'],
  'S': ['███████╗','██╔════╝','███████╗','╚════██║','███████║','╚══════╝'],
  'T': ['████████╗','╚══██╔══╝','   ██║   ','   ██║   ','   ██║   ','   ╚═╝   '],
  'U': ['██╗   ██╗','██║   ██║','██║   ██║','██║   ██║','╚██████╔╝',' ╚═════╝ '],
  'V': ['██╗   ██╗','██║   ██║','██║   ██║','╚██╗ ██╔╝',' ╚████╔╝ ','  ╚═══╝  '],
  'W': ['██╗    ██╗','██║    ██║','██║ █╗ ██║','██║███╗██║','╚███╔███╔╝',' ╚══╝╚══╝ '],
  'X': ['██╗  ██╗','╚██╗██╔╝',' ╚███╔╝ ',' ██╔██╗ ','██╔╝ ██╗','╚═╝  ╚═╝'],
  'Y': ['██╗   ██╗','╚██╗ ██╔╝',' ╚████╔╝ ','  ╚██╔╝  ','   ██║   ','   ╚═╝   '],
  'Z': ['███████╗','╚════██║','    ██╔╝','   ██╔╝ ','   ██║  ','   ╚═╝  '],
  '0': [' ██████╗ ','██╔═══██╗','██║  ███║','██║ ███╔╝','╚███████╔╝',' ╚══════╝ '],
  '1': [' ██╗','███║','╚██║',' ██║',' ██║',' ╚═╝'],
  '2': ['██████╗ ','╚════██╗','  ▄███╔╝',' ▀▀══╝  ','███████╗','╚══════╝'],
  '3': ['██████╗ ','╚════██╗',' █████╔╝','██╔═══╝ ','╚██████╗',' ╚═════╝'],
  '4': ['██╗  ██╗','██║  ██║','███████║','╚════██║','     ██║','     ╚═╝'],
  '5': ['███████╗','██╔════╝','███████╗','╚════██║','███████║','╚══════╝'],
  '6': [' ██████╗ ','██╔════╝ ','███████╗ ','██╔════╝ ','╚██████╗ ',' ╚═════╝ '],
  '7': ['███████╗','╚════██║','    ██╔╝','   ██╔╝ ','  ██╔╝  ','  ╚═╝   '],
  '8': [' █████╗ ','██╔══██╗','╚█████╔╝','██╔══██╗','╚█████╔╝',' ╚════╝ '],
  '9': [' █████╗ ','██╔══██╗','╚██████║',' ╚═══██║','  ████╔╝','  ╚═══╝ '],
  '!': ['██╗','██║','██║','╚═╝','██╗','╚═╝'],
  '?': ['██████╗ ','╚════██╗','  ▄███╔╝','  ▀▀══╝ ','  ██╗   ','  ╚═╝   '],
  '.': ['   ','   ','   ','   ','██╗','╚═╝'],
  ',': ['   ','   ','   ','▄█╗','╔═╝','   '],
  '-': ['       ','       ','███████','╚══════','       ','       '],
  '_': ['        ','        ','        ','        ','███████╗','╚══════╝'],
  ':': ['██╗','╚═╝','   ','██╗','╚═╝','   '],
  ' ': ['   ','   ','   ','   ','   ','   '],
};

// Simple small font (3 lines)
const SMALL = {
  ' ': ['  ','  ','  '],
  'A': [' /\\','/__\\','    '],
  'B': ['|\\ ','|_)','    '],
  'C': ['(__','(  ','    '],
  'D': ['|\\ ','|/ ','    '],
  'E': ['|__','|_ ','    '],
  'F': ['|_ ','|  ','    '],
  'G': [' _ ','(_.','    '],
  'H': ['|_|','| |','    '],
  'I': ['_','|','    '],
  'J': [' _',' |','_/ '],
  'K': ['|/ ','|\\ ','    '],
  'L': ['|  ','|__','    '],
  'M': ['|\\/|','|  |','    '],
  'N': ['|\\|','| |','    '],
  'O': ['(O)','(O)','    '],
  'P': ['|_)','|  ','    '],
  'Q': [' _ ',' Q ','  )'],
  'R': ['|_)','| \\','    '],
  'S': ['(__','__)','    '],
  'T': ['_|_',' | ','    '],
  'U': ['| |','|_|','    '],
  'V': ['\\/ ',' V ','    '],
  'W': ['|  |','|/\\|','    '],
  'X': ['\\/ ','/\\ ','    '],
  'Y': ['\\/ ',' | ','    '],
  'Z': ['/_/','/__','    '],
  '0': ['(0)','(0)','    '],
  '1': ['|','|','    '],
  '2': [' 2','2_','    '],
  '3': ['_3','_3','    '],
  '4': ['|_|','  |','    '],
  '5': ['5_ ','_5 ','    '],
  '6': ['6_ ','(6)','    '],
  '7': [' 7','/ ','    '],
  '8': ['(8)','(8)','    '],
  '9': ['(9',' 9','    '],
  ' ': ['   ','   ','    '],
};

// Shadow font
const SHADOW = {
  ' ': ['    ','    ','    ','    '],
  'A': ['  ▄   ','  ██  ',' ████ ','██  ██','      '],
  'B': ['█████ ','██  ██','█████ ','██  ██','█████ '],
  'C': [' ████ ','██    ','██    ','██    ',' ████ '],
  'D': ['████  ','██ ██ ','██  ██','██  ██','████  '],
  'E': ['██████','██    ','████  ','██    ','██████'],
  'F': ['██████','██    ','████  ','██    ','██    '],
  'G': [' █████','██    ','██  ██','██  ██',' █████'],
  'H': ['██  ██','██  ██','██████','██  ██','██  ██'],
  'I': ['██','██','██','██','██'],
  'J': ['   ██','   ██','   ██','██ ██',' ████'],
  'K': ['██  ██','██ ██ ','████  ','██ ██ ','██  ██'],
  'L': ['██    ','██    ','██    ','██    ','██████'],
  'M': ['██   ██','███ ███','██ █ ██','██   ██','██   ██'],
  'N': ['██   ██','███  ██','██ █ ██','██  ███','██   ██'],
  'O': [' ████ ','██  ██','██  ██','██  ██',' ████ '],
  'P': ['█████ ','██  ██','█████ ','██    ','██    '],
  'Q': [' ████ ','██  ██','██  ██','██ ███',' █████'],
  'R': ['█████ ','██  ██','█████ ','██ ██ ','██  ██'],
  'S': [' █████','██    ','  ███ ','    ██','█████ '],
  'T': ['██████','  ██  ','  ██  ','  ██  ','  ██  '],
  'U': ['██  ██','██  ██','██  ██','██  ██',' ████ '],
  'V': ['██  ██','██  ██','██  ██',' ████ ','  ██  '],
  'W': ['██   ██','██   ██','██ █ ██',' ██ ██ ','  █ █  '],
  'X': ['██  ██',' ████ ','  ██  ',' ████ ','██  ██'],
  'Y': ['██  ██',' ████ ','  ██  ','  ██  ','  ██  '],
  'Z': ['██████','   ██ ','  ██  ',' ██   ','██████'],
  '0': [' ████ ','██  ██','██  ██','██  ██',' ████ '],
  '1': [' ██ ','███ ',' ██ ',' ██ ','████'],
  '2': [' ████ ','    ██','  ███ ',' ██   ','██████'],
  '3': ['█████ ','    ██','  ███ ','    ██','█████ '],
  '4': ['██  ██','██  ██','██████','    ██','    ██'],
  '5': ['██████','██    ','█████ ','    ██','█████ '],
  '6': [' █████','██    ','█████ ','██  ██',' ████ '],
  '7': ['██████','    ██','   ██ ','  ██  ',' ██   '],
  '8': [' ████ ','██  ██',' ████ ','██  ██',' ████ '],
  '9': [' ████ ','██  ██',' █████','    ██','█████ '],
  '!': ['██','██','██','  ','██'],
  '?': [' ████ ','    ██','  ███ ','      ','  ██  '],
  ' ': ['    ','    ','    ','    ','    '],
  '.': ['  ','  ','  ','  ','██'],
  '-': ['    ','    ','████','    ','    '],
};

function renderFont(text, fontData, sep = '  ') {
  const upper = text.toUpperCase();
  const chars = upper.split('').map(c => fontData[c] || fontData[' ']);
  const height = Math.max(...chars.map(c => c.length));
  const lines = [];
  for (let row = 0; row < height; row++) {
    lines.push(chars.map(c => (c[row] || ' '.repeat((c[0]||'').length || 2))).join(sep));
  }
  return lines.join('\n');
}

const FONT_DEFS = [
  { id: 'block',  label: 'Block (FIGlet)', data: BLOCK, sep: ' ' },
  { id: 'shadow', label: 'Shadow',         data: SHADOW, sep: '  ' },
  { id: 'small',  label: 'Small',          data: SMALL, sep: ' ' },
];

// Box art
const BOXES = {
  single:  { tl:'┌',tr:'┐',bl:'└',br:'┘',h:'─',v:'│' },
  double:  { tl:'╔',tr:'╗',bl:'╚',br:'╝',h:'═',v:'║' },
  heavy:   { tl:'┏',tr:'┓',bl:'┗',br:'┛',h:'━',v:'┃' },
  rounded: { tl:'╭',tr:'╮',bl:'╰',br:'╯',h:'─',v:'│' },
  dotted:  { tl:'+',tr:'+',bl:'+',br:'+',h:'.',v:':' },
};

function wrapInBox(text, style) {
  const b = BOXES[style];
  const lines = text.split('\n');
  const maxLen = Math.max(...lines.map(l => [...l].length));
  const pad = (l) => l + ' '.repeat(maxLen - [...l].length);
  const top = b.tl + b.h.repeat(maxLen + 2) + b.tr;
  const bot = b.bl + b.h.repeat(maxLen + 2) + b.br;
  const mid = lines.map(l => b.v + ' ' + pad(l) + ' ' + b.v).join('\n');
  return top + '\n' + mid + '\n' + bot;
}

export default function AsciiPage() {
  const [text, setText]     = useState('GENERATE');
  const [font, setFont]     = useState('block');
  const [boxStyle, setBoxStyle] = useState('none');
  const [sep, setSep]       = useState(1);
  const [copied, setCopied] = useState(false);

  const copy = (t) => navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });

  const download = (content) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = 'ascii-art.txt'; a.click();
  };

  const result = useMemo(() => {
    if (!text.trim()) return '';
    const fontDef = FONT_DEFS.find(f => f.id === font) || FONT_DEFS[0];
    let out = renderFont(text, fontDef.data, ' '.repeat(sep));
    if (boxStyle !== 'none') out = wrapInBox(out, boxStyle);
    return out;
  }, [text, font, boxStyle, sep]);

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">ASCII Art Generator</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Texte → ASCII art avec encadrements</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-4">
          {/* Text input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Texte</label>
            <input value={text} onChange={e => setText(e.target.value)} maxLength={20} placeholder="GENERATE"
              className="w-full px-4 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-base font-semibold bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': ACCENT }} />
            <p className="text-[10px] text-[#a3a3a3] mt-1">{text.length}/20 caractères — majuscules/minuscules, chiffres et symboles</p>
          </div>

          <div className="flex flex-wrap gap-5">
            {/* Font */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Police</label>
              <div className="flex gap-1.5">
                {FONT_DEFS.map(f => (
                  <button key={f.id} onClick={() => setFont(f.id)}
                    style={font === f.id ? { backgroundColor: ACCENT } : {}}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${font === f.id ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Box style */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Encadrement</label>
              <div className="flex gap-1.5 flex-wrap">
                {[{id:'none',label:'Aucun'},{id:'single',label:'┌─┐'},{id:'double',label:'╔═╗'},{id:'heavy',label:'┏━┓'},{id:'rounded',label:'╭─╮'},{id:'dotted',label:'+.+'}].map(b => (
                  <button key={b.id} onClick={() => setBoxStyle(b.id)}
                    style={boxStyle === b.id ? { backgroundColor: ACCENT } : {}}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${boxStyle === b.id ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Espacement</label>
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={4} value={sep} onChange={e => setSep(Number(e.target.value))} className="w-24" style={{ accentColor: ACCENT }} />
                <span className="text-xs font-mono text-[#737373] dark:text-[#a3a3a3] w-4">{sep}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="bg-[#0a0a0a] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
            <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Rendu</span>
            <div className="flex gap-2">
              <button onClick={() => download(result)} className="px-2.5 py-1 text-[10px] font-semibold text-[#737373] border border-[#262626] rounded-md hover:bg-[#1a1a1a]">↓ .txt</button>
              <button onClick={() => copy(result)} style={copied ? { backgroundColor: '#10b981' } : { backgroundColor: ACCENT }} className="px-2.5 py-1 text-white text-[10px] font-semibold rounded-md">
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="text-sm text-[#ededed] leading-tight whitespace-pre font-mono">{result || '—'}</pre>
          </div>
        </div>

        {/* Tips */}
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-[#737373] dark:text-[#a3a3a3]">
          {[
            { title: 'Utilisation', desc: 'En-têtes de README, commentaires de code, bannières CLI' },
            { title: 'Encodage', desc: 'Pensez à utiliser une police monospace pour l\'affichage' },
            { title: 'Astuce', desc: 'Les encadrements fonctionnent mieux avec des terminaux supportant UTF-8' },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-3">
              <p className="font-semibold text-[#171717] dark:text-[#ededed] mb-0.5">{title}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
