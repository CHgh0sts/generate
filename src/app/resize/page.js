'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Modal } from '../Modal';

const ACCENT = '#059669';

const FIT_MODES = [
  { value: 'inside', label: 'Contenir (proportionnel)' },
  { value: 'cover', label: 'Couvrir (recadrer)' },
  { value: 'fill', label: 'Étirer (déformer)' },
];

const OUTPUT_FORMATS = [
  { value: 'original', label: 'Format original' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
];

export default function ResizePage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [origDims, setOrigDims] = useState({ w: 0, h: 0 });
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lockRatio, setLockRatio] = useState(true);
  const [fit, setFit] = useState('inside');
  const [format, setFormat] = useState('original');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setError(null); setResult(null);
    if (!selected) { setFile(null); setPreview(null); return; }
    if (!selected.type.startsWith('image/')) { setError('Veuillez sélectionner une image'); return; }
    setFile(selected);
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
      const ratio = origDims.h / origDims.w;
      setHeight(String(Math.round(Number(val) * ratio)));
    }
  };

  const handleHeightChange = (val) => {
    setHeight(val);
    if (lockRatio && origDims.w && origDims.h && val) {
      const ratio = origDims.w / origDims.h;
      setWidth(String(Math.round(Number(val) * ratio)));
    }
  };

  const handleResize = async () => {
    if (!file) { setError('Veuillez sélectionner une image'); return; }
    if (!width && !height) { setError('Entrez au moins une dimension'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (width) formData.append('width', width);
      if (height) formData.append('height', height);
      formData.append('fit', fit);
      formData.append('format', format);
      const res = await fetch('/api/resize', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'resized.jpg';
      const outW = Number(res.headers.get('X-Output-Width') || 0);
      const outH = Number(res.headers.get('X-Output-Height') || 0);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatBytes = (b) => {
    if (!b) return '—';
    if (b < 1024) return `${b} o`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`;
    return `${(b / (1024 * 1024)).toFixed(2)} Mo`;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
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

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="max-w-2xl space-y-6">

          <div>
            <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Image à redimensionner</label>
            <div
              onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl p-8 text-center cursor-pointer hover:border-[#404040] dark:hover:border-[#525252] transition-colors bg-white dark:bg-[#171717]"
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Aperçu" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <p className="text-sm text-[#525252] dark:text-[#a3a3a3] truncate">{file?.name}</p>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{origDims.w} × {origDims.h} px · Cliquez pour changer</p>
                </div>
              ) : (
                <div className="text-[#737373] dark:text-[#a3a3a3]">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2" />
                  </svg>
                  <p className="text-sm font-medium">Cliquez ou glissez une image</p>
                  <p className="text-xs mt-1">JPEG, PNG, WebP, AVIF, GIF…</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">Dimensions (px)</label>
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
                  className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Hauteur</label>
                <input
                  type="number" value={height} onChange={(e) => handleHeightChange(e.target.value)} min={1} placeholder="ex: 1080"
                  className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252]"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Mode de redimensionnement</label>
              <select value={fit} onChange={(e) => setFit(e.target.value)} className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252]">
                {FIT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Format de sortie</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252]">
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
              {loading ? 'Traitement...' : 'Redimensionner'}
            </button>
            <button onClick={reset} className="py-3 px-4 border border-[#e5e5e5] dark:border-[#404040] rounded-lg text-sm font-medium text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors">
              Réinitialiser
            </button>
          </div>

          {result && (
            <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Redimensionnement réussi</p>
                  <p className="text-xs text-green-600 dark:text-green-500">{result.outW} × {result.outH} px · {formatBytes(result.size)}</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="text-xs font-medium border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                  Voir le résultat
                </button>
              </div>
            </div>
          )}
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
              {result?.url && <img src={result.url} alt="Redimensionnée" className="h-12 w-12 rounded-lg object-cover shrink-0" />}
              <div>
                <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">{result?.filename}</p>
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{result?.outW} × {result?.outH} px</p>
              </div>
            </div>
            <button onClick={handleDownload} style={{ backgroundColor: ACCENT }} className="flex items-center gap-2 py-2 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Télécharger
            </button>
          </div>
          {result?.url && (
            <div className="rounded-xl overflow-hidden border border-[#e5e5e5] dark:border-[#262626] bg-[#f5f5f5] dark:bg-[#0a0a0a] flex items-center justify-center p-4">
              <img src={result.url} alt="Résultat" className="max-h-72 max-w-full object-contain rounded-lg" />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
