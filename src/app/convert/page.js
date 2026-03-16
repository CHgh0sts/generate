'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Modal } from '../Modal';

const ACCENT = '#2563eb';

const formats = [
  { value: 'png',  label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
  { value: 'gif',  label: 'GIF' },
  { value: 'tiff', label: 'TIFF' },
  { value: 'ico',  label: 'ICO' },
  { value: 'bmp',  label: 'BMP' },
];

const icoPresets = [
  { value: 'favicon',  label: 'Favicon',  desc: '16, 32, 48 px' },
  { value: 'standard', label: 'Standard', desc: '16, 32, 48, 64, 128 px' },
  { value: 'full',     label: 'Complet',  desc: '16, 32, 48, 64, 128, 256 px' },
];

function formatBytes(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`;
  return `${(b / (1024 * 1024)).toFixed(2)} Mo`;
}

export default function ConvertPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('png');
  const [icoPreset, setIcoPreset] = useState('full');
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const fileInputRef = useRef(null);

  const handleFile = (selected) => {
    setError(null); setResult(null);
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image (PNG, JPEG, WebP, etc.)');
      return;
    }
    setFile(selected);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(selected));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleConvert = async () => {
    if (!file) { setError('Veuillez sélectionner une image'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      if (format === 'ico') formData.append('icoPreset', icoPreset);
      const res = await fetch('/api/convert', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || `image.${format === 'jpeg' ? 'jpg' : format}`;
      setResult({ url, filename, size: blob.size, format });
      setModalOpen(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de la conversion');
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
    setFile(null); setPreview(null); setFormat('png'); setIcoPreset('full'); setError(null); setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Convertisseur d&apos;image</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">PNG, JPEG, WebP, AVIF, GIF, TIFF, ICO</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Image à convertir</label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors bg-white dark:bg-[#171717] ${dragging ? 'border-[#404040] dark:border-[#525252] bg-[#f5f5f5] dark:bg-[#1a1a1a]' : 'border-[#e5e5e5] dark:border-[#262626] hover:border-[#404040] dark:hover:border-[#525252]'}`}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
                {preview ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Aperçu" className="max-h-56 mx-auto object-contain rounded-lg" />
                    <p className="text-sm text-[#525252] dark:text-[#a3a3a3] truncate">{file?.name}</p>
                    <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{formatBytes(file?.size)} · Cliquez ou déposez pour changer</p>
                  </div>
                ) : (
                  <div className="text-[#737373] dark:text-[#a3a3a3]">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium">Cliquez ou glissez une image</p>
                    <p className="text-xs mt-1 text-[#a3a3a3]">PNG, JPEG, WebP, GIF, BMP, TIFF…</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Format de sortie</label>
              <div className="grid grid-cols-4 gap-2">
                {formats.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    style={format === f.value ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${format === f.value ? 'text-white' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#404040] dark:hover:border-[#525252]'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ICO preset selector */}
            {format === 'ico' && (
              <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">Tailles incluses dans le .ico</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {icoPresets.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setIcoPreset(p.value)}
                      style={icoPreset === p.value ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
                      className={`flex flex-col items-center py-3 px-2 rounded-lg border text-center transition-colors ${icoPreset === p.value ? 'text-white' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#404040] dark:hover:border-[#525252]'}`}
                    >
                      <span className="text-sm font-semibold">{p.label}</span>
                      <span className={`text-[10px] mt-0.5 ${icoPreset === p.value ? 'text-white/80' : 'text-[#a3a3a3]'}`}>{p.desc}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#a3a3a3] leading-relaxed">
                  Le fichier <code className="font-mono bg-[#f5f5f5] dark:bg-[#262626] px-1 rounded">.ico</code> contiendra toutes les tailles sélectionnées dans un seul fichier. Chaque taille est encodée en PNG 32-bit (RGBA, transparence supportée).
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConvert} disabled={!file || loading}
                style={{ backgroundColor: ACCENT }}
                className="flex-1 py-3 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Conversion…
                  </span>
                ) : 'Convertir'}
              </button>
              <button onClick={reset} className="py-3 px-4 border border-[#e5e5e5] dark:border-[#404040] rounded-lg text-sm font-medium text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors">
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-5">
              <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-3">Formats supportés</p>
              <ul className="space-y-2 text-sm text-[#525252] dark:text-[#a3a3a3]">
                {[
                  { fmt: 'PNG',  desc: 'Sans perte, transparence' },
                  { fmt: 'JPEG', desc: 'Compression, photos' },
                  { fmt: 'WebP', desc: 'Web moderne, léger' },
                  { fmt: 'AVIF', desc: 'Très compressé, qualité' },
                  { fmt: 'GIF',  desc: 'Animations, 256 couleurs' },
                  { fmt: 'TIFF', desc: 'Haute qualité, impression' },
                  { fmt: 'ICO',  desc: 'Favicon multi-tailles' },
                ].map(({ fmt, desc }) => (
                  <li key={fmt} className="flex items-center justify-between">
                    <span className="font-medium text-[#171717] dark:text-[#ededed] font-mono text-xs">{fmt}</span>
                    <span className="text-xs">{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
            {result && (
              <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Conversion réussie</p>
                <p className="text-xs text-green-600 dark:text-green-500 mb-3">{result.filename} · {formatBytes(result.size)}</p>
                <button onClick={() => setModalOpen(true)} className="w-full py-2 text-xs font-medium border border-green-300 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                  Voir le résultat
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Image convertie" size="lg">
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
            <div>
              <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">{result?.filename}</p>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{result?.format?.toUpperCase()} · {formatBytes(result?.size)}</p>
            </div>
            <button
              onClick={handleDownload}
              style={{ backgroundColor: ACCENT }}
              className="flex items-center gap-2 py-2 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger
            </button>
          </div>
          {result?.url && (
            <div className="space-y-3">
              {/* Compare toggle (non-ICO only) */}
              {result.format !== 'ico' && preview && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setCompareMode(!compareMode)}
                    style={compareMode ? { backgroundColor: ACCENT } : {}}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${compareMode ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                    ⇔ Comparaison avant/après
                  </button>
                  {compareMode && <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">Glissez le curseur</span>}
                </div>
              )}
              <div className="rounded-xl overflow-hidden border border-[#e5e5e5] dark:border-[#262626] bg-[#f5f5f5] dark:bg-[#0a0a0a] flex items-center justify-center min-h-40">
                {result.format === 'ico' ? (
                  <div className="text-center space-y-3 p-4">
                    <div className="w-16 h-16 mx-auto rounded-xl border-2 border-dashed border-[#e5e5e5] dark:border-[#404040] flex items-center justify-center bg-white dark:bg-[#171717]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={result.url} alt="Favicon ICO" className="w-10 h-10 object-contain" />
                    </div>
                    <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Fichier .ico multi-tailles</p>
                    <p className="text-[10px] text-[#a3a3a3]">{icoPresets.find(p => p.value === icoPreset)?.desc || ''}</p>
                  </div>
                ) : compareMode && preview ? (
                  /* Before / After slider */
                  <div className="relative w-full select-none" style={{ maxHeight: '320px' }}>
                    {/* After (converted) — full width */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.url} alt="Après" className="w-full max-h-80 object-contain" />
                    {/* Before (original) — clipped to left side */}
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Avant" className="w-full max-h-80 object-contain" style={{ width: `${10000 / sliderPos}%`, maxWidth: 'none' }} />
                    </div>
                    {/* Divider line */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPos}%` }}>
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border border-[#e5e5e5]">
                        <svg className="w-4 h-4 text-[#525252]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-4 3 4 3M16 9l4 3-4 3" /></svg>
                      </div>
                    </div>
                    {/* Slider */}
                    <input type="range" min={0} max={100} value={sliderPos} onChange={e => setSliderPos(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" />
                    {/* Labels */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded">Avant</div>
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded">Après</div>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={result.url} alt="Résultat" className="max-h-80 max-w-full object-contain rounded-lg p-4" />
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
