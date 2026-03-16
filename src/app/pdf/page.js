'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { PDFDocument } from 'pdf-lib';

const ACCENT = '#dc2626';

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}

export default function PdfPage() {
  const [tab, setTab]     = useState('merge');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  // Split options
  const [splitPages, setSplitPages] = useState('');
  const [splitFile, setSplitFile]   = useState(null);

  const addFiles = useCallback((newFiles) => {
    setFiles(prev => [...prev, ...Array.from(newFiles).map(f => ({ file: f, name: f.name, size: f.size }))]);
    setResult(null); setError('');
  }, []);

  const removeFile = (i) => setFiles(files.filter((_,j) => j !== i));
  const moveUp = (i) => { if (i === 0) return; const a = [...files]; [a[i-1],a[i]] = [a[i],a[i-1]]; setFiles(a); };
  const moveDown = (i) => { if (i === files.length - 1) return; const a = [...files]; [a[i],a[i+1]] = [a[i+1],a[i]]; setFiles(a); };

  const download = (bytes, name) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleMerge = async () => {
    if (files.length < 2) { setError('Sélectionnez au moins 2 fichiers PDF.'); return; }
    setLoading(true); setError('');
    try {
      const merged = await PDFDocument.create();
      for (const { file } of files) {
        const buf = await file.arrayBuffer();
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      setResult({ bytes, name: 'merged.pdf', pages: merged.getPageCount() });
    } catch (e) { setError('Erreur : ' + e.message); }
    setLoading(false);
  };

  const handleSplit = async () => {
    if (!splitFile) { setError('Sélectionnez un fichier PDF.'); return; }
    setLoading(true); setError('');
    try {
      const buf = await splitFile.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const total = doc.getPageCount();

      // Parse pages spec: "1,3,5-8" → [0,2,4,5,6,7]
      let indices = [];
      if (!splitPages.trim()) { indices = doc.getPageIndices(); }
      else {
        for (const part of splitPages.split(',')) {
          if (part.includes('-')) {
            const [a,b] = part.split('-').map(Number);
            for (let i = a; i <= Math.min(b, total); i++) indices.push(i - 1);
          } else { const n = parseInt(part); if (n >= 1 && n <= total) indices.push(n - 1); }
        }
      }
      if (!indices.length) throw new Error('Aucune page valide spécifiée');

      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(doc, indices);
      pages.forEach(p => newDoc.addPage(p));
      const bytes = await newDoc.save();
      setResult({ bytes, name: `split_${splitFile.name}`, pages: indices.length });
    } catch (e) { setError('Erreur : ' + e.message); }
    setLoading(false);
  };

  const TABS = [
    { id: 'merge', label: 'Fusionner' },
    { id: 'split', label: 'Extraire des pages' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Retour" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Outils PDF</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Fusionner, extraire des pages</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        <div className="flex gap-1 border-b border-[#e5e5e5] dark:border-[#262626]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setResult(null); setError(''); setFiles([]); }}
              style={tab===t.id?{borderColor:ACCENT,color:ACCENT}:{}}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===t.id?'':'border-transparent text-[#737373] dark:text-[#a3a3a3]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Merge */}
        {tab === 'merge' && (
          <div className="space-y-4">
            <label onDragOver={e => { e.preventDefault(); }} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              className="flex flex-col items-center justify-center border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl p-8 cursor-pointer hover:border-[#404040] transition-colors bg-white dark:bg-[#171717]">
              <input type="file" accept=".pdf" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
              <svg className="w-10 h-10 mb-3 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-sm font-medium text-[#737373] dark:text-[#a3a3a3]">Glisser-déposer des PDF ici ou cliquer</p>
              <p className="text-xs text-[#a3a3a3] mt-1">L&apos;ordre dans la liste détermine l&apos;ordre de fusion</p>
            </label>

            {files.length > 0 && (
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-5 h-5 rounded text-center text-xs text-white font-bold shrink-0 flex items-center justify-center" style={{ backgroundColor: ACCENT }}>{i+1}</span>
                    <svg className="w-4 h-4 text-[#a3a3a3] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                    <span className="flex-1 text-sm text-[#171717] dark:text-[#ededed] truncate">{f.name}</span>
                    <span className="text-xs text-[#a3a3a3]">{fmtSize(f.size)}</span>
                    <button onClick={() => moveUp(i)} className="text-[#a3a3a3] hover:text-[#525252] text-xs px-1">↑</button>
                    <button onClick={() => moveDown(i)} className="text-[#a3a3a3] hover:text-[#525252] text-xs px-1">↓</button>
                    <button onClick={() => removeFile(i)} className="text-[#a3a3a3] hover:text-red-500 text-xs px-1">✕</button>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-lg">{error}</p>}

            <button onClick={handleMerge} disabled={loading || files.length < 2} style={{ backgroundColor: ACCENT }}
              className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? 'Fusion en cours…' : `Fusionner ${files.length} PDF`}
            </button>
          </div>
        )}

        {/* Split */}
        {tab === 'split' && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl p-8 cursor-pointer hover:border-[#404040] transition-colors bg-white dark:bg-[#171717]">
              <input type="file" accept=".pdf" className="hidden" onChange={e => { setSplitFile(e.target.files?.[0] || null); setResult(null); }} />
              <svg className="w-10 h-10 mb-3 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {splitFile ? <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">{splitFile.name} ({fmtSize(splitFile.size)})</p> : <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">Sélectionner un PDF</p>}
            </label>

            <div>
              <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1.5">Pages à extraire <span className="text-[#a3a3a3]">(vide = tout, ex: 1,3,5-8)</span></label>
              <input value={splitPages} onChange={e => setSplitPages(e.target.value)} placeholder="1,3,5-10 (vide = tout)"
                className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-mono bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': ACCENT }} />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-lg">{error}</p>}

            <button onClick={handleSplit} disabled={loading || !splitFile} style={{ backgroundColor: ACCENT }}
              className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
              {loading ? 'Traitement…' : 'Extraire les pages'}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <span className="text-emerald-600 font-bold">✓</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">PDF prêt</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">{result.pages} page{result.pages > 1 ? 's' : ''} · {fmtSize(result.bytes.length)}</p>
              </div>
            </div>
            <button onClick={() => download(result.bytes, result.name)} style={{ backgroundColor: ACCENT }}
              className="w-full py-2.5 text-white font-semibold rounded-lg text-sm hover:opacity-90">
              ↓ Télécharger {result.name}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
