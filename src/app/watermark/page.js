'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, Download, ArrowUpLeft, ArrowUp, ArrowUpRight, ArrowLeft, Move, ArrowRight, ArrowDownLeft, ArrowDown, ArrowDownRight } from 'lucide-react';

const ACCENT = '#7c3aed';

const POSITION_ICONS = {
  'top-left':     <ArrowUpLeft className="w-3.5 h-3.5" />,
  'top-center':   <ArrowUp className="w-3.5 h-3.5" />,
  'top-right':    <ArrowUpRight className="w-3.5 h-3.5" />,
  'middle-left':  <ArrowLeft className="w-3.5 h-3.5" />,
  'center':       <Move className="w-3.5 h-3.5" />,
  'middle-right': <ArrowRight className="w-3.5 h-3.5" />,
  'bottom-left':  <ArrowDownLeft className="w-3.5 h-3.5" />,
  'bottom-center':<ArrowDown className="w-3.5 h-3.5" />,
  'bottom-right': <ArrowDownRight className="w-3.5 h-3.5" />,
};

const POSITIONS = [
  { id: 'top-left',     label: 'top-left' },
  { id: 'top-center',   label: 'top-center' },
  { id: 'top-right',    label: 'top-right' },
  { id: 'middle-left',  label: 'middle-left' },
  { id: 'center',       label: 'center' },
  { id: 'middle-right', label: 'middle-right' },
  { id: 'bottom-left',  label: 'bottom-left' },
  { id: 'bottom-center',label: 'bottom-center' },
  { id: 'bottom-right', label: 'bottom-right' },
];

function fmtSize(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b/1024).toFixed(1)} Ko`;
  return `${(b/1024/1024).toFixed(2)} Mo`;
}

export default function WatermarkPage() {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [text, setText]       = useState('© My Photo');
  const [position, setPosition] = useState('bottom-right');
  const [opacity, setOpacity] = useState(0.5);
  const [fontSize, setFontSize] = useState(40);
  const [color, setColor]     = useState('#ffffff');
  const [repeat, setRepeat]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) { setError('Veuillez sélectionner une image.'); return; }
    setFile(f); setResult(null); setError('');
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const handleApply = async () => {
    if (!file) { setError('Sélectionnez une image.'); return; }
    if (!text.trim()) { setError('Entrez un texte de filigrane.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('text', text);
      fd.append('position', position);
      fd.append('opacity', String(opacity));
      fd.append('fontSize', String(fontSize));
      fd.append('color', color);
      fd.append('repeat', String(repeat));
      const res = await fetch('/api/watermark', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Erreur ${res.status}`); }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const fname = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'watermarked.jpg';
      setResult({ url, name: fname, size: blob.size });
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click();
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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Filigrane sur image</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Ajoutez un watermark texte à vos photos</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-7">
          {/* Controls */}
          <div className="space-y-5">
            {/* Upload */}
            <label onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }} onDragOver={e => e.preventDefault()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl p-8 cursor-pointer hover:border-[#404040] transition-colors bg-white dark:bg-[#171717]">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
              {preview ? (
                <div className="flex items-center gap-3 w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Aperçu" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">{file?.name}</p>
                    <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{fmtSize(file?.size)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <svg className="w-10 h-10 text-[#a3a3a3] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">Glissez ou cliquez pour sélectionner</p>
                </>
              )}
            </label>

            {/* Text */}
            <div>
              <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider block mb-2">Texte du filigrane</label>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="© Mon Photo"
                className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': ACCENT }} />
            </div>

            {/* Position grid */}
            <div>
              <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider block mb-2">Position</label>
              <div className={`grid grid-cols-3 gap-1.5 w-36 ${repeat ? 'opacity-40 pointer-events-none' : ''}`}>
                {POSITIONS.map(p => (
                  <button key={p.id} onClick={() => setPosition(p.id)}
                    style={position === p.id && !repeat ? { backgroundColor: ACCENT } : {}}
                    className={`w-10 h-10 rounded-lg text-base border transition-colors ${position === p.id && !repeat ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                    {POSITION_ICONS[p.id]}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 mt-2 text-sm text-[#525252] dark:text-[#a3a3a3] cursor-pointer">
                <input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} style={{ accentColor: ACCENT }} />
                Mode tuilé (répéter sur toute l&apos;image)
              </label>
            </div>

            {/* Appearance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] block mb-2">Couleur</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0" />
                  <span className="text-sm font-mono text-[#171717] dark:text-[#ededed]">{color}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] block mb-2">Taille police : {fontSize}px</label>
                <input type="range" min={12} max={200} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full" style={{ accentColor: ACCENT }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">Opacité</label>
                <span className="text-xs font-mono text-[#171717] dark:text-[#ededed]">{Math.round(opacity * 100)}%</span>
              </div>
              <input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="w-full" style={{ accentColor: ACCENT }} />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}

            <button onClick={handleApply} disabled={loading || !file} style={{ backgroundColor: ACCENT }}
              className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? 'Application…' : 'Appliquer le filigrane'}
            </button>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">{result ? 'Résultat' : 'Aperçu source'}</p>
                {result && (
                  <button onClick={download} style={{ backgroundColor: ACCENT }} className="flex items-center gap-1 px-3 py-1.5 text-white text-xs font-semibold rounded-lg"><Download className="w-3 h-3" /> Télécharger</button>
                )}
              </div>
              <div className="p-4 flex items-center justify-center min-h-64 bg-[#fafafa] dark:bg-[#0a0a0a]">
                {result ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={result.url} alt="Résultat avec filigrane" className="max-w-full max-h-96 rounded-lg object-contain shadow" />
                ) : preview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={preview} alt="Original" className="max-w-full max-h-96 rounded-lg object-contain" />
                ) : (
                  <div className="text-center text-[#a3a3a3]">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm">Chargez une image pour commencer</p>
                  </div>
                )}
              </div>
              {result && (
                <div className="px-4 py-3 border-t border-[#f5f5f5] dark:border-[#1a1a1a] flex items-center gap-2 text-xs text-[#737373] dark:text-[#a3a3a3]">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{result.name} · {fmtSize(result.size)}</span>
                  <button onClick={() => setResult(null)} className="ml-auto text-[#a3a3a3] hover:text-[#737373]">Recommencer</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
