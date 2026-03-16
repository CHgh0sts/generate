'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, Download } from 'lucide-react';
import figlet from 'figlet';
import Standard from 'figlet/importable-fonts/Standard.js';
import Big from 'figlet/importable-fonts/Big.js';
import Slant from 'figlet/importable-fonts/Slant.js';
import Doom from 'figlet/importable-fonts/Doom.js';
import Block from 'figlet/importable-fonts/Block.js';
import Ogre from 'figlet/importable-fonts/Ogre.js';
import Pebbles from 'figlet/importable-fonts/Pebbles.js';
import Banner from 'figlet/importable-fonts/Banner.js';
import Script from 'figlet/importable-fonts/Script.js';
import Roman from 'figlet/importable-fonts/Roman.js';

const ACCENT = '#f97316';

const FONTS = [
  { id: 'Standard', label: 'Standard' },
  { id: 'Big',      label: 'Big' },
  { id: 'Slant',    label: 'Slant' },
  { id: 'Doom',     label: 'Doom' },
  { id: 'Block',    label: 'Block' },
  { id: 'Ogre',     label: 'Ogre' },
  { id: 'Pebbles',  label: 'Pebbles' },
  { id: 'Banner',   label: 'Banner' },
  { id: 'Script',   label: 'Script' },
  { id: 'Roman',    label: 'Roman' },
];

const BOXES = {
  none:    null,
  single:  { tl:'┌',tr:'┐',bl:'└',br:'┘',h:'─',v:'│' },
  double:  { tl:'╔',tr:'╗',bl:'╚',br:'╝',h:'═',v:'║' },
  heavy:   { tl:'┏',tr:'┓',bl:'┗',br:'┛',h:'━',v:'┃' },
  rounded: { tl:'╭',tr:'╮',bl:'╰',br:'╯',h:'─',v:'│' },
  ascii:   { tl:'+',tr:'+',bl:'+',br:'+',h:'-',v:'|' },
};

function wrapInBox(text, style) {
  const b = BOXES[style];
  if (!b) return text;
  const lines = text.split('\n');
  const maxLen = Math.max(...lines.map(l => [...l].length));
  const pad = (l) => l + ' '.repeat(Math.max(0, maxLen - [...l].length));
  const top = b.tl + b.h.repeat(maxLen + 2) + b.tr;
  const bot = b.bl + b.h.repeat(maxLen + 2) + b.br;
  const mid = lines.map(l => `${b.v} ${pad(l)} ${b.v}`).join('\n');
  return `${top}\n${mid}\n${bot}`;
}

export default function AsciiPage() {
  const [ready, setReady] = useState(false);
  const [text, setText]     = useState('GENERATE');
  const [font, setFont]     = useState('Standard');
  const [boxStyle, setBoxStyle] = useState('none');
  const [horizontalLayout, setHorizontalLayout] = useState('default');
  const [copied, setCopied] = useState(false);

  // Register all fonts once on mount
  useEffect(() => {
    figlet.parseFont('Standard', Standard);
    figlet.parseFont('Big',      Big);
    figlet.parseFont('Slant',    Slant);
    figlet.parseFont('Doom',     Doom);
    figlet.parseFont('Block',    Block);
    figlet.parseFont('Ogre',     Ogre);
    figlet.parseFont('Pebbles',  Pebbles);
    figlet.parseFont('Banner',   Banner);
    figlet.parseFont('Script',   Script);
    figlet.parseFont('Roman',    Roman);
    setReady(true);
  }, []);

  const result = useMemo(() => {
    if (!ready || !text.trim()) return '';
    try {
      const art = figlet.textSync(text, {
        font,
        horizontalLayout,
        verticalLayout: 'default',
      });
      return boxStyle !== 'none' ? wrapInBox(art, boxStyle) : art;
    } catch {
      return '— Erreur de rendu —';
    }
  }, [ready, text, font, boxStyle, horizontalLayout]);

  const copy = () => navigator.clipboard.writeText(result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });

  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([result], { type: 'text/plain' }));
    a.download = 'ascii-art.txt'; a.click();
  };

  const lineCount = result.split('\n').length;
  const charCount = result.length;

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
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Powered by FIGlet — 10 polices disponibles</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        {/* Controls */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-4">
          {/* Text input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Texte</label>
            <input value={text} onChange={e => setText(e.target.value)} maxLength={30} placeholder="GENERATE"
              className="w-full px-4 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-base font-semibold bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': ACCENT }} />
            <p className="text-[10px] text-[#a3a3a3] mt-1">{text.length}/30 caractères</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {/* Font */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Police FIGlet</label>
              <div className="flex flex-wrap gap-1.5">
                {FONTS.map(f => (
                  <button key={f.id} onClick={() => setFont(f.id)}
                    style={font === f.id ? { backgroundColor: ACCENT } : {}}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${font === f.id ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Box */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Encadrement</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'none',    label: 'Aucun' },
                  { id: 'single',  label: '┌─┐' },
                  { id: 'double',  label: '╔═╗' },
                  { id: 'heavy',   label: '┏━┓' },
                  { id: 'rounded', label: '╭─╮' },
                  { id: 'ascii',   label: '+-+' },
                ].map(b => (
                  <button key={b.id} onClick={() => setBoxStyle(b.id)}
                    style={boxStyle === b.id ? { backgroundColor: ACCENT } : {}}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${boxStyle === b.id ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-2">Espacement</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'default',  label: 'Normal' },
                  { id: 'full',     label: 'Large' },
                  { id: 'fitted',   label: 'Serré' },
                  { id: 'controlled smushing', label: 'Compact' },
                ].map(l => (
                  <button key={l.id} onClick={() => setHorizontalLayout(l.id)}
                    style={horizontalLayout === l.id ? { backgroundColor: ACCENT } : {}}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${horizontalLayout === l.id ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="bg-[#0d0d0d] rounded-xl overflow-hidden border border-[#262626]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">Rendu</span>
              {result && (
                <span className="text-[10px] text-[#525252] font-mono">{lineCount} lignes · {charCount} caractères</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!ready && <span className="text-[10px] text-[#525252] italic">Chargement des polices…</span>}
              <button onClick={download} disabled={!result} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-[#737373] border border-[#262626] rounded-md hover:bg-[#1f1f1f] disabled:opacity-30">
                <Download className="w-3 h-3" /> .txt
              </button>
              <button onClick={copy} disabled={!result}
                style={copied ? { backgroundColor: '#10b981' } : { backgroundColor: ACCENT }}
                className="flex items-center gap-1 px-2.5 py-1 text-white text-[10px] font-semibold rounded-md disabled:opacity-30">
                {copied ? <><Check className="w-3 h-3" /> Copié</> : 'Copier'}
              </button>
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            {ready ? (
              <pre className="text-[#ededed] leading-tight whitespace-pre font-mono"
                style={{ fontSize: result.split('\n')[0]?.length > 60 ? '10px' : result.split('\n')[0]?.length > 40 ? '12px' : '14px' }}>
                {result || '—'}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-24 text-[#525252] text-sm">
                Chargement des polices FIGlet…
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-[#737373] dark:text-[#a3a3a3]">
          {[
            { title: 'FIGlet', desc: 'Moteur FIGlet standard — alignement pixel-perfect garanti' },
            { title: 'Utilisation', desc: 'En-têtes README, bannières CLI, commentaires de code' },
            { title: 'Conseil', desc: 'Utilisez une police monospace pour afficher le résultat' },
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
