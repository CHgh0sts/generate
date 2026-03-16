'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Copy } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#0f766e';

const UNITS = [
  { id: 'bit',  label: 'Bit',      sym: 'b',   factor: 1 },
  { id: 'byte', label: 'Octet',    sym: 'B',   factor: 8 },
  { id: 'kb',   label: 'Kilobyte', sym: 'KB',  factor: 8 * 1024 },
  { id: 'mb',   label: 'Mégabyte', sym: 'MB',  factor: 8 * 1024 ** 2 },
  { id: 'gb',   label: 'Gigabyte', sym: 'GB',  factor: 8 * 1024 ** 3 },
  { id: 'tb',   label: 'Térabyte', sym: 'TB',  factor: 8 * 1024 ** 4 },
  { id: 'kib',  label: 'Kibibyte', sym: 'KiB', factor: 8 * 1000 },
  { id: 'mib',  label: 'Mébioctet',sym: 'MiB', factor: 8 * 1000 ** 2 },
  { id: 'gib',  label: 'Gibioctet',sym: 'GiB', factor: 8 * 1000 ** 3 },
  { id: 'tib',  label: 'Tébioctet',sym: 'TiB', factor: 8 * 1000 ** 4 },
  { id: 'kbps', label: 'Kbps',     sym: 'Kbps',factor: 1000,       isSpeed: true },
  { id: 'mbps', label: 'Mbps',     sym: 'Mbps',factor: 1e6,        isSpeed: true },
  { id: 'gbps', label: 'Gbps',     sym: 'Gbps',factor: 1e9,        isSpeed: true },
  { id: 'kBps', label: 'KB/s',     sym: 'KB/s',factor: 8000,       isSpeed: true },
  { id: 'mBps', label: 'MB/s',     sym: 'MB/s',factor: 8e6,        isSpeed: true },
];

function fmt(n) {
  if (n === 0) return '0';
  if (!isFinite(n)) return '∞';
  if (n >= 1e15) return n.toExponential(4);
  return new Intl.NumberFormat('fr-FR', { maximumSignificantDigits: 8 }).format(n);
}

const DOWNLOAD_SIZES = [
  { label: 'Photo (5 Mo)', bytes: 5 * 1024 * 1024 * 8 },
  { label: 'Chanson MP3 (8 Mo)', bytes: 8 * 1024 * 1024 * 8 },
  { label: 'Film HD (4 Go)', bytes: 4 * 1024 ** 3 * 8 },
  { label: 'Jeu AAA (80 Go)', bytes: 80 * 1024 ** 3 * 8 },
];

export default function BytesPage() {
  const [value, setValue]   = useState('1');
  const [fromUnit, setFrom] = useState('mb');
  const [speed, setSpeed]   = useState('100');
  const [speedUnit, setSpeedUnit] = useState('mbps');
  const pushToast = useToast();

  const bits = useMemo(() => {
    const n = parseFloat(value.replace(',', '.'));
    const u = UNITS.find(x => x.id === fromUnit);
    return isFinite(n) && u ? n * u.factor : null;
  }, [value, fromUnit]);

  const results = useMemo(() => {
    if (bits === null) return [];
    return UNITS.filter(u => !u.isSpeed).map(u => ({ ...u, value: bits / u.factor }));
  }, [bits]);

  const downloadTimes = useMemo(() => {
    const sp = parseFloat(speed);
    const su = UNITS.find(x => x.id === speedUnit);
    if (!isFinite(sp) || !su || bits === null) return [];
    const bitsPerSec = sp * su.factor;
    return DOWNLOAD_SIZES.map(({ label, bytes }) => {
      const secs = bytes / bitsPerSec;
      if (secs < 60) return { label, time: `${secs.toFixed(1)} s` };
      if (secs < 3600) return { label, time: `${(secs/60).toFixed(1)} min` };
      return { label, time: `${(secs/3600).toFixed(2)} h` };
    });
  }, [speed, speedUnit, bits]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Calculateur bits / octets</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Conversions, débits réseau et temps de téléchargement</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {/* Input */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-3">Valeur à convertir</label>
          <div className="flex gap-3">
            <input type="text" value={value} onChange={e => setValue(e.target.value)}
              className="flex-1 px-4 py-3 text-2xl font-bold border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': ACCENT }} />
            <select value={fromUnit} onChange={e => setFrom(e.target.value)}
              className="px-4 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2 text-sm"
              style={{ '--tw-ring-color': ACCENT }}>
              {UNITS.filter(u => !u.isSpeed).map(u => (
                <option key={u.id} value={u.id}>{u.sym} — {u.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversions */}
        {results.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {results.map(r => (
              <button key={r.id} onClick={() => { navigator.clipboard.writeText(fmt(r.value) + ' ' + r.sym); pushToast?.('Copié !'); }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors hover:shadow-sm ${r.id === fromUnit ? 'border-current' : 'border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]'}`}
                style={r.id === fromUnit ? { borderColor: ACCENT, backgroundColor: ACCENT + '10' } : {}}>
                <div className="text-left">
                  <div className="text-xs text-[#737373] dark:text-[#a3a3a3]">{r.label}</div>
                  <div className="text-base font-bold font-mono text-[#171717] dark:text-[#ededed]">{fmt(r.value)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: ACCENT }}>{r.sym}</span>
                  <Copy className="w-3 h-3 text-[#a3a3a3]" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Download time calculator */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Calculateur de téléchargement</p>
          <div className="flex gap-3">
            <input type="text" value={speed} onChange={e => setSpeed(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': ACCENT }} placeholder="Débit" />
            <select value={speedUnit} onChange={e => setSpeedUnit(e.target.value)}
              className="px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none">
              {UNITS.filter(u => u.isSpeed).map(u => <option key={u.id} value={u.id}>{u.sym}</option>)}
            </select>
          </div>
          {downloadTimes.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-2">
              {downloadTimes.map(({ label, time }) => (
                <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
                  <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">{label}</span>
                  <span className="text-sm font-bold font-mono" style={{ color: ACCENT }}>{time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
