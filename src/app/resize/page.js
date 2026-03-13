'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Modal } from '../Modal';

const ACCENT = '#059669';

const FIT_MODES = [
  { value: 'inside', label: 'Contenir',  desc: 'Proportionnel, sans rogner' },
  { value: 'cover',  label: 'Couvrir',   desc: 'Remplit, rogne les bords' },
  { value: 'fill',   label: 'Étirer',    desc: 'Force les dimensions exactes' },
];

const OUTPUT_FORMATS = [
  { value: 'original', label: 'Format original' },
  { value: 'jpeg',     label: 'JPEG' },
  { value: 'png',      label: 'PNG' },
  { value: 'webp',     label: 'WebP' },
  { value: 'avif',     label: 'AVIF' },
];

function formatBytes(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`;
  return `${(b / (1024 * 1024)).toFixed(2)} Mo`;
}

// Draw a checkerboard background (transparency indicator)
function drawCheckerboard(ctx, w, h) {
  const sz = 8;
  for (let x = 0; x < w; x += sz) {
    for (let y = 0; y < h; y += sz) {
      ctx.fillStyle = ((Math.floor(x / sz) + Math.floor(y / sz)) % 2 === 0) ? '#e5e5e5' : '#d4d4d4';
      ctx.fillRect(x, y, Math.min(sz, w - x), Math.min(sz, h - y));
    }
  }
}

export default function ResizePage() {
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [origDims, setOrigDims]   = useState({ w: 0, h: 0 });
  const [width, setWidth]         = useState('');
  const [height, setHeight]       = useState('');
  const [lockRatio, setLockRatio] = useState(true);
  const [fit, setFit]             = useState('inside');
  const [format, setFormat]       = useState('original');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [result, setResult]       = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const canvasRef    = useRef(null);
  const imgRef       = useRef(null); // loaded HTMLImageElement

  // ── Redraw canvas simulation ──────────────────────────────────
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;

    const targetW = Math.max(1, parseInt(width)  || img.naturalWidth);
    const targetH = Math.max(1, parseInt(height) || img.naturalHeight);

    // Scale canvas to fit preview box (max 420×360)
    const maxW = 420, maxH = 360;
    const scale  = Math.min(maxW / targetW, maxH / targetH, 1);
    const dispW  = Math.max(1, Math.round(targetW * scale));
    const dispH  = Math.max(1, Math.round(targetH * scale));

    canvas.width  = dispW;
    canvas.height = dispH;

    const ctx = canvas.getContext('2d');
    drawCheckerboard(ctx, dispW, dispH);

    const origW = img.naturalWidth;
    const origH = img.naturalHeight;

    if (fit === 'fill') {
      // Stretch exactly
      ctx.drawImage(img, 0, 0, dispW, dispH);

    } else if (fit === 'inside') {
      // Contain — fit inside, letterbox / pillarbox
      const s  = Math.min(dispW / origW, dispH / origH);
      const dw = origW * s, dh = origH * s;
      const dx = (dispW - dw) / 2, dy = (dispH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);

    } else if (fit === 'cover') {
      // Cover — fill and clip excess
      const s  = Math.max(dispW / origW, dispH / origH);
      const dw = origW * s, dh = origH * s;
      const dx = (dispW - dw) / 2, dy = (dispH - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, dispW, dispH);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    }
  }, [width, height, fit]);

  // Load image into ref when preview changes
  useEffect(() => {
    if (!preview) { imgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { imgRef.current = img; drawPreview(); };
    img.src = preview;
  }, [preview, drawPreview]);

  // Debounced redraw on param changes
  useEffect(() => {
    if (!imgRef.current) return;
    const t = setTimeout(drawPreview, 80);
    return () => clearTimeout(t);
  }, [width, height, fit, drawPreview]);

  // ── File handling ─────────────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setError(null); setResult(null);
    if (!selected) { setFile(null); setPreview(null); return; }
    if (!selected.type.startsWith('image/')) { setError('Veuillez sélectionner une image'); return; }
    setFile(selected);
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(selected);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setOrigDims({ w: img.naturalWidth, h: img.naturalHeight });
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
    };
    img.src = url;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileChange({ target: { files: [dropped] } });
  };

  const handleWidthChange = (val) => {
    setWidth(val);
    if (lockRatio && origDims.w && origDims.h && val) {
      setHeight(String(Math.round(Number(val) * (origDims.h / origDims.w))));
    }
  };

  const handleHeightChange = (val) => {
    setHeight(val);
    if (lockRatio && origDims.w && origDims.h && val) {
      setWidth(String(Math.round(Number(val) * (origDims.w / origDims.h))));
    }
  };

  // ── Resize API call ───────────────────────────────────────────
  const handleResize = async () => {
    if (!file)                { setError('Veuillez sélectionner une image'); return; }
    if (!width && !height)    { setError('Entrez au moins une dimension'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (width)  formData.append('width', width);
      if (height) formData.append('height', height);
      formData.append('fit', fit);
      formData.append('format', format);
      const res = await fetch('/api/resize', { method: 'POST', body: formData });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Erreur ${res.status}`); }
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const filename = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'resized.jpg';
      const outW     = Number(res.headers.get('X-Output-Width') || 0);
      const outH     = Number(res.headers.get('X-Output-Height') || 0);
      setResult({ url, filename, outW, outH, size: blob.size });
      setModalOpen(true);
    } catch (err) {
      setError(err.message || 'Erreur lors du redimensionnement');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url; a.download = result.filename; a.click();
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null); setPreview(null); setOrigDims({ w: 0, h: 0 });
    setWidth(''); setHeight(''); setLockRatio(true); setFit('inside'); setFormat('original');
    setError(null); setResult(null); setModalOpen(false);
    imgRef.current = null;
    if (canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Computed preview dimensions
  const prevW = Math.max(1, parseInt(width)  || origDims.w || 0);
  const prevH = Math.max(1, parseInt(height) || origDims.h || 0);
  const scaleRatio = origDims.w ? ((prevW / origDims.w) * 100).toFixed(0) : null;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] shrink-0" aria-label="Retour">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Redimensionneur d&apos;images</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">JPEG, PNG, WebP, AVIF</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Colonne gauche : contrôles ── */}
          <div className="space-y-5">

            {/* Upload */}
            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Image à redimensionner</label>
              <div
                onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl p-6 text-center cursor-pointer hover:border-[#404040] dark:hover:border-[#525252] transition-colors bg-white dark:bg-[#171717]"
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {preview ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Aperçu" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium text-[#171717] dark:text-[#ededed] truncate">{file?.name}</p>
                      <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">{origDims.w} × {origDims.h} px · {formatBytes(file?.size)}</p>
                      <p className="text-[10px] text-[#a3a3a3] mt-0.5">Cliquez pour changer</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#737373] dark:text-[#a3a3a3]">
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2" />
                    </svg>
                    <p className="text-sm font-medium">Cliquez ou glissez une image</p>
                    <p className="text-xs mt-1">JPEG, PNG, WebP, AVIF, GIF…</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">Dimensions cibles (px)</label>
                <button
                  onClick={() => setLockRatio(!lockRatio)}
                  style={lockRatio ? { backgroundColor: ACCENT } : {}}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${lockRatio ? 'text-white' : 'border border-[#e5e5e5] dark:border-[#404040] text-[#525252] dark:text-[#a3a3a3]'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {lockRatio
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    }
                  </svg>
                  {lockRatio ? 'Ratio verrouillé' : 'Ratio libre'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Largeur</label>
                  <input
                    type="number" value={width} onChange={(e) => handleWidthChange(e.target.value)} min={1} placeholder="ex: 1920"
                    className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': ACCENT }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Hauteur</label>
                  <input
                    type="number" value={height} onChange={(e) => handleHeightChange(e.target.value)} min={1} placeholder="ex: 1080"
                    className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': ACCENT }}
                  />
                </div>
              </div>
              {/* Presets */}
              {origDims.w > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: '1:1',     w: Math.min(origDims.w, origDims.h), h: Math.min(origDims.w, origDims.h) },
                    { label: '1920×1080', w: 1920, h: 1080 },
                    { label: '1280×720', w: 1280, h: 720 },
                    { label: '800×600', w: 800, h: 600 },
                    { label: '512×512', w: 512, h: 512 },
                    { label: '256×256', w: 256, h: 256 },
                  ].map(({ label, w, h }) => (
                    <button
                      key={label}
                      onClick={() => { setLockRatio(false); setWidth(String(w)); setHeight(String(h)); }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono border border-[#e5e5e5] dark:border-[#262626] text-[#737373] dark:text-[#a3a3a3] hover:border-[#404040] dark:hover:border-[#525252] transition-colors bg-white dark:bg-[#171717]"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fit + Format */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Mode</label>
                <div className="space-y-1.5">
                  {FIT_MODES.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setFit(m.value)}
                      style={fit === m.value ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${fit === m.value ? 'text-white' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#404040] dark:hover:border-[#525252]'}`}
                    >
                      <span className="text-sm font-medium">{m.label}</span>
                      <span className={`text-[10px] ${fit === m.value ? 'text-white/80' : 'text-[#a3a3a3]'}`}>{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Format de sortie</label>
                <select
                  value={format} onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': ACCENT }}
                >
                  {OUTPUT_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleResize} disabled={!file || loading}
                style={{ backgroundColor: ACCENT }}
                className="flex-1 py-3 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Traitement…
                  </span>
                ) : 'Redimensionner et télécharger'}
              </button>
              <button onClick={reset} className="py-3 px-4 border border-[#e5e5e5] dark:border-[#404040] rounded-lg text-sm font-medium text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors">
                Réinitialiser
              </button>
            </div>

            {result && (
              <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Prêt à télécharger</p>
                    <p className="text-xs text-green-600 dark:text-green-500">{result.outW} × {result.outH} px · {formatBytes(result.size)}</p>
                  </div>
                  <button onClick={() => setModalOpen(true)} className="text-xs font-medium border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                    Voir le résultat
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Colonne droite : aperçu temps réel ── */}
          <div className="lg:sticky lg:top-8 self-start space-y-3">
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
                  <p className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">Aperçu en temps réel</p>
                </div>
                {file && (
                  <span className="text-[10px] font-mono text-[#a3a3a3]">
                    {prevW} × {prevH} px
                    {scaleRatio && <span className="ml-1.5 text-[#737373]">({scaleRatio}%)</span>}
                  </span>
                )}
              </div>

              {/* Canvas area */}
              <div className="p-4 flex items-center justify-center min-h-64 bg-[#fafafa] dark:bg-[#0a0a0a]">
                {file ? (
                  <canvas
                    ref={canvasRef}
                    className="rounded shadow-sm"
                    style={{ maxWidth: '100%', maxHeight: '360px', imageRendering: 'auto' }}
                  />
                ) : (
                  <div className="text-center text-[#a3a3a3]">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    <p className="text-sm">Chargez une image pour voir l&apos;aperçu</p>
                  </div>
                )}
              </div>

              {/* Infos bande */}
              {file && (
                <div className="grid grid-cols-3 divide-x divide-[#f5f5f5] dark:divide-[#1a1a1a] border-t border-[#f5f5f5] dark:border-[#1a1a1a]">
                  {[
                    { label: 'Original',  val: `${origDims.w}×${origDims.h}` },
                    { label: 'Cible',     val: `${prevW}×${prevH}` },
                    { label: 'Mode',      val: FIT_MODES.find(m => m.value === fit)?.label || fit },
                  ].map(({ label, val }) => (
                    <div key={label} className="px-3 py-2.5 text-center">
                      <p className="text-[10px] text-[#a3a3a3] mb-0.5">{label}</p>
                      <p className="text-xs font-medium text-[#171717] dark:text-[#ededed] font-mono">{val}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Légende modes */}
            {file && (
              <div className="text-[10px] text-[#a3a3a3] leading-relaxed bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-3 space-y-1">
                <p><span className="text-[#525252] dark:text-[#737373] font-medium">Damier gris</span> = zones transparentes (mode Contenir)</p>
                <p>L&apos;aperçu est simulé côté navigateur — le fichier final est traité côté serveur.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Image redimensionnée" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4 text-center p-4 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
            <div>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Avant</p>
              <p className="text-base font-semibold text-[#171717] dark:text-[#ededed]">{origDims.w} × {origDims.h}</p>
            </div>
            <div>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Après</p>
              <p className="text-base font-semibold text-[#171717] dark:text-[#ededed]">{result?.outW} × {result?.outH}</p>
            </div>
            <div>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Taille fichier</p>
              <p className="text-base font-semibold text-[#171717] dark:text-[#ededed]">{formatBytes(result?.size)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
            <div className="flex items-center gap-3">
              {result?.url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={result.url} alt="Redimensionnée" className="h-12 w-12 rounded-lg object-cover shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">{result?.filename}</p>
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{result?.outW} × {result?.outH} px</p>
              </div>
            </div>
            <button onClick={handleDownload} style={{ backgroundColor: ACCENT }} className="flex items-center gap-2 py-2 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger
            </button>
          </div>
          {result?.url && (
            <div className="rounded-xl overflow-hidden border border-[#e5e5e5] dark:border-[#262626] bg-[#f5f5f5] dark:bg-[#0a0a0a] flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.url} alt="Résultat" className="max-h-72 max-w-full object-contain rounded-lg" />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
