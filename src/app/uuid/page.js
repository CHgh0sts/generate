'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, ArrowRight } from 'lucide-react';

const ACCENT = '#a855f7';

function uuidv4() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function uuidv1() {
  const now = Date.now();
  const hex = now.toString(16).padStart(12, '0');
  const hi = hex.slice(0, 8); const lo = hex.slice(8);
  const rand = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `${hi}-${lo}-1${rand().slice(1)}-${(8 | Math.random() * 4).toString(16)}${rand().slice(1)}-${rand()}${rand()}${rand()}`;
}

function nanoid(size = 21) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

function ulid() {
  const now = Date.now();
  const CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let t = now, ts = '';
  for (let i = 9; i >= 0; i--) { ts = CHARS[t % 32] + ts; t = Math.floor(t / 32); }
  let rand = '';
  for (let i = 0; i < 16; i++) rand += CHARS[Math.floor(Math.random() * 32)];
  return ts + rand;
}

export default function UuidPage() {
  const [uuids, setUuids]   = useState(() => Array.from({length: 5}, uuidv4));
  const [qty, setQty]       = useState(5);
  const [algo, setAlgo]     = useState('v4');
  const [copied, setCopied] = useState('');
  const [tsInput, setTsInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [tsUnit, setTsUnit]   = useState('s'); // s | ms
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 16));

  const generate = useCallback(() => {
    const fn = algo === 'v4' ? uuidv4 : algo === 'v1' ? uuidv1 : algo === 'ulid' ? ulid : nanoid;
    setUuids(Array.from({ length: Math.min(qty, 100) }, fn));
  }, [algo, qty]);

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(''), 1500); });
  };

  const copyAll = () => copy(uuids.join('\n'), 'all');

  // Timestamp conversions
  const tsMs = tsUnit === 's' ? Number(tsInput) * 1000 : Number(tsInput);
  const tsDate = isNaN(tsMs) ? null : new Date(tsMs);
  const dateToTs = new Date(dateInput);

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">UUID & Timestamp</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">UUID v1/v4, ULID, NanoID, Timestamp converter</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Generator */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Générateur d&apos;identifiants uniques</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1.5">
              {['v4','v1','ulid','nanoid'].map(a => (
                <button key={a} onClick={() => setAlgo(a)}
                  style={algo === a ? { backgroundColor: ACCENT } : {}}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-colors ${algo === a ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                  {a === 'v4' ? 'UUID v4' : a === 'v1' ? 'UUID v1' : a.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#737373] dark:text-[#a3a3a3]">Quantité</label>
              <input type="number" value={qty} onChange={e => setQty(Math.max(1, Math.min(100, Number(e.target.value))))} min={1} max={100}
                className="w-16 px-2 py-1.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] text-sm text-[#171717] dark:text-[#ededed] focus:outline-none text-center" />
            </div>
            <button onClick={generate} style={{ backgroundColor: ACCENT }} className="px-4 py-1.5 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
              Générer
            </button>
            <button onClick={copyAll} style={copied === 'all' ? { backgroundColor: '#10b981' } : {}} className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${copied === 'all' ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
              {copied === 'all' ? <><Check className="inline w-3 h-3 mr-0.5" />Copié</> : 'Tout copier'}
            </button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {uuids.map((id, i) => (
              <div key={i} className="flex items-center gap-3 group px-3 py-2 rounded-lg hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] border border-transparent hover:border-[#e5e5e5] dark:hover:border-[#262626]">
                <span className="text-[10px] text-[#a3a3a3] w-5 text-right shrink-0">{i+1}</span>
                <code className="flex-1 text-xs font-mono text-[#171717] dark:text-[#ededed] break-all">{id}</code>
                <button onClick={() => copy(id, `u${i}`)} style={copied === `u${i}` ? { color: '#10b981' } : { color: ACCENT }}
                  className="text-[10px] font-semibold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {copied === `u${i}` ? <Check className="w-3 h-3" /> : 'Copier'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp converter */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] flex items-center gap-1">Convertisseur Timestamp <ArrowRight className="w-3 h-3" /> Date</p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="flex items-center gap-1 text-xs text-[#737373] dark:text-[#a3a3a3] font-medium">Timestamp UNIX <ArrowRight className="w-3 h-3" /> Date humaine</label>
              <div className="flex gap-2">
                <input value={tsInput} onChange={e => setTsInput(e.target.value)} placeholder="ex: 1700000000"
                  className="flex-1 px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] font-mono focus:outline-none" />
                <select value={tsUnit} onChange={e => setTsUnit(e.target.value)} className="px-2 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] focus:outline-none">
                  <option value="s">s</option>
                  <option value="ms">ms</option>
                </select>
              </div>
              <button onClick={() => setTsInput(String(Math.floor(Date.now() / (tsUnit === 's' ? 1000 : 1))))}
                className="text-xs border border-[#e5e5e5] dark:border-[#262626] px-3 py-1 rounded-lg text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                Utiliser maintenant
              </button>
              {tsDate && !isNaN(tsDate) && (
                <div className="space-y-1.5 text-xs">
                  {[
                    ['Local',    tsDate.toLocaleString('fr-FR')],
                    ['ISO 8601', tsDate.toISOString()],
                    ['UTC',      tsDate.toUTCString()],
                    ['Relatif',  (() => { const d = Date.now() - tsDate; const s = Math.abs(Math.round(d/1000)); return s < 60 ? `il y a ${s}s` : s < 3600 ? `il y a ${Math.round(s/60)} min` : s < 86400 ? `il y a ${Math.round(s/3600)}h` : `il y a ${Math.round(s/86400)} jours`; })()],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="flex justify-between gap-2 bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg px-3 py-1.5 border border-[#e5e5e5] dark:border-[#262626]">
                      <span className="text-[#a3a3a3] shrink-0">{lbl}</span>
                      <span className="font-mono text-[#171717] dark:text-[#ededed] truncate">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-1 text-xs text-[#737373] dark:text-[#a3a3a3] font-medium">Date <ArrowRight className="w-3 h-3" /> Timestamp UNIX</label>
              <input type="datetime-local" value={dateInput} onChange={e => setDateInput(e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none" />
              {!isNaN(dateToTs) && (
                <div className="space-y-1.5 text-xs">
                  {[
                    ['Secondes (s)', String(Math.floor(dateToTs.getTime() / 1000))],
                    ['Millisecondes (ms)', String(dateToTs.getTime())],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="flex items-center justify-between gap-2 bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg px-3 py-1.5 border border-[#e5e5e5] dark:border-[#262626]">
                      <span className="text-[#a3a3a3] shrink-0">{lbl}</span>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-[#171717] dark:text-[#ededed]">{val}</code>
                        <button onClick={() => copy(val, `d${lbl}`)} style={{ color: copied === `d${lbl}` ? '#10b981' : ACCENT }} className="font-semibold text-[10px]">
                          {copied === `d${lbl}` ? <Check className="w-3 h-3" /> : 'Copier'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
