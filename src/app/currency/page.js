'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { RefreshCw, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { useToast } from '../Toast';
import { useShowFlags } from '../useShowFlags';

const ACCENT = '#16a34a';

const POPULAR = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY', 'MAD', 'DZD', 'TND'];
const FLAGS = { EUR:'🇪🇺', USD:'🇺🇸', GBP:'🇬🇧', CHF:'🇨🇭', JPY:'🇯🇵', CAD:'🇨🇦', AUD:'🇦🇺', CNY:'🇨🇳', MAD:'🇲🇦', DZD:'🇩🇿', TND:'🇹🇳', BRL:'🇧🇷', INR:'🇮🇳', KRW:'🇰🇷', MXN:'🇲🇽', SGD:'🇸🇬', HKD:'🇭🇰', NOK:'🇳🇴', SEK:'🇸🇪', DKK:'🇩🇰', PLN:'🇵🇱', CZK:'🇨🇿', HUF:'🇭🇺', RON:'🇷🇴', BGN:'🇧🇬', TRY:'🇹🇷', RUB:'🇷🇺', ZAR:'🇿🇦', AED:'🇦🇪', SAR:'🇸🇦', QAR:'🇶🇦', KWD:'🇰🇼', ILS:'🇮🇱', NZD:'🇳🇿', THB:'🇹🇭', IDR:'🇮🇩', MYR:'🇲🇾', PHP:'🇵🇭', VND:'🇻🇳', HRK:'🇭🇷' };
const NAMES = { EUR:'Euro', USD:'Dollar américain', GBP:'Livre sterling', CHF:'Franc suisse', JPY:'Yen japonais', CAD:'Dollar canadien', AUD:'Dollar australien', CNY:'Yuan chinois', MAD:'Dirham marocain', DZD:'Dinar algérien', TND:'Dinar tunisien', BRL:'Real brésilien', INR:'Roupie indienne', KRW:'Won coréen', MXN:'Peso mexicain', SGD:'Dollar singapourien', HKD:'Dollar de Hong Kong', NOK:'Couronne norvégienne', SEK:'Couronne suédoise', DKK:'Couronne danoise', PLN:'Zloty polonais', TRY:'Livre turque', ZAR:'Rand sud-africain', AED:'Dirham émirati', SAR:'Riyal saoudien', NZD:'Dollar néo-zélandais', THB:'Baht thaïlandais', IDR:'Roupie indonésienne', MYR:'Ringgit malaisien' };

function fmt(n, decimals = 4) {
  if (!isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: decimals }).format(n);
}

export default function CurrencyPage() {
  const [rates, setRates]     = useState(null);
  const [base, setBase]       = useState('EUR');
  const [target, setTarget]   = useState('USD');
  const [amount, setAmount]   = useState('1');
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState('');
  const [currencies, setCurrencies] = useState([]);
  const pushToast = useToast();
  const showFlags = useShowFlags();

  const fetchRates = useCallback(async (from = base) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${from}`);
      const data = await res.json();
      setRates(data.rates);
      setUpdated(data.date);
      setCurrencies(Object.keys(data.rates).sort());
    } catch {
      pushToast?.('Impossible de charger les taux', 'error');
    } finally { setLoading(false); }
  }, [base]);

  useEffect(() => { fetchRates(base); }, [base]);

  const converted = useMemo(() => {
    if (!rates || !amount) return null;
    const n = parseFloat(amount.replace(',', '.'));
    if (!isFinite(n)) return null;
    if (target === base) return n;
    return n * (rates[target] ?? 1);
  }, [rates, amount, base, target]);

  const swap = () => {
    setBase(target);
    setTarget(base);
  };

  const allCurrencies = useMemo(() => {
    const set = new Set([...POPULAR, ...currencies]);
    return [...set].sort();
  }, [currencies]);

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Convertisseur de devises</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Taux en temps réel · Banque Centrale Européenne</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {/* Converter */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Conversion</span>
            <div className="flex items-center gap-2">
              {updated && <span className="text-[10px] text-[#a3a3a3]">Mis à jour : {updated}</span>}
              <button onClick={() => fetchRates(base)} disabled={loading}
                className="text-[#a3a3a3] hover:text-[#525252] disabled:opacity-40">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Amount + From */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wider">Montant</label>
              <input type="text" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 text-2xl font-bold border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': ACCENT }} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wider">De</label>
              <select value={base} onChange={e => setBase(e.target.value)}
                className="w-full px-4 py-3 text-base border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': ACCENT }}>
                {allCurrencies.map(c => (
                  <option key={c} value={c}>{showFlags && FLAGS[c] ? FLAGS[c] + ' ' : ''}{c} — {NAMES[c] || c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button onClick={swap}
              style={{ backgroundColor: ACCENT }}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl hover:opacity-90">
              <ArrowLeftRight className="w-4 h-4" /> Inverser
            </button>
          </div>

          {/* Result + To */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wider">Résultat</label>
              <div className="w-full px-4 py-3 text-2xl font-bold border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a]" style={{ color: ACCENT }}>
                {loading ? '…' : converted !== null ? fmt(converted, 2) : '—'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-[#a3a3a3] uppercase tracking-wider">Vers</label>
              <select value={target} onChange={e => setTarget(e.target.value)}
                className="w-full px-4 py-3 text-base border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': ACCENT }}>
                {allCurrencies.map(c => (
                  <option key={c} value={c}>{showFlags && FLAGS[c] ? FLAGS[c] + ' ' : ''}{c} — {NAMES[c] || c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rate info */}
          {rates && target !== base && rates[target] && (
            <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-[#737373] dark:text-[#a3a3a3]">
                1 {base} = <strong style={{ color: ACCENT }}>{fmt(rates[target])}</strong> {target}
              </span>
              <span className="text-[#737373] dark:text-[#a3a3a3] text-xs">
                1 {target} = <strong className="text-[#171717] dark:text-[#ededed]">{fmt(1 / rates[target])}</strong> {base}
              </span>
            </div>
          )}
        </div>

        {/* Popular currencies grid */}
        {rates && (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">
                1 {base} en devises populaires
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {POPULAR.filter(c => c !== base && rates[c]).map(c => (
                <button key={c} onClick={() => setTarget(c)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors text-left ${target === c ? 'border-current' : 'border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]'}`}
                  style={target === c ? { borderColor: ACCENT, backgroundColor: ACCENT + '10' } : {}}>
                  <div>
                    <div className="text-xs text-[#737373] dark:text-[#a3a3a3] flex items-center gap-1">
                      {showFlags && FLAGS[c] ? FLAGS[c] + ' ' : ''}{c}
                    </div>
                    <div className="text-sm font-bold text-[#171717] dark:text-[#ededed] mt-0.5">
                      {fmt(rates[c], 4)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-center text-[#a3a3a3]">
          Taux fournis par <a href="https://www.frankfurter.app" target="_blank" rel="noopener noreferrer" className="underline">Frankfurter API</a> (Banque Centrale Européenne) · Mis à jour chaque jour ouvré
        </p>
      </main>
    </div>
  );
}
