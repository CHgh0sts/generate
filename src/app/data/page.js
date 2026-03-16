'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import Papa from 'papaparse';
import yaml from 'js-yaml';

const ACCENT = '#b45309';

const TABS = [
  { id: 'csv2json', label: 'CSV → JSON' },
  { id: 'json2csv', label: 'JSON → CSV' },
  { id: 'json2yaml',label: 'JSON → YAML' },
  { id: 'yaml2json',label: 'YAML → JSON' },
  { id: 'validate', label: 'Valider' },
];

export default function DataPage() {
  const [tab, setTab]       = useState('csv2json');
  const [input, setInput]   = useState('');
  const [copied, setCopied] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [header, setHeader] = useState(true);

  const copy = (t, id='out') => navigator.clipboard.writeText(t).then(() => { setCopied(id); setTimeout(() => setCopied(''), 1500); });

  const download = (content, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = name; a.click();
  };

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null };
    try {
      if (tab === 'csv2json') {
        const r = Papa.parse(input.trim(), { header, delimiter: delimiter || ',', skipEmptyLines: true });
        if (r.errors.length) throw new Error(r.errors[0].message);
        return { output: JSON.stringify(r.data, null, 2), error: null };
      }
      if (tab === 'json2csv') {
        const data = JSON.parse(input);
        const arr = Array.isArray(data) ? data : [data];
        const csv = Papa.unparse(arr, { delimiter: delimiter || ',' });
        return { output: csv, error: null };
      }
      if (tab === 'json2yaml') {
        const data = JSON.parse(input);
        return { output: yaml.dump(data, { indent: 2 }), error: null };
      }
      if (tab === 'yaml2json') {
        const data = yaml.load(input);
        return { output: JSON.stringify(data, null, 2), error: null };
      }
      if (tab === 'validate') {
        // Try JSON first
        try { JSON.parse(input); return { output: '✓ JSON valide', error: null }; } catch {}
        // Try YAML
        try { yaml.load(input); return { output: '✓ YAML valide', error: null }; } catch {}
        // Try XML
        try {
          const p = new DOMParser();
          const d = p.parseFromString(input, 'text/xml');
          if (d.querySelector('parsererror')) throw new Error('XML invalide');
          return { output: '✓ XML valide', error: null };
        } catch {}
        return { output: '', error: 'Format non reconnu ou invalide (JSON, YAML, XML)' };
      }
      return { output: '', error: null };
    } catch (e) { return { output: '', error: e.message }; }
  }, [input, tab, delimiter, header]);

  const ext = tab === 'csv2json' || tab === 'yaml2json' ? 'json' : tab === 'json2csv' ? 'csv' : 'yaml';
  const placeholder = {
    csv2json:  'nom,age,ville\nAlice,30,Paris\nBob,25,Lyon',
    json2csv:  '[{"nom":"Alice","age":30},{"nom":"Bob","age":25}]',
    json2yaml: '{"name":"Alice","roles":["admin","user"],"active":true}',
    yaml2json: 'name: Alice\nroles:\n  - admin\n  - user\nactive: true',
    validate:  'Collez du JSON, YAML ou XML…',
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Retour" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Convertisseur de données</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">CSV, JSON, YAML — conversion et validation</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        <div className="flex gap-1 flex-wrap border-b border-[#e5e5e5] dark:border-[#262626]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setInput(''); }}
              style={tab===t.id?{borderColor:ACCENT,color:ACCENT}:{}}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===t.id?'':'border-transparent text-[#737373] dark:text-[#a3a3a3]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Options */}
        {(tab === 'csv2json' || tab === 'json2csv') && (
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#737373] dark:text-[#a3a3a3]">Délimiteur</label>
              <select value={delimiter} onChange={e => setDelimiter(e.target.value)} className="px-2 py-1 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed]">
                <option value=",">, (virgule)</option>
                <option value=";">; (point-virgule)</option>
                <option value="\t">⇥ (tabulation)</option>
                <option value="|">| (pipe)</option>
              </select>
            </div>
            {tab === 'csv2json' && (
              <label className="flex items-center gap-2 text-xs text-[#737373] dark:text-[#a3a3a3] cursor-pointer">
                <input type="checkbox" checked={header} onChange={e => setHeader(e.target.checked)} className="rounded" style={{ accentColor: ACCENT }} />
                Première ligne = en-têtes
              </label>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Entrée</label>
              <button onClick={() => setInput(placeholder[tab] || '')} className="text-xs text-[#737373] hover:text-[#525252] border border-[#e5e5e5] dark:border-[#262626] px-2 py-0.5 rounded">Exemple</button>
            </div>
            <textarea rows={16} value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder[tab]}
              className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-sm font-mono bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': ACCENT }} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Résultat</label>
              <div className="flex gap-2">
                {output && <button onClick={() => output && download(output, `output.${ext}`)} className="text-xs text-[#737373] hover:text-[#525252] border border-[#e5e5e5] dark:border-[#262626] px-2 py-0.5 rounded">↓ .{ext}</button>}
                <button onClick={() => output && copy(output)} style={copied==='out'?{backgroundColor:'#10b981'}:{backgroundColor:ACCENT}} className="text-xs text-white font-semibold px-2 py-0.5 rounded-md disabled:opacity-30" disabled={!output}>{copied==='out'?'✓':'Copier'}</button>
              </div>
            </div>
            {error ? (
              <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-mono">{error}</div>
            ) : (
              <textarea rows={16} readOnly value={output}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm font-mono resize-none focus:outline-none ${output && !output.startsWith('✓') ? 'bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] border-[#e5e5e5] dark:border-[#262626]' : output.startsWith('✓') ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' : 'bg-[#fafafa] dark:bg-[#0a0a0a] text-[#a3a3a3] border-[#e5e5e5] dark:border-[#262626]'}`} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
