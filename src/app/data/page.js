'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import Papa from 'papaparse';
import yaml from 'js-yaml';
import { Check, Download, Zap, LayoutGrid } from 'lucide-react';

const ACCENT = '#b45309';

const FORMATS = [
  { id: 'auto', label: 'Détection auto' },
  { id: 'json', label: 'JSON' },
  { id: 'csv',  label: 'CSV' },
  { id: 'yaml', label: 'YAML' },
  { id: 'xml',  label: 'XML' },
];

const TARGET_FORMATS = [
  { id: 'json',     label: 'JSON' },
  { id: 'csv',      label: 'CSV' },
  { id: 'yaml',     label: 'YAML' },
  { id: 'xml',      label: 'XML' },
  { id: 'validate', label: 'Valider' },
];

const PLACEHOLDERS = {
  json: '[{"nom":"Alice","age":30},{"nom":"Bob","age":25}]',
  csv:  'nom,age,ville\nAlice,30,Paris\nBob,25,Lyon',
  yaml: 'name: Alice\nroles:\n  - admin\n  - user\nactive: true',
  xml:  '<users>\n  <user>\n    <nom>Alice</nom>\n    <age>30</age>\n  </user>\n</users>',
  auto: 'Collez votre JSON, CSV, YAML ou XML…',
};

function detectFormat(text) {
  const t = text.trim();
  if (!t) return null;
  try { JSON.parse(t); return 'json'; } catch {}
  if (t.startsWith('<') && !t.startsWith('<<')) {
    const d = new DOMParser().parseFromString(t, 'text/xml');
    if (!d.querySelector('parsererror')) return 'xml';
  }
  if (t.includes(':') && !t.includes('{')) {
    try { const r = yaml.load(t); if (r && typeof r === 'object') return 'yaml'; } catch {}
  }
  if (t.includes(',') || t.includes(';') || t.includes('\t')) return 'csv';
  try { const r = yaml.load(t); if (r && typeof r === 'object') return 'yaml'; } catch {}
  return null;
}

function jsonToXml(data, tag = 'root') {
  if (Array.isArray(data)) {
    return data.map((item, i) => `  <item index="${i}">\n${jsonToXml(item, null)
      .split('\n').map(l => '  ' + l).join('\n')}\n  </item>`).join('\n');
  }
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data)
      .map(([k, v]) => `  <${k}>${typeof v === 'object' ? '\n' + jsonToXml(v, null).split('\n').map(l=>'  '+l).join('\n') + '\n  ' : v}</${k}>`)
      .join('\n');
  }
  return String(data);
}

function xmlToJson(xmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('XML invalide');
  function nodeToObj(node) {
    if (node.nodeType === 3) return node.nodeValue.trim();
    const obj = {};
    for (const child of node.childNodes) {
      if (child.nodeType !== 1) continue;
      const val = child.childNodes.length === 1 && child.childNodes[0].nodeType === 3
        ? child.childNodes[0].nodeValue : nodeToObj(child);
      if (obj[child.tagName] !== undefined) {
        if (!Array.isArray(obj[child.tagName])) obj[child.tagName] = [obj[child.tagName]];
        obj[child.tagName].push(val);
      } else { obj[child.tagName] = val; }
    }
    return obj;
  }
  return nodeToObj(doc.documentElement);
}

const DATA_FROM_JSON_KEY = 'data_from_json';

