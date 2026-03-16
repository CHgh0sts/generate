'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check } from 'lucide-react';

const ACCENT = '#475569';

const PRESETS = [
  { label: 'Chaque minute',       cron: '* * * * *' },
  { label: 'Toutes les 5 min',    cron: '*/5 * * * *' },
  { label: 'Toutes les heures',   cron: '0 * * * *' },
  { label: 'Chaque jour à minuit',cron: '0 0 * * *' },
  { label: 'Chaque lundi 9h',     cron: '0 9 * * 1' },
  { label: 'Chaque 1er du mois',  cron: '0 0 1 * *' },
  { label: 'Chaque dimanche midi',cron: '0 12 * * 0' },
  { label: 'Jours ouvrés 8h',     cron: '0 8 * * 1-5' },
  { label: 'Deux fois/jour',      cron: '0 8,20 * * *' },
  { label: 'Chaque trimestre',    cron: '0 0 1 */3 *' },
];

const DAYS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function parseField(val, min, max) {
  if (val === '*') return { type: 'any' };
  if (val.startsWith('*/')) return { type: 'every', step: parseInt(val.slice(2)) };
  if (val.includes('-')) { const [a,b] = val.split('-'); return { type: 'range', from: parseInt(a), to: parseInt(b) }; }
  if (val.includes(',')) return { type: 'list', values: val.split(',').map(Number) };
  return { type: 'exact', value: parseInt(val) };
}

function describeCron(cron) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return 'Expression incomplète';
  const [min, hr, dom, mon, dow] = parts;

  const descMin = () => {
    const f = parseField(min, 0, 59);
    if (f.type === 'any') return 'chaque minute';
    if (f.type === 'every') return `toutes les ${f.step} minutes`;
    if (f.type === 'list') return `aux minutes ${f.values.join(', ')}`;
    if (f.type === 'exact') return `à la minute ${f.value}`;
    return `minutes ${min}`;
  };

  const descHr = () => {
    const f = parseField(hr, 0, 23);
    if (f.type === 'any') return '';
    if (f.type === 'every') return ` toutes les ${f.step}h`;
    if (f.type === 'list') return ` à ${f.values.map(h=>`${h}h`).join(', ')}`;
    if (f.type === 'exact') return ` à ${f.value}h${min !== '0' && min !== '*' ? min.padStart(2,'0') : '00'}`;
    return ` heures ${hr}`;
  };

  const descDow = () => {
    const f = parseField(dow, 0, 6);
    if (f.type === 'any') return '';
    if (f.type === 'exact') return ` chaque ${DAYS[f.value]}`;
    if (f.type === 'range') return ` du ${DAYS[f.from]} au ${DAYS[f.to]}`;
    if (f.type === 'list') return ` les ${f.values.map(d=>DAYS[d]).join(', ')}`;
    return '';
  };

  const descDom = () => {
    const f = parseField(dom, 1, 31);
    if (f.type === 'any') return '';
    if (f.type === 'exact') return ` le ${f.value} du mois`;
    if (f.type === 'every') return ` tous les ${f.step} jours`;
    return '';
  };

  const descMon = () => {
    const f = parseField(mon, 1, 12);
    if (f.type === 'any') return '';
    if (f.type === 'exact') return ` en ${MONTHS[f.value-1]}`;
    if (f.type === 'every') return ` tous les ${f.step} mois`;
    if (f.type === 'list') return ` en ${f.values.map(m=>MONTHS[m-1]).join(', ')}`;
    return '';
  };

  return `${descMin()}${descHr()}${descDow()}${descDom()}${descMon()}`.trim() || 'Planification personnalisée';
}

