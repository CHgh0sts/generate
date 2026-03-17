'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Upload, Copy, Check, Download, RefreshCw, X, ExternalLink } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#0284c7';

const LANGS = [
  { code: 'fra', label: 'Français' },
  { code: 'eng', label: 'Anglais' },
  { code: 'deu', label: 'Allemand' },
  { code: 'spa', label: 'Espagnol' },
  { code: 'ita', label: 'Italien' },
  { code: 'por', label: 'Portugais' },
  { code: 'ara', label: 'Arabe' },
  { code: 'chi_sim', label: 'Chinois simplifié' },
  { code: 'jpn', label: 'Japonais' },
  { code: 'rus', label: 'Russe' },
];

export default function OcrPage() {
  const [preview, setPreview]   = useState(null);
  const [text, setText]         = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [lang, setLang]         = useState('fra');
  const [copied, setCopied]     = useState(false);
  const fileRef = useRef();
  const pushToast = useToast();

  const processImage = useCallback(async (file) => {
    if (!file?.type.startsWith('image/')) return;
    setPreview(URL.createObjectURL(file));
    setText(''); setProgress(0); setStatus('Chargement du moteur OCR…'); setLoading(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(lang, 1, {
        logger: m => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100));
          setStatus(m.status === 'recognizing text' ? `Reconnaissance… ${Math.round(m.progress * 100)}%` : m.status);
        },
      });
      const { data: { text: result } } = await worker.recognize(file);
      await worker.terminate();
      setText(result.trim());
      pushToast?.('Texte extrait !');
    } catch (e) {
      pushToast?.(`Erreur OCR : ${e.message}`, 'error');
    } finally { setLoading(false); setStatus(''); }
  }, [lang, pushToast]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) processImage(file);
  }

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true); pushToast?.('Copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'ocr-result.txt'; a.click();
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">OCR — Image vers texte</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Extrayez le texte d&apos;une image · 100% navigateur</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-[10px] text-[#a3a3a3] mb-1 block">Langue</label>
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed]">
              {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex-1" />
          <button onClick={() => fileRef.current?.click()} disabled={loading}
            style={{ backgroundColor: ACCENT }}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40">
            <Upload className="w-4 h-4" /> Charger une image
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Image drop zone */}
          <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            className="bg-white dark:bg-[#171717] rounded-xl border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] overflow-hidden min-h-[300px] flex flex-col">
            {preview ? (
              <div className="relative flex-1">
                <img src={preview} alt="Source" className="w-full h-full object-contain max-h-[400px]" />
                <button onClick={() => { setPreview(null); setText(''); }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-black/60 rounded-full">
                  <X className="w-4 h-4 text-[#525252]" />
                </button>
                {loading && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                    <p className="text-white text-sm font-medium">{status}</p>
                    <div className="w-48 h-1.5 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#a3a3a3] p-8 cursor-pointer" onClick={() => fileRef.current?.click()}>
                <Upload className="w-10 h-10 opacity-30" />
                <p className="text-sm text-center">Glissez une image ou cliquez pour l&apos;importer</p>
                <p className="text-xs">PNG, JPG, WebP, BMP, TIFF…</p>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
              <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">Texte extrait</span>
              {text && (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={copy} className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copier
                  </button>
                  <button onClick={download} className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                    <Download className="w-3 h-3" /> .txt
                  </button>
                  <Link href="/text" onClick={() => { try { sessionStorage.setItem('text_from_ocr', text); } catch {} }}
                    className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                    <ExternalLink className="w-3 h-3" /> Outils texte
                  </Link>
                </div>
              )}
            </div>
            <textarea readOnly value={text}
              placeholder={loading ? 'Analyse en cours…' : 'Le texte reconnu apparaîtra ici…'}
              className="flex-1 p-4 text-sm bg-transparent text-[#171717] dark:text-[#ededed] resize-none focus:outline-none min-h-[280px] placeholder:text-[#a3a3a3]" />
            {text && (
              <div className="px-4 py-2 border-t border-[#f5f5f5] dark:border-[#1a1a1a] text-[10px] text-[#a3a3a3]">
                {text.length} caractères · {text.split(/\s+/).filter(Boolean).length} mots · {text.split('\n').length} lignes
              </div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-center text-[#a3a3a3]">
          Propulsé par <a href="https://tesseract.projectnaptha.com" target="_blank" rel="noopener noreferrer" className="underline">Tesseract.js</a> · Traitement 100% local, aucune donnée envoyée
        </p>
      </main>
    </div>
  );
}
