'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import CryptoJS from 'crypto-js';

const ACCENT = '#84cc16';

const ALGOS = [
  { id: 'md5',    label: 'MD5',     bits: 128 },
  { id: 'sha1',   label: 'SHA-1',   bits: 160 },
  { id: 'sha256', label: 'SHA-256', bits: 256 },
  { id: 'sha512', label: 'SHA-512', bits: 512 },
  { id: 'sha3',   label: 'SHA-3',   bits: 256 },
  { id: 'ripemd', label: 'RIPEMD-160', bits: 160 },
];

function computeHash(text, algo) {
  switch (algo) {
    case 'md5':    return CryptoJS.MD5(text).toString();
    case 'sha1':   return CryptoJS.SHA1(text).toString();
    case 'sha256': return CryptoJS.SHA256(text).toString();
    case 'sha512': return CryptoJS.SHA512(text).toString();
    case 'sha3':   return CryptoJS.SHA3(text, { outputLength: 256 }).toString();
    case 'ripemd': return CryptoJS.RIPEMD160(text).toString();
    default:       return '';
  }
}

export default function HashPage() {
  const [input, setInput]     = useState('');
  const [mode, setMode]       = useState('text'); // text | file
  const [fileName, setFileName] = useState('');
  const [copied, setCopied]   = useState('');

  const hashes = ALGOS.map(a => ({ ...a, value: input ? computeHash(input, a.id) : '' }));

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setInput(e.target.result);
    reader.readAsBinaryString(file);
  };

  const copyHash = useCallback((id, val) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(''), 1800);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" aria-label="Retour" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Générateur de hash</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">MD5, SHA-1, SHA-256, SHA-512, SHA-3, RIPEMD-160</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Mode selector */}
        <div className="flex gap-2">
          {['text', 'file'].map(m => (
            <button key={m} onClick={() => { setMode(m); setInput(''); setFileName(''); }}
              style={mode === m ? { backgroundColor: ACCENT } : {}}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${mode === m ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
              {m === 'text' ? 'Texte' : 'Fichier'}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
          {mode === 'text' ? (
            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Texte à hasher</label>
              <textarea
                rows={5} value={input} onChange={e => setInput(e.target.value)}
                placeholder="Entrez votre texte ici…"
                className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] text-sm font-mono focus:outline-none focus:ring-2 resize-none"
                style={{ '--tw-ring-color': ACCENT }}
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-[#a3a3a3]">{input.length} caractères</span>
                <button onClick={() => setInput('')} className="text-[10px] text-[#a3a3a3] hover:text-[#525252]">Effacer</button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl p-10 cursor-pointer hover:border-[#404040] transition-colors">
              <input type="file" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
              <svg className="w-10 h-10 mb-3 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {fileName ? <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">{fileName}</p> : <p className="text-sm text-[#737373]">Cliquez pour sélectionner un fichier</p>}
            </label>
          )}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {hashes.map(h => (
            <div key={h.id} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] font-mono">{h.label}</span>
                  <span className="text-[10px] text-[#a3a3a3] bg-[#f5f5f5] dark:bg-[#262626] px-1.5 py-0.5 rounded">{h.bits} bits</span>
                </div>
                <button
                  onClick={() => h.value && copyHash(h.id, h.value)}
                  disabled={!h.value}
                  style={copied === h.id ? { backgroundColor: '#10b981' } : { backgroundColor: ACCENT }}
                  className="px-2.5 py-1 text-white text-[10px] font-semibold rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {copied === h.id ? '✓ Copié' : 'Copier'}
                </button>
              </div>
              <code className={`block text-xs font-mono break-all leading-relaxed ${h.value ? 'text-[#171717] dark:text-[#ededed]' : 'text-[#a3a3a3]'}`}>
                {h.value || '—'.repeat(h.bits / 8 > 20 ? 40 : 20)}
              </code>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-[#737373] dark:text-[#a3a3a3]">
          {[
            { title: '100% local', desc: 'Aucune donnée envoyée sur un serveur' },
            { title: 'Temps réel', desc: 'Tous les hash calculés simultanément' },
            { title: 'Multi-algo', desc: '6 algorithmes disponibles en simultané' },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-3">
              <p className="font-semibold text-[#171717] dark:text-[#ededed] mb-0.5">{title}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