function nextRuns(cron, count = 5) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return [];
  const [minF, hrF, domF, monF, dowF] = parts;

  const matches = (val, field) => {
    if (field === '*') return true;
    if (field.startsWith('*/')) return val % parseInt(field.slice(2)) === 0;
    if (field.includes(',')) return field.split(',').map(Number).includes(val);
    if (field.includes('-')) { const [a,b] = field.split('-'); return val >= parseInt(a) && val <= parseInt(b); }
    return val === parseInt(field);
  };

  const runs = [];
  const d = new Date(); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
  let iterations = 0;
  while (runs.length < count && iterations < 500000) {
    iterations++;
    if (matches(d.getMonth()+1, monF) && matches(d.getDate(), domF) && matches(d.getDay(), dowF) && matches(d.getHours(), hrF) && matches(d.getMinutes(), minF)) {
      runs.push(new Date(d));
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return runs;
}

export default function CronPage() {
  const [cron, setCron]     = useState('0 9 * * 1-5');
  const [copied, setCopied] = useState(false);

  const copy = () => navigator.clipboard.writeText(cron).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });

  const description = useMemo(() => {
    try { return describeCron(cron); } catch { return '—'; }
  }, [cron]);

  const runs = useMemo(() => {
    try { return nextRuns(cron); } catch { return []; }
  }, [cron]);

  const parts = cron.trim().split(/\s+/);

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Générateur Cron</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Créez et décodez des expressions cron</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {/* Main input */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-4">
          <div className="flex gap-3 items-center">
            <input value={cron} onChange={e => setCron(e.target.value)}
              className="flex-1 px-4 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-lg font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': ACCENT }} />
            <button onClick={copy} style={copied?{backgroundColor:'#10b981'}:{backgroundColor:ACCENT}} className="flex items-center gap-1.5 px-4 py-3 text-white font-semibold rounded-xl text-sm shrink-0">
              {copied ? <><Check className="w-4 h-4" /> Copié</> : 'Copier'}
            </button>
          </div>
          {/* Fields legend */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {[['Minute','0-59'],['Heure','0-23'],['Jour du mois','1-31'],['Mois','1-12'],['Jour semaine','0-6 (dim-sam)']].map(([label, range], i) => (
              <div key={label} className={`rounded-lg p-2 border transition-colors ${parts[i] && parts[i] !== '*' ? 'border-current' : 'border-[#e5e5e5] dark:border-[#262626]'}`}
                style={parts[i] && parts[i] !== '*' ? { borderColor: ACCENT, backgroundColor: ACCENT + '10' } : {}}>
                <code className="text-sm font-mono font-bold text-[#171717] dark:text-[#ededed]">{parts[i] || '*'}</code>
                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">{label}</p>
                <p className="text-[9px] text-[#a3a3a3]">{range}</p>
              </div>
            ))}
          </div>
          {/* Description */}
          <div className="rounded-xl border-2 px-4 py-3" style={{ borderColor: ACCENT + '40', backgroundColor: ACCENT + '08' }}>
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Interprétation</p>
            <p className="text-sm font-semibold text-[#171717] dark:text-[#ededed] capitalize">{description}</p>
          </div>
        </div>

        {/* Next runs */}
        {runs.length > 0 && (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Prochaines exécutions</p>
            <div className="space-y-2">
              {runs.map((d, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] text-sm">
                  <span className="font-mono text-[#171717] dark:text-[#ededed]">
                    {d.toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long'})} à {d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                  </span>
                  <span className="text-xs text-[#a3a3a3]">{Math.round((d - Date.now()) / 60000)} min</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Presets */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Expressions courantes</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {PRESETS.map(({ label, cron: c }) => (
              <button key={c} onClick={() => setCron(c)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${cron === c ? 'border-current' : 'border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]'}`}
                style={cron === c ? { borderColor: ACCENT, backgroundColor: ACCENT + '10' } : {}}>
                <span className="text-sm text-[#171717] dark:text-[#ededed]">{label}</span>
                <code className="text-xs font-mono text-[#737373] dark:text-[#a3a3a3]">{c}</code>
              </button>
            ))}
          </div>
        </div>

        {/* Helpers */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Syntaxe spéciale</p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
            {[['*', 'Toute valeur'],['*/n','Tous les n'],['a-b','Plage de a à b'],['a,b,c','Liste de valeurs'],['a-b/n','Plage avec pas de n']].map(([s,d]) => (
              <div key={s} className="flex items-center gap-3">
                <code className="font-mono font-bold w-12 shrink-0" style={{ color: ACCENT }}>{s}</code>
                <span className="text-[#737373] dark:text-[#a3a3a3]">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
