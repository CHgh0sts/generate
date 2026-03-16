'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Upload, X } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#7c3aed';

export default function ImgDiffPage() {
  const [imgA, setImgA]   = useState(null);
  const [imgB, setImgB]   = useState(null);
  const [mode, setMode]   = useState('diff'); // diff | slider | side
  const [thresh, setThresh] = useState(10);
  const [stats, setStats] = useState(null);
  const [sliderPos, setSliderPos] = useState(50);

  const canvasA = useRef(); const canvasB = useRef(); const canvasDiff = useRef();
  const containerRef = useRef();
  const pushToast = useToast();

  function loadImage(file, setter) {
    if (!file?.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setter({ url, img, w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }

  const computeDiff = useCallback(() => {
    if (!imgA || !imgB) return;
    const W = Math.max(imgA.w, imgB.w);
    const H = Math.max(imgA.h, imgB.h);

    const draw = (canvas, img) => {
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img.img, 0, 0, img.w, img.h);
      return ctx.getImageData(0, 0, W, H);
    };

    const dataA = draw(canvasA.current, imgA);
    const dataB = draw(canvasB.current, imgB);

    canvasDiff.current.width  = W;
    canvasDiff.current.height = H;
    const diffCtx = canvasDiff.current.getContext('2d');
    const diffImg = diffCtx.createImageData(W, H);
    const d = diffImg.data;

    let diffPx = 0;
    for (let i = 0; i < dataA.data.length; i += 4) {
      const dr = Math.abs(dataA.data[i]   - dataB.data[i]);
      const dg = Math.abs(dataA.data[i+1] - dataB.data[i+1]);
      const db = Math.abs(dataA.data[i+2] - dataB.data[i+2]);
      const diff = (dr + dg + db) / 3;
      if (diff > thresh) {
        d[i] = 255; d[i+1] = 0; d[i+2] = 0; d[i+3] = 255;
        diffPx++;
      } else {
        const gray = Math.round((dataA.data[i] + dataA.data[i+1] + dataA.data[i+2]) / 3 * 0.3);
        d[i] = gray; d[i+1] = gray; d[i+2] = gray; d[i+3] = 180;
      }
    }
    diffCtx.putImageData(diffImg, 0, 0);

    const total = W * H;
    setStats({ diffPx, pct: ((diffPx / total) * 100).toFixed(2), W, H });
    if (diffPx === 0) pushToast?.('Images identiques !');
    else pushToast?.(`${diffPx.toLocaleString('fr-FR')} pixels différents`);
  }, [imgA, imgB, thresh]);

  useEffect(() => {
    if (imgA && imgB) computeDiff();
  }, [imgA, imgB, thresh]);

  const onSliderMove = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSliderPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Comparaison d&apos;images</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Diff pixel par pixel, slider, côte à côte</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-6 py-8 space-y-5">
        {/* Controls */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 flex flex-wrap gap-4 items-center">
          <div className="flex gap-1">
            {[['diff','Diff coloré'],['slider','Slider'],['side','Côte à côte']].map(([m,l]) => (
              <button key={m} onClick={() => setMode(m)}
                style={mode === m ? { backgroundColor: ACCENT } : {}}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${mode === m ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#737373]'}`}>
                {l}
              </button>
            ))}
          </div>
          {mode === 'diff' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#a3a3a3]">Seuil</span>
              <input type="range" min={0} max={50} value={thresh} onChange={e => setThresh(+e.target.value)} className="w-24" style={{ accentColor: ACCENT }} />
              <span className="text-[10px] font-mono w-5">{thresh}</span>
            </div>
          )}
          {stats && (
            <div className="flex items-center gap-4 ml-auto text-xs">
              <span className="text-[#737373]">{stats.W}×{stats.H}px</span>
              <span style={{ color: +stats.pct > 0 ? '#ef4444' : ACCENT }} className="font-bold">
                {stats.diffPx === 0 ? '✓ Identiques' : `${stats.pct}% différent`}
              </span>
            </div>
          )}
        </div>

        {/* Hidden canvases */}
        <canvas ref={canvasA} className="hidden" />
        <canvas ref={canvasB} className="hidden" />

        {/* Image upload row */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[['A', imgA, setImgA], ['B', imgB, setImgB]].map(([label, img, setter]) => (
            <div key={label}>
              <label className="text-[10px] text-[#a3a3a3] mb-1.5 block font-semibold uppercase">Image {label}</label>
              <div onDrop={e => { e.preventDefault(); loadImage(e.dataTransfer.files?.[0], setter); }}
                onDragOver={e => e.preventDefault()}
                className="bg-white dark:bg-[#171717] rounded-xl border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] overflow-hidden min-h-[160px] flex flex-col cursor-pointer"
                onClick={() => { const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=e=>loadImage(e.target.files[0],setter); inp.click(); }}>
                {img ? (
                  <div className="relative">
                    <img src={img.url} alt={label} className="w-full max-h-48 object-contain" />
                    <button onClick={e => { e.stopPropagation(); setter(null); setStats(null); }}
                      className="absolute top-2 right-2 p-1 bg-white/80 dark:bg-black/60 rounded-full">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[#a3a3a3] p-6">
                    <Upload className="w-8 h-8 opacity-30" />
                    <p className="text-xs">Glissez ou cliquez</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Result */}
        {imgA && imgB && (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
            {mode === 'diff' && (
              <div className="flex items-center justify-center p-4 bg-[#f5f5f5] dark:bg-[#0a0a0a]">
                <canvas ref={canvasDiff} className="max-w-full max-h-[500px] rounded-lg" />
              </div>
            )}
            {mode === 'side' && (
              <div className="grid sm:grid-cols-2 gap-0 divide-x divide-[#e5e5e5] dark:divide-[#262626]">
                <div className="p-4 bg-[#fafafa] dark:bg-[#0a0a0a]">
                  <p className="text-[10px] text-[#a3a3a3] mb-2">Image A</p>
                  <img src={imgA.url} alt="A" className="max-w-full max-h-[400px] object-contain mx-auto" />
                </div>
                <div className="p-4 bg-[#fafafa] dark:bg-[#0a0a0a]">
                  <p className="text-[10px] text-[#a3a3a3] mb-2">Image B</p>
                  <img src={imgB.url} alt="B" className="max-w-full max-h-[400px] object-contain mx-auto" />
                </div>
              </div>
            )}
            {mode === 'slider' && (
              <div ref={containerRef}
                className="relative overflow-hidden cursor-ew-resize select-none bg-[#f5f5f5] dark:bg-[#0a0a0a]"
                onMouseMove={e => { if (e.buttons) onSliderMove(e.clientX); }}
                onMouseDown={e => onSliderMove(e.clientX)}
                onTouchMove={e => onSliderMove(e.touches[0].clientX)}>
                <img src={imgB.url} alt="B" className="w-full max-h-[500px] object-contain" />
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                  <img src={imgA.url} alt="A" className="w-full max-h-[500px] object-contain" />
                </div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#525252]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-3 3 3 3M16 9l3 3-3 3" />
                    </svg>
                  </div>
                </div>
                <div className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full pointer-events-none">A</div>
                <div className="absolute top-2 right-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full pointer-events-none">B</div>
              </div>
            )}
          </div>
        )}

        {mode === 'diff' && (
          <div className="flex items-center gap-4 text-xs text-[#737373] dark:text-[#a3a3a3] bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] px-4 py-3">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Pixels différents</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#737373] inline-block" /> Pixels identiques (grisés)</span>
          </div>
        )}
      </main>
    </div>
  );
}
