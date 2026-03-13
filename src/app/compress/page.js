'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Modal } from '../Modal';

const ACCENT = '#0891b2';

const OUTPUT_FORMATS = [
  { value: 'original', label: 'Format original' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
];

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

function pct(original, compressed) {
  if (!original || !compressed) return null;
  return Math.round((1 - compressed / original) * 100);
}

export default function CompressPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('original');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setError(null);
    setResult(null);
    if (!selected) { setFile(null); setPreview(null); return; }
    if (!selected.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (JPEG, PNG, WebP, AVIF)');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileChange({ target: { files: [dropped] } });
  };

  const handleCompress = async () => {
    if (!file) { setError('Veuillez sélectionner une image'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', quality);
      formData.append('format', format);
      const res = await fetch('/api/compress', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const originalSize = Number(res.headers.get('X-Original-Size') || 0);
      const compressedSize = Number(res.headers.get('X-Compressed-Size') || 0);
      const filename = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'compressed.jpg';
      setResult({ url, originalSize, compressedSize, filename });
      setModalOpen(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de la compression');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    a.click();
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null); setPreview(null); setQuality(80); setFormat('original');
    setError(null); setResult(null); setModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reduction = result ? pct(result.originalSize, result.compressedSize) : null;

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
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Compresseur d&apos;images</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">JPEG, PNG, WebP, AVIF</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="max-w-2xl space-y-6">

          <div>
            <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Image à compresser</label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl p-8 text-center cursor-pointer hover:border-[#404040] dark:hover:border-[#525252] transition-colors bg-white dark:bg-[#171717]"
            >
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleFileChange} className="hidden" />
              {preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Aperçu" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <p className="text-sm text-[#525252] dark:text-[#a3a3a3] truncate">{file?.name}</p>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{formatBytes(file?.size)} · Cliquez pour changer</p>
                </div>
              ) : (
                <div className="text-[#737373] dark:text-[#a3a3a3]">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Cliquez ou glissez une image</p>
                  <p className="text-xs mt-1">JPEG, PNG, WebP, AVIF</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">
                Qualité — {quality}%
              </label>
              <input
                type="range" min={1} max={100} value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                style={{ accentColor: ACCENT }}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#a3a3a3] mt-1">
                <span>Petit fichier</span>
                <span>Haute qualité</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Format de sortie</label>
              <select
                value={format} onChange={(e) => setFormat(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252] text-sm"
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
              onClick={handleCompress} disabled={!file || loading}
              style={{ backgroundColor: ACCENT }}
              className="flex-1 py-3 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Compression...' : 'Compresser'}
            </button>
            <button
              onClick={reset}
              className="py-3 px-4 border border-[#e5e5e5] dark:border-[#404040] rounded-lg text-sm font-medium text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
            >
              Réinitialiser
            </button>
          </div>

          {result && (
            <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Compression réussie</p>
                  <p className="text-xs text-green-600 dark:text-green-500">{result.filename} · {formatBytes(result.compressedSize)} {reduction > 0 && <span className="font-semibold">(-{reduction}%)</span>}</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="text-xs font-medium border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                  Voir le résultat
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Image compressée" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4 text-center p-4 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
            <div>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Avant</p>
              <p className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">{formatBytes(result?.originalSize)}</p>
            </div>
            <div>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Après</p>
              <p className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">{formatBytes(result?.compressedSize)}</p>
            </div>
            <div>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Réduction</p>
              <p className={`text-lg font-semibold ${reduction > 0 ? 'text-green-600 dark:text-green-400' : 'text-[#737373]'}`}>
                {reduction !== null ? (reduction > 0 ? `-${reduction}%` : `+${Math.abs(reduction)}%`) : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
            <div className="flex items-center gap-3">
              {result?.url && <img src={result.url} alt="Compressée" className="h-12 w-12 rounded-lg object-cover shrink-0" />}
              <div>
                <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">{result?.filename}</p>
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{formatBytes(result?.compressedSize)}</p>
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
