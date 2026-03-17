'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Search, Shield, ShieldAlert, ShieldCheck, ShieldX, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#16a34a';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-[#f5f5f5] dark:border-[#1a1a1a] last:border-0">
      <span className="text-xs text-[#a3a3a3] w-32 shrink-0">{label}</span>
      <span className="text-xs font-mono text-[#171717] dark:text-[#ededed] break-all">{value}</span>
    </div>
  );
}

function DaysBar({ days }) {
  const max = 365;
  const pct = Math.max(0, Math.min(100, (days / max) * 100));
  const color = days < 0 ? '#ef4444' : days < 30 ? '#f59e0b' : '#16a34a';
  return (
    <div className="mt-1">
      <div className="h-2 bg-[#e5e5e5] dark:bg-[#262626] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function SslPage() {
  const [host, setHost]     = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const pushToast = useToast();

  async function check() {
    if (!host.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`/api/ssl?host=${encodeURIComponent(host.trim())}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const StatusIcon = result
    ? result.expired ? ShieldX
    : result.expireSoon ? ShieldAlert
    : result.authorized ? ShieldCheck
    : ShieldAlert
    : Shield;

  const statusColor = result
    ? result.expired ? '#ef4444'
    : result.expireSoon ? '#f59e0b'
    : result.authorized ? ACCENT
    : '#f59e0b'
    : '#a3a3a3';

  const statusLabel = result
    ? result.expired ? 'Certificat expiré'
    : result.expireSoon ? `Expire dans ${result.daysLeft} jours`
    : result.authorized ? 'Certificat valide'
    : 'Avertissement : ' + (result.authError || 'Non vérifié')
    : '';

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Vérificateur SSL</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Validité, expiration, empreinte d&apos;un certificat</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {/* Input */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-3">Domaine ou URL</label>
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] px-3">
              <Search className="w-4 h-4 text-[#a3a3a3] shrink-0" />
              <input type="text" value={host} onChange={e => setHost(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && check()}
                placeholder="example.com ou https://example.com"
                className="flex-1 py-2.5 bg-transparent text-sm text-[#171717] dark:text-[#ededed] focus:outline-none placeholder:text-[#a3a3a3]" />
            </div>
            <button onClick={check} disabled={!host.trim() || loading}
              style={{ backgroundColor: ACCENT }}
              className="px-5 py-2.5 text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-40 flex items-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Vérifier
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>

        {result && (
          <div className="space-y-4">
            {/* Status card */}
            <div className="rounded-xl border p-5 flex items-center gap-4 relative"
              style={{ borderColor: statusColor + '40', backgroundColor: statusColor + '0d' }}>
              <StatusIcon className="w-10 h-10 shrink-0" style={{ color: statusColor }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: statusColor }}>{statusLabel}</p>
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">{result.hostname}</p>
                {result.daysLeft >= 0 && (
                  <DaysBar days={result.daysLeft} />
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-bold tabular-nums" style={{ color: statusColor }}>
                  {result.daysLeft < 0 ? 'Exp.' : result.daysLeft}
                </div>
                {result.daysLeft >= 0 && <div className="text-[10px] text-[#a3a3a3]">jours restants</div>}
              </div>
              <div className="shrink-0 flex items-center gap-1">
                <Link href={`/audit?url=${encodeURIComponent('https://' + result.hostname)}`}
                  className="flex items-center gap-1 text-[10px] text-[#737373] hover:text-[#171717] dark:hover:text-[#ededed] border border-[#e5e5e5] dark:border-[#262626] rounded-lg px-2 py-1">
                  <ExternalLink className="w-3 h-3" /> Perf
                </Link>
                <Link href={`/security-audit?url=${encodeURIComponent('https://' + result.hostname)}`}
                  className="flex items-center gap-1 text-[10px] text-[#737373] hover:text-[#171717] dark:hover:text-[#ededed] border border-[#e5e5e5] dark:border-[#262626] rounded-lg px-2 py-1">
                  <ExternalLink className="w-3 h-3" /> Sécurité
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Subject */}
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
                <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] mb-2">Sujet</p>
                <Row label="Nom commun (CN)" value={result.subject?.CN} />
                <Row label="Organisation" value={result.subject?.O} />
                <Row label="Pays" value={result.subject?.C} />
                {result.san.length > 0 && (
                  <div className="py-2">
                    <span className="text-xs text-[#a3a3a3] block mb-1">SAN ({result.san.length})</span>
                    <div className="flex flex-wrap gap-1">
                      {result.san.slice(0, 10).map(s => (
                        <span key={s} className="text-[10px] font-mono bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                      {result.san.length > 10 && <span className="text-[10px] text-[#a3a3a3]">+{result.san.length - 10}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Issuer + dates */}
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
                <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] mb-2">Émetteur</p>
                <Row label="Autorité (CN)" value={result.issuer?.CN} />
                <Row label="Organisation" value={result.issuer?.O} />
                <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] mt-3 mb-2">Validité</p>
                <Row label="Valide depuis" value={new Date(result.validFrom).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })} />
                <Row label="Expire le" value={new Date(result.validTo).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })} />
                <Row label="Protocole" value={result.protocol} />
                <Row label="Cipher" value={result.cipher} />
              </div>

              {/* Technical */}
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 sm:col-span-2">
                <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] mb-2">Informations techniques</p>
                <Row label="N° de série" value={result.serialNumber} />
                <Row label="Empreinte SHA-1" value={result.fingerprint} />
                <Row label="Empreinte SHA-256" value={result.fingerprint256} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
