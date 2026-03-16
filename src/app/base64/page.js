'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, ArrowRight } from 'lucide-react';

const ACCENT = '#f59e0b';

function formatBytes(bytes) {
  if (!bytes) return '0 o';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

export default function Base64Page() {
  const [mode, setMode] = useState('text');
  const [direction, setDirection] = useState('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [fileOutput, setFileOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleTextProcess = () => {
    setError(null);
    setOutput('');
    if (!input) return;
    try {
      if (direction === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } else {
        setOutput(decodeURIComponent(escape(atob(input.trim()))));
      }
    } catch {
      setError(direction === 'encode' ? 'Erreur lors de l\'encodage' : 'La chaîne n\'est pas un Base64 valide');
    }
  };

  const handleFileEncode = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setFileOutput('');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      const mimeType = selected.type || 'application/octet-stream';
      setFileOutput(`data:${mimeType};base64,${base64}`);
    };
    reader.readAsDataURL(selected);
  };

  const handleBase64Decode = () => {
    setError(null);
    if (!input.trim()) return;
    try {
      const str = input.trim();
      let base64 = str;
      let mimeType = 'application/octet-stream';
      let filename = 'fichier';
      if (str.startsWith('data:')) {
        const match = str.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) throw new Error('Format data URI invalide');
        mimeType = match[1];
        base64 = match[2];
        const ext = mimeType.split('/')[1] || 'bin';
        filename = `decoded.${ext}`;
      } else {
        filename = 'decoded.bin';
      }
      const byteChars = atob(base64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('La chaîne n\'est pas un Base64 valide ou un data URI valide');
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapDirection = () => {
    setDirection((d) => d === 'encode' ? 'decode' : 'encode');
    setInput(output);
    setOutput('');
    setError(null);
  };

  const reset = () => {
    setInput(''); setOutput(''); setError(null); setFile(null); setFileOutput('');
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
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Encodeur / Décodeur Base64</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Texte et fichiers</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="max-w-3xl space-y-6">

          <div className="flex rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-1 gap-1">
            {['text', 'file'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); reset(); }}
                style={mode === m ? { backgroundColor: ACCENT } : {}}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === m ? 'text-white' : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed]'}`}
              >
                {m === 'text' ? 'Texte' : 'Fichier'}
              </button>
            ))}
          </div>

          {mode === 'text' && (
            <>
              <div className="flex items-center gap-2">
                <div className={`flex-1 text-center text-xs font-medium py-1.5 rounded-md ${direction === 'encode' ? 'text-[#171717] dark:text-[#ededed]' : 'text-[#737373] dark:text-[#a3a3a3]'}`}>
                  {direction === 'encode' ? <span className="flex items-center gap-1">Texte <ArrowRight className="w-3 h-3" /> Base64</span> : <span className="flex items-center gap-1">Base64 <ArrowRight className="w-3 h-3" /> Texte</span>}
                </div>
                <button
                  onClick={swapDirection}
                  className="shrink-0 p-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
                  title="Inverser"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">
                  {direction === 'encode' ? 'Texte à encoder' : 'Base64 à décoder'}
                </label>
                <textarea
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setOutput(''); setError(null); }}
                  rows={5}
                  placeholder={direction === 'encode' ? 'Entrez votre texte ici…' : 'Collez votre chaîne Base64 ici…'}
                  className="w-full px-3 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252] resize-none"
                />
                <p className="text-[10px] text-[#a3a3a3] mt-1">{input.length} caractère{input.length !== 1 ? 's' : ''}</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{error}</div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleTextProcess} disabled={!input}
                  style={{ backgroundColor: ACCENT }}
                  className="flex-1 py-3 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {direction === 'encode' ? 'Encoder en Base64' : 'Décoder le Base64'}
                </button>
                <button onClick={reset} className="py-3 px-4 border border-[#e5e5e5] dark:border-[#404040] rounded-lg text-sm font-medium text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors">
                  Vider
                </button>
              </div>

              {output && (
                <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626] flex items-center justify-between">
                    <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">Résultat</p>
                    <button onClick={() => copy(output)} className="text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors">
                      {copied ? <><Check className="inline w-3 h-3 mr-0.5" />Copié</> : 'Copier'}
                    </button>
                  </div>
                  <div className="p-4">
                    {direction === 'decode' && output && (() => {
                      const dataUri = `data:image/png;base64,${input.trim()}`;
                      const isImg = /^data:image\//i.test(input.trim()) || /^\/9j\/|^iVBOR/i.test(input.trim());
                      return isImg ? (
                        <div className="mb-3">
                          <p className="text-[10px] text-[#a3a3a3] mb-1.5">Aperçu image</p>
                          <img src={/^data:/.test(input.trim()) ? input.trim() : dataUri} alt="preview" className="max-w-full max-h-48 rounded-lg border border-[#e5e5e5] dark:border-[#262626] object-contain" />
                        </div>
                      ) : null;
                    })()}
                    {direction === 'encode' && /^data:image\//i.test(output) && (
                      <div className="mb-3">
                        <p className="text-[10px] text-[#a3a3a3] mb-1.5">Aperçu image</p>
                        <img src={output} alt="preview" className="max-w-full max-h-48 rounded-lg border border-[#e5e5e5] dark:border-[#262626] object-contain" />
                      </div>
                    )}
                    <p className="text-sm font-mono text-[#171717] dark:text-[#ededed] break-all leading-relaxed">{output}</p>
                    <p className="text-[10px] text-[#a3a3a3] mt-2">{output.length} caractère{output.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'file' && (
            <>
              <div className="flex rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-1 gap-1">
                {['encode', 'decode'].map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDirection(d); reset(); }}
                    style={direction === d ? { backgroundColor: ACCENT } : {}}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${direction === d ? 'text-white' : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed]'}`}
                  >
                    {d === 'encode' ? <span className="flex items-center gap-1">Fichier <ArrowRight className="w-3 h-3" /> Base64</span> : <span className="flex items-center gap-1">Base64 <ArrowRight className="w-3 h-3" /> Fichier</span>}
                  </button>
                ))}
              </div>

              {direction === 'encode' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Fichier à encoder</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl p-8 text-center cursor-pointer hover:border-[#404040] dark:hover:border-[#525252] transition-colors bg-white dark:bg-[#171717]"
                    >
                      <input ref={fileInputRef} type="file" onChange={handleFileEncode} className="hidden" />
                      {file ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">{file.name}</p>
                          <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{file.type || 'type inconnu'} · {formatBytes(file.size)}</p>
                          <p className="text-xs text-[#a3a3a3]">Cliquez pour changer</p>
                        </div>
                      ) : (
                        <div className="text-[#737373] dark:text-[#a3a3a3]">
                          <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm font-medium">Cliquez pour sélectionner un fichier</p>
                          <p className="text-xs mt-1">N&apos;importe quel fichier</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {fileOutput && (
                    <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] overflow-hidden">
                      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626] flex items-center justify-between">
                        <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">Data URI encodé</p>
                        <button onClick={() => copy(fileOutput)} className="flex items-center gap-1 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors">
                          {copied ? <><Check className="w-3 h-3" />Copié</> : 'Copier'}
                        </button>
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-mono text-[#737373] dark:text-[#a3a3a3] break-all line-clamp-4">{fileOutput.substring(0, 300)}…</p>
                        <p className="text-[10px] text-[#a3a3a3] mt-2">{fileOutput.length} caractères</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Data URI ou Base64 brut</label>
                    <textarea
                      value={input}
                      onChange={(e) => { setInput(e.target.value); setError(null); }}
                      rows={6}
                      placeholder="data:image/png;base64,iVBOR…  ou base64 brut"
                      className="w-full px-3 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252] resize-none"
                    />
                  </div>
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{error}</div>
                  )}
                  <button
                    onClick={handleBase64Decode} disabled={!input}
                    style={{ backgroundColor: ACCENT }}
                    className="w-full py-3 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Décoder et télécharger
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
