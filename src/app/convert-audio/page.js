'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { ArrowRight } from 'lucide-react';
import { Modal } from '../Modal';

const ACCENT = '#ec4899';

const formats = [
  { value: 'mp3', label: 'MP3', desc: 'Universel, compressé' },
  { value: 'wav', label: 'WAV', desc: 'Sans perte, lourd' },
  { value: 'aac', label: 'AAC', desc: 'Apple, qualité' },
  { value: 'ogg', label: 'OGG', desc: 'Open source, web' },
  { value: 'flac', label: 'FLAC', desc: 'Sans perte, HD' },
  { value: 'm4a', label: 'M4A', desc: 'Apple, streaming' },
];

function formatBytes(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`;
  return `${(b / (1024 * 1024)).toFixed(2)} Mo`;
}

export default function ConvertAudioPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('mp3');
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (selected) => {
    setError(null); setResult(null);
    if (!selected) return;
    if (!selected.type.startsWith('audio/') && !selected.type.startsWith('video/')) {
      setError('Veuillez sélectionner un fichier audio ou vidéo');
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
    if (!file) { setError('Veuillez sélectionner un fichier'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      const res = await fetch('/api/convert-audio', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || `audio.${format}`;
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
    setFile(null); setPreview(null); setFormat('mp3'); setError(null); setResult(null);
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
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Convertisseur audio</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">MP3, WAV, AAC, OGG, FLAC, M4A</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Fichier audio à convertir</label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors bg-white dark:bg-[#171717] ${dragging ? 'border-[#404040] dark:border-[#525252] bg-[#f5f5f5] dark:bg-[#1a1a1a]' : 'border-[#e5e5e5] dark:border-[#262626] hover:border-[#404040] dark:hover:border-[#525252]'}`}
              >
                <input ref={fileInputRef} type="file" accept="audio/*,video/*" onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
                {preview ? (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <audio src={preview} controls className="w-full max-w-sm mx-auto" />
                    <p className="text-sm text-[#525252] dark:text-[#a3a3a3] truncate">{file?.name}</p>
                    <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{formatBytes(file?.size)} · <span className="cursor-pointer underline" onClick={() => fileInputRef.current?.click()}>Cliquez pour changer</span></p>
                  </div>
                ) : (
                  <div className="text-[#737373] dark:text-[#a3a3a3]">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-sm font-medium">Cliquez ou glissez un fichier audio</p>
                    <p className="text-xs mt-1 text-[#a3a3a3]">MP3, WAV, M4A, OGG, FLAC, ou extrait audio d&apos;une vidéo</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Format de sortie</label>
              <div className="grid grid-cols-3 gap-2">
                {formats.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    style={format === f.value ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${format === f.value ? 'text-white' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#404040] dark:hover:border-[#525252]'}`}
                  >
                    <span className="block font-semibold">{f.label}</span>
                    <span className={`text-[10px] ${format === f.value ? 'text-white/70' : 'text-[#a3a3a3]'}`}>{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

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
              <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-3">À savoir</p>
              <ul className="space-y-2 text-xs text-[#525252] dark:text-[#a3a3a3]">
                <li className="flex gap-2"><ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-[#a3a3a3]" /> Fonctionne aussi avec des vidéos (extraction audio)</li>
                <li className="flex gap-2"><ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-[#a3a3a3]" /> FLAC et WAV : sans perte de qualité</li>
                <li className="flex gap-2"><ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-[#a3a3a3]" /> MP3 : meilleure compatibilité universelle</li>
                <li className="flex gap-2"><ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-[#a3a3a3]" /> La conversion se fait côté serveur via ffmpeg</li>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Audio converti" size="md">
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
            <div className="rounded-xl p-4 bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-3">Écouter le résultat</p>
              <audio src={result.url} controls className="w-full" />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
