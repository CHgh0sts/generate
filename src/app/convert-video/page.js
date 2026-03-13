"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';

const ACCENT = '#f97316';

function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const value = Number(e.target.value);
    const newTime = (value / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(e.target.value);
    const vol = Math.min(Math.max(value, 0), 1);
    video.volume = vol;
    video.muted = vol === 0;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const formatTime = (time) => {
    if (!Number.isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black">
      <div className="aspect-video">
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          volume={volume}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-3 pb-3 pt-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] tabular-nums text-white/80">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-white hover:text-white/80 text-sm"
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>

            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => {
                e.stopPropagation();
                handleSeek(e);
              }}
              className="flex-1 accent-white/90 cursor-pointer"
            />

            <div className="relative flex items-center">
              <div className="group relative flex items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="text-white/80 hover:text-white"
                >
                  {isMuted || volume === 0 ? (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 5L6 9H3v6h3l5 4V5z" />
                      <path d="M15 9l6 6" />
                      <path d="M21 9l-6 6" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 5L6 9H3v6h3l5 4V5z" />
                      <path d="M15 9a4 4 0 010 6" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 5L6 9H3v6h3l5 4V5z" />
                      <path d="M15 9a4 4 0 010 6" />
                      <path d="M19 7a8 8 0 010 10" />
                    </svg>
                  )}
                </button>
                <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 pointer-events-auto transition-opacity">
                  <div className="rounded-md bg-black/85 px-2 py-2 shadow-lg border border-white/10">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleVolumeChange(e);
                      }}
                      className="w-20 accent-white/90 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const formats = [
  { value: 'mp4', label: 'MP4' },
  { value: 'webm', label: 'WebM' },
  { value: 'avi', label: 'AVI' },
  { value: 'mov', label: 'MOV' },
  { value: 'gif', label: 'GIF' },
];

export default function ConvertVideoPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('mp4');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setError(null);
    setResultUrl(null);

    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }

    if (!selected.type.startsWith('video/')) {
      setError('Veuillez sélectionner un fichier vidéo (MP4, WebM, AVI, etc.)');
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Veuillez sélectionner une vidéo');
      return;
    }

    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);

      const res = await fetch('/api/convert-video', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

      const filename = (res.headers.get('Content-Disposition') || '')
        .match(/filename="([^"]+)"/)?.[1] || `video.${format}`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || 'Erreur lors de la conversion');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setFormat('mp4');
    setPreview(null);
    setError(null);
    setResultUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] shrink-0" aria-label="Retour aux outils">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed] truncate">Convertisseur vidéo</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] truncate">MP4, WebM, AVI, MOV, MKV, GIF</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="max-w-3xl space-y-6">
          <div>
            <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Vidéo à convertir</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl p-8 text-center cursor-pointer hover:border-[#404040] dark:hover:border-[#525252] transition-colors bg-white dark:bg-[#171717]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {preview ? (
                <div className="space-y-4">
                  <VideoPlayer src={preview} />
                  <p className="text-sm text-[#525252] dark:text-[#a3a3a3] truncate">{file?.name}</p>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Cliquez pour changer</p>
                </div>
              ) : (
                <div className="text-[#737373] dark:text-[#a3a3a3]">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Cliquez ou glissez une vidéo</p>
                  <p className="text-xs mt-1">MP4, WebM, AVI, MOV, MKV...</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Format de sortie</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={{ '--tw-ring-color': ACCENT }}
              className="w-full px-4 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2 focus:border-transparent"
            >
              {formats.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleConvert}
              disabled={!file || loading}
              style={{ backgroundColor: ACCENT }}
              className="flex-1 py-3 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Conversion...' : 'Convertir'}
            </button>
            <button
              onClick={reset}
              className="py-3 px-4 border border-[#e5e5e5] dark:border-[#404040] rounded-lg text-sm font-medium text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
            >
              Réinitialiser
            </button>
          </div>

          {resultUrl && (
            <div className="p-4 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] space-y-3">
              <div>
                <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">Conversion réussie</p>
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                  Le fichier a été téléchargé automatiquement. Vous pouvez aussi le prévisualiser ci-dessous.
                </p>
              </div>
              <VideoPlayer src={resultUrl} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
