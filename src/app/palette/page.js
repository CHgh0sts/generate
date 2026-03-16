'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Upload, Copy, Check, X } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#e11d48';

function extractPalette(imageData, count = 12) {
  const { data, width, height } = imageData;
  const step = Math.max(1, Math.floor(width * height / 5000));
  const pixels = [];
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a < 128) continue;
    pixels.push([r, g, b]);
  }

  // Simple k-means clustering
  let centroids = pixels.filter((_, i) => i % Math.floor(pixels.length / count) === 0).slice(0, count);
  for (let iter = 0; iter < 10; iter++) {
    const clusters = Array.from({ length: count }, () => []);
    pixels.forEach(px => {
      let minD = Infinity, ci = 0;
      centroids.forEach(([cr, cg, cb], i) => {
        const d = (px[0]-cr)**2 + (px[1]-cg)**2 + (px[2]-cb)**2;
        if (d < minD) { minD = d; ci = i; }
      });
      clusters[ci].push(px);
    });
    centroids = clusters.map(cluster => {
      if (!cluster.length) return [128, 128, 128];
      const avg = cluster.reduce((a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]], [0,0,0]);
      return avg.map(v => Math.round(v / cluster.length));
    });
  }
  return centroids
    .filter(([r,g,b]) => !(r > 240 && g > 240 && b > 240) && !(r < 15 && g < 15 && b < 15))
    .slice(0, count);
}

function toHex([r, g, b]) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function toRgb([r, g, b]) { return `rgb(${r}, ${g}, ${b})`; }
function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  const l = (max + min) / 2;
  if (max === min) return `hsl(0, 0%, ${Math.round(l*100)}%)`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g-b)/d + (g<b?6:0))/6 : max === g ? ((b-r)/d + 2)/6 : ((r-g)/d + 4)/6;
  return `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
}

function isLight([r,g,b]) { return (0.299*r + 0.587*g + 0.114*b) > 128; }

export default function PalettePage() {
  const [preview, setPreview]   = useState(null);
  const [palette, setPalette]   = useState([]);
  const [count, setCount]       = useState(8);
  const [copied, setCopied]     = useState('');
  const [format, setFormat]     = useState('hex');
  const canvasRef = useRef();
  const fileRef   = useRef();
  const pushToast = useToast();

  const processImage = useCallback((file) => {
    if (!file?.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const W = Math.min(img.naturalWidth, 400);
      const H = Math.round(img.naturalHeight * W / img.naturalWidth);
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);
      const imageData = ctx.getImageData(0, 0, W, H);
      const colors = extractPalette(imageData, count);
      setPalette(colors);
    };
    img.src = url;
  }, [count]);

  const handleFile = (e) => { processImage(e.target.files?.[0]); e.target.value = ''; };
  const handleDrop = (e) => { e.preventDefault(); processImage(e.dataTransfer.files?.[0]); };

  const formatColor = (rgb) => {
    if (format === 'hex') return toHex(rgb);
    if (format === 'rgb') return toRgb(rgb);
    return toHsl(rgb);
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key); pushToast?.('Copié !');
    setTimeout(() => setCopied(''), 2000);
  };

  const copyAll = () => {
    const text = palette.map(formatColor).join('\n');
    navigator.clipboard.writeText(text);
    pushToast?.('Palette copiée !');
  };

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Palette depuis une image</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Extrayez les couleurs dominantes d&apos;une photo</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-[10px] text-[#a3a3a3] mb-1 block">Couleurs</label>
            <input type="number" value={count} min={2} max={20}
              onChange={e => setCount(Math.max(2, Math.min(20, +e.target.value)))}
              className="w-20 px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-sm text-center bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed]" />
          </div>
          <div>
            <label className="text-[10px] text-[#a3a3a3] mb-1 block">Format</label>
            <div className="flex gap-1">
              {['hex','rgb','hsl'].map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border uppercase transition-colors ${format === f ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#737373]'}`}
                  style={format === f ? { backgroundColor: ACCENT } : {}}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1" />
          <button onClick={() => fileRef.current?.click()}
            style={{ backgroundColor: ACCENT }}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90">
            <Upload className="w-4 h-4" /> Charger une image
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="grid md:grid-cols-2 gap-5">
          {/* Image */}
          <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            className="bg-white dark:bg-[#171717] rounded-xl border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] overflow-hidden min-h-[280px] flex flex-col">
            {preview ? (
              <div className="relative flex-1">
                <img src={preview} alt="Source" className="w-full h-full object-contain max-h-[380px]" />
                <button onClick={() => { setPreview(null); setPalette([]); }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-black/60 rounded-full">
                  <X className="w-4 h-4 text-[#525252]" />
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#a3a3a3] cursor-pointer" onClick={() => fileRef.current?.click()}>
                <Upload className="w-10 h-10 opacity-30" />
                <p className="text-sm">Glissez ou cliquez pour importer</p>
              </div>
            )}
          </div>

          {/* Palette */}
          <div className="space-y-3">
            {palette.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#a3a3a3]">{palette.length} couleurs extraites</span>
                <button onClick={copyAll} className="text-xs flex items-center gap-1 border border-[#e5e5e5] dark:border-[#262626] rounded-lg px-2.5 py-1 text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                  <Copy className="w-3 h-3" /> Tout copier
                </button>
              </div>
            )}

            {/* Color strips */}
            {palette.length > 0 && (
              <div className="rounded-xl overflow-hidden flex h-12">
                {palette.map((rgb, i) => (
                  <div key={i} className="flex-1 cursor-pointer hover:scale-y-110 transition-transform"
                    style={{ backgroundColor: toHex(rgb) }}
                    onClick={() => copy(formatColor(rgb), `strip-${i}`)} />
                ))}
              </div>
            )}

            {palette.map((rgb, i) => {
              const val = formatColor(rgb);
              return (
                <button key={i} onClick={() => copy(val, i)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#e5e5e5] dark:border-[#262626] hover:shadow-sm transition-shadow bg-white dark:bg-[#171717]">
                  <div className="w-8 h-8 rounded-lg shrink-0 border border-black/10" style={{ backgroundColor: toHex(rgb) }} />
                  <code className="flex-1 text-xs font-mono text-left text-[#171717] dark:text-[#ededed]">{val}</code>
                  {copied === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#a3a3a3]" />}
                </button>
              );
            })}

            {!palette.length && !preview && (
              <div className="flex-1 flex items-center justify-center text-[#a3a3a3] text-sm">
                Importez une image pour extraire la palette
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