export default function DataPage() {
  const [input, setInput]       = useState('');
  const [from, setFrom]         = useState('auto');
  const [to, setTo]             = useState('json');

  useEffect(() => {
    try {
      const fromJson = sessionStorage.getItem(DATA_FROM_JSON_KEY);
      if (fromJson) {
        setInput(fromJson);
        setFrom('json');
        sessionStorage.removeItem(DATA_FROM_JSON_KEY);
      }
    } catch {}
  }, []);
  const [copied, setCopied]     = useState(false);
  const [delimiter, setDelimiter] = useState(',');
  const [header, setHeader]     = useState(true);

  const copy = (t) => navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  const download = (content, ext) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = `output.${ext}`; a.click();
  };

  const { output, error, detectedFormat } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null, detectedFormat: null };

    const detected = from === 'auto' ? detectFormat(input.trim()) : from;
    if (!detected) return { output: '', error: 'Format non reconnu. Essayez de sélectionner le format manuellement.', detectedFormat: null };

    try {
      // Validate only
      if (to === 'validate') {
        const names = { json: 'JSON', csv: 'CSV', yaml: 'YAML', xml: 'XML' };
        return { output: `${names[detected] || detected} valide`, error: null, detectedFormat: detected };
      }

      // Same format → pretty-print / reformat
      if (detected === to) {
        if (detected === 'json') {
          return { output: JSON.stringify(JSON.parse(input), null, 2), error: null, detectedFormat: detected };
        }
        return { output: input.trim(), error: null, detectedFormat: detected };
      }

      // Conversions
      let intermediate;

      // Step 1: parse source → JS object
      if (detected === 'json') {
        intermediate = JSON.parse(input);
      } else if (detected === 'csv') {
        const r = Papa.parse(input.trim(), { header, delimiter: delimiter || ',', skipEmptyLines: true });
        if (r.errors.length) throw new Error(r.errors[0].message);
        intermediate = r.data;
      } else if (detected === 'yaml') {
        intermediate = yaml.load(input);
      } else if (detected === 'xml') {
        intermediate = xmlToJson(input);
      }

      // Step 2: serialize to target
      if (to === 'json') return { output: JSON.stringify(intermediate, null, 2), error: null, detectedFormat: detected };
      if (to === 'yaml') return { output: yaml.dump(intermediate, { indent: 2 }), error: null, detectedFormat: detected };
      if (to === 'csv') {
        const arr = Array.isArray(intermediate) ? intermediate : [intermediate];
        return { output: Papa.unparse(arr, { delimiter: delimiter || ',' }), error: null, detectedFormat: detected };
      }
      if (to === 'xml') {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${jsonToXml(intermediate)}\n</root>`;
        return { output: xml, error: null, detectedFormat: detected };
      }

      return { output: '', error: 'Conversion non supportée', detectedFormat: detected };
    } catch (e) {
      return { output: '', error: e.message, detectedFormat: null };
    }
  }, [input, from, to, delimiter, header]);

  const isValid = to === 'validate' && !!output && !error;
  const outExt = to === 'validate' ? 'txt' : to;
  const showCsvOptions = detectedFormat === 'csv' || from === 'csv' || to === 'csv';
  const placeholder = PLACEHOLDERS[from] || PLACEHOLDERS.auto;

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
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">JSON · CSV · YAML · XML — conversion et validation</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">

        {/* Format selector bar */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Source */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#a3a3a3] mb-1.5">Format source</label>
              <div className="relative">
                <select value={from} onChange={e => setFrom(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 pr-8 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-medium bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2 cursor-pointer"
                  style={{ '--tw-ring-color': ACCENT }}>
                  {FORMATS.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center pt-4 shrink-0">
              <svg className="w-5 h-5" style={{ color: ACCENT }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Target */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#a3a3a3] mb-1.5">Format cible</label>
              <div className="relative">
                <select value={to} onChange={e => setTo(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 pr-8 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-medium bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2 cursor-pointer"
                  style={{ '--tw-ring-color': ACCENT }}>
                  {TARGET_FORMATS.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            {/* CSV Options */}
            {showCsvOptions && (
              <div className="flex items-center gap-3 pt-4 border-l border-[#e5e5e5] dark:border-[#262626] pl-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">Délimiteur</label>
                  <select value={delimiter} onChange={e => setDelimiter(e.target.value)}
                    className="px-2 py-1.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-xs bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none">
                    <option value=",">,</option>
                    <option value=";">;</option>
                    <option value="\t">⇥ tab</option>
                    <option value="|">|</option>
                  </select>
                </div>
                {(from === 'csv' || detectedFormat === 'csv') && (
                  <label className="flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#a3a3a3] cursor-pointer">
                    <input type="checkbox" checked={header} onChange={e => setHeader(e.target.checked)} style={{ accentColor: ACCENT }} />
                    En-têtes
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Auto-detect badge */}
          {from === 'auto' && detectedFormat && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[10px] text-[#a3a3a3]">Détecté :</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: ACCENT }}>
                {FORMATS.find(f => f.id === detectedFormat)?.label || detectedFormat.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Entrée</label>
              <button onClick={() => setInput(PLACEHOLDERS[from === 'auto' ? 'json' : from] || '')}
                className="text-xs text-[#737373] hover:text-[#525252] dark:hover:text-[#d4d4d4] border border-[#e5e5e5] dark:border-[#262626] px-2 py-0.5 rounded-md transition-colors">
                Exemple
              </button>
            </div>
            <textarea rows={18} value={input} onChange={e => setInput(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-sm font-mono bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': ACCENT }} />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Résultat</label>
              <div className="flex gap-2">
                {output && !isValid && (
                  <button onClick={() => download(output, outExt)}
                    className="text-xs text-[#737373] hover:text-[#525252] dark:hover:text-[#d4d4d4] border border-[#e5e5e5] dark:border-[#262626] px-2 py-0.5 rounded-md transition-colors">
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" /> .{outExt}</span>
                  </button>
                )}
                <button onClick={() => output && copy(output)} disabled={!output}
                  style={copied ? { backgroundColor: '#10b981' } : { backgroundColor: ACCENT }}
                  className="text-xs text-white font-semibold px-2.5 py-0.5 rounded-md disabled:opacity-30 transition-colors">
                  {copied ? <><Check className="inline w-3 h-3 mr-0.5" />Copié</> : 'Copier'}
                </button>
              </div>
            </div>

            {error ? (
              <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-mono min-h-[18rem] flex items-start">
                <div>
                  <p className="font-semibold mb-1">Erreur</p>
                  <p>{error}</p>
                </div>
              </div>
            ) : isValid ? (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold min-h-[18rem] flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                {output}
              </div>
            ) : (
              <textarea rows={18} readOnly value={output}
                placeholder="Le résultat apparaîtra ici…"
                className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-sm font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none placeholder:text-[#a3a3a3]" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
