'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';

const ACCENT = '#6366f1';

const CATEGORIES = {
  longueur: {
    label: 'Longueur',
    units: {
      mm: { label: 'Millimètre (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      cm: { label: 'Centimètre (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      m: { label: 'Mètre (m)', toBase: (v) => v, fromBase: (v) => v },
      km: { label: 'Kilomètre (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      in: { label: 'Pouce (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      ft: { label: 'Pied (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      yd: { label: 'Yard (yd)', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      mi: { label: 'Mile (mi)', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      nmi: { label: 'Mille marin (nmi)', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
    },
  },
  masse: {
    label: 'Masse',
    units: {
      mg: { label: 'Milligramme (mg)', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      g: { label: 'Gramme (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      kg: { label: 'Kilogramme (kg)', toBase: (v) => v, fromBase: (v) => v },
      t: { label: 'Tonne (t)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      oz: { label: 'Once (oz)', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
      lb: { label: 'Livre (lb)', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      st: { label: 'Stone (st)', toBase: (v) => v * 6.35029, fromBase: (v) => v / 6.35029 },
    },
  },
  temperature: {
    label: 'Température',
    units: {
      C: { label: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
      F: { label: 'Fahrenheit (°F)', toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
      K: { label: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
      R: { label: 'Rankine (°R)', toBase: (v) => (v - 491.67) * (5 / 9), fromBase: (v) => (v + 273.15) * (9 / 5) },
    },
  },
  surface: {
    label: 'Surface',
    units: {
      mm2: { label: 'mm²', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      cm2: { label: 'cm²', toBase: (v) => v / 1e4, fromBase: (v) => v * 1e4 },
      m2: { label: 'm²', toBase: (v) => v, fromBase: (v) => v },
      km2: { label: 'km²', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      ha: { label: 'Hectare (ha)', toBase: (v) => v * 1e4, fromBase: (v) => v / 1e4 },
      ac: { label: 'Acre (ac)', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
      ft2: { label: 'Pied carré (ft²)', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      in2: { label: 'Pouce carré (in²)', toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
      mi2: { label: 'Mile carré (mi²)', toBase: (v) => v * 2.59e6, fromBase: (v) => v / 2.59e6 },
    },
  },
  volume: {
    label: 'Volume',
    units: {
      ml: { label: 'Millilitre (ml)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      cl: { label: 'Centilitre (cl)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      l: { label: 'Litre (L)', toBase: (v) => v, fromBase: (v) => v },
      m3: { label: 'Mètre cube (m³)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      cm3: { label: 'Centimètre cube (cm³)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      fl_oz: { label: 'Once fluide US (fl oz)', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
      cup: { label: 'Tasse US (cup)', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
      pt: { label: 'Pinte US (pt)', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
      gal: { label: 'Gallon US (gal)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    },
  },
  vitesse: {
    label: 'Vitesse',
    units: {
      ms: { label: 'm/s', toBase: (v) => v, fromBase: (v) => v },
      kmh: { label: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      mph: { label: 'Mile/h (mph)', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      kn: { label: 'Nœud (kn)', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
      mach: { label: 'Mach (~340 m/s)', toBase: (v) => v * 340, fromBase: (v) => v / 340 },
    },
  },
};

function formatResult(value) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e9) return value.toExponential(4);
  if (abs < 1e-6 && abs !== 0) return value.toExponential(4);
  if (abs >= 1000) return value.toLocaleString('fr-FR', { maximumFractionDigits: 4 });
  return value.toPrecision(7).replace(/\.?0+$/, '');
}

export default function UnitsPage() {
  const [category, setCategory] = useState('longueur');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');
  const [inputValue, setInputValue] = useState('1');

  const cat = CATEGORIES[category];
  const units = cat.units;

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const keys = Object.keys(CATEGORIES[newCat].units);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
    setInputValue('1');
  };

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const compute = () => {
    const num = parseFloat(inputValue);
    if (!Number.isFinite(num)) return null;
    const base = units[fromUnit]?.toBase(num);
    return units[toUnit]?.fromBase(base) ?? null;
  };

  const result = compute();

  const allResults = Object.entries(units)
    .filter(([key]) => key !== fromUnit)
    .map(([key, u]) => {
      const num = parseFloat(inputValue);
      if (!Number.isFinite(num)) return null;
      const base = units[fromUnit]?.toBase(num);
      const val = u.fromBase(base);
      return { key, label: u.label, value: val };
    })
    .filter(Boolean);

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
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Convertisseur d&apos;unités</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Longueur, masse, température, surface, volume, vitesse</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="max-w-3xl space-y-6">

          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key)}
                style={category === key ? { backgroundColor: ACCENT } : {}}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${category === key ? 'text-white' : 'border border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#404040] dark:hover:border-[#525252]'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-5">
            <div className="flex items-end gap-3">
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Valeur</label>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252]"
                  placeholder="0"
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">De</label>
                <select
                  value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252]"
                >
                  {Object.entries(units).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#e5e5e5] dark:bg-[#262626]" />
              <button
                onClick={handleSwap}
                className="shrink-0 p-1.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
                title="Inverser"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
              <div className="flex-1 h-px bg-[#e5e5e5] dark:bg-[#262626]" />
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Résultat</label>
                <div className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#f5f5f5] dark:bg-[#262626] text-[#171717] dark:text-[#ededed] text-lg font-semibold min-h-[46px] flex items-center">
                  {result !== null ? formatResult(result) : <span className="text-[#a3a3a3]">—</span>}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Vers</label>
                <select
                  value={toUnit} onChange={(e) => setToUnit(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252]"
                >
                  {Object.entries(units).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {inputValue && Number.isFinite(parseFloat(inputValue)) && (
            <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
                <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                  {inputValue} {units[fromUnit]?.label} =
                </p>
              </div>
              <ul className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
                {allResults.map(({ key, label, value }) => (
                  <li key={key} style={key === toUnit ? { borderLeft: `3px solid ${ACCENT}` } : {}} className={`flex items-center justify-between px-4 py-2.5 ${key === toUnit ? 'bg-[#fafafa] dark:bg-[#1a1a1a]' : ''}`}>
                    <span className="text-sm text-[#737373] dark:text-[#a3a3a3]">{label}</span>
                    <span className={`text-sm font-mono font-medium ${key === toUnit ? 'text-[#171717] dark:text-[#ededed]' : 'text-[#525252] dark:text-[#a3a3a3]'}`}>
                      {formatResult(value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
