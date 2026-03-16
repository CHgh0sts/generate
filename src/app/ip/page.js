'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Search, Globe, Server, MapPin, Clock, Wifi, RefreshCw, Copy, Check } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#0ea5e9';

async function lookup(query) {
  const q = query.trim();
  const url = `/api/ip${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function dnsLookup(host) {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`);
  const data = await res.json();
  return data.Answer?.map(a => a.data) ?? [];
}

async function rdnsLookup(ip) {
  const rev = ip.split('.').reverse().join('.');
  const res = await fetch(`https://dns.google/resolve?name=${rev}.in-addr.arpa&type=PTR`);
  const data = await res.json();
  return data.Answer?.map(a => a.data.replace(/\.$/, '')) ?? [];
}

function Row({ icon: Icon, label, value, color }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a] last:border-0">
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color }} />
      <span className="text-xs text-[#a3a3a3] w-28 shrink-0">{label}</span>
      <span className="text-xs font-mono text-[#171717] dark:text-[#ededed] break-all">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
    </div>
  );
}

export default function IpPage() {
  const [query, setQuery]   = useState('');
  const [result, setResult] = useState(null);
  const [dns, setDns]       = useState([]);
  const [rdns, setRdns]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState('');
  const pushToast = useToast();

  const isIP = (s) => /^[\d.]+$/.test(s) || /^[0-9a-fA-F:]+$/.test(s);

  // Normalize: strip protocol/path if user enters a full URL
  function normalize(raw) {
    const s = raw.trim();
    if (!s) return '';
    try {
      if (/^https?:\/\//i.test(s)) return new URL(s).hostname;
    } catch {}
    return s.replace(/\/.*$/, '').trim(); // strip path
  }

  async function run(q = query) {
    const normalized = normalize(q);
    if (q.trim() && normalized !== q.trim()) setQuery(normalized);
    setLoading(true); setError(''); setResult(null); setDns([]); setRdns([]);
    try {
      const data = await lookup(normalized);
      setResult(data);
      const host = normalized;
      if (host && !isIP(host)) {
        const ips = await dnsLookup(host).catch(() => []);
        setDns(ips);
      }
      if (data.ip) {
        const ptr = await rdnsLookup(data.ip).catch(() => []);
        setRdns(ptr);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-load own IP
  useEffect(() => { run(''); }, []);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    pushToast?.('Copié !');
    setTimeout(() => setCopied(''), 2000);
  };

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Infos IP / Domaine</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Géolocalisation, ASN, DNS, rDNS</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {/* Search */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-3">IP ou nom de domaine</label>
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] px-3 focus-within:ring-2"
              style={{ '--tw-ring-color': ACCENT }}>
              <Search className="w-4 h-4 text-[#a3a3a3] shrink-0 pointer-events-none" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && run()}
                placeholder="8.8.8.8, google.com… (vide = votre IP)"
                className="flex-1 py-2.5 bg-transparent text-sm text-[#171717] dark:text-[#ededed] focus:outline-none placeholder:text-[#a3a3a3]" />
            </div>
            <button onClick={() => run()}
              style={{ backgroundColor: ACCENT }}
              className="px-5 py-2.5 text-white text-sm font-medium rounded-xl hover:opacity-90 flex items-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Analyser
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>

        {result && (
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Identity */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                <Wifi className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">Identité</span>
                <button onClick={() => copy(result.ip, 'ip')} className="ml-auto">
                  {copied === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#a3a3a3] hover:text-[#525252]" />}
                </button>
              </div>
              <div className="p-4">
                <div className="text-2xl font-mono font-bold text-[#171717] dark:text-[#ededed] mb-3">{result.ip}</div>
                <Row icon={Globe} label="Type" value={result.type} color={ACCENT} />
                <Row icon={Globe} label="Hostname" value={rdns[0] || result.hostname} color={ACCENT} />
                <Row icon={Globe} label="rDNS" value={rdns.join(', ')} color={ACCENT} />
                {dns.length > 0 && <Row icon={Globe} label="Résolutions A" value={dns.join(', ')} color={ACCENT} />}
              </div>
            </div>

            {/* Location */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                <MapPin className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">Géolocalisation</span>
                {result.latitude && result.longitude && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${result.latitude}&mlon=${result.longitude}&zoom=10`}
                    target="_blank" rel="noopener noreferrer"
                    className="ml-auto text-[10px] flex items-center gap-1 text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#d4d4d4]"
                  >
                    <MapPin className="w-3 h-3" /> Ouvrir OSM
                  </a>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {result.flag?.emoji && <span className="text-4xl">{result.flag.emoji}</span>}
                  <div className="flex-1 min-w-0">
                    <Row icon={MapPin} label="Pays" value={result.country && result.country_code ? `${result.country} (${result.country_code})` : result.country} color={ACCENT} />
                    <Row icon={MapPin} label="Région" value={result.region} color={ACCENT} />
                    <Row icon={MapPin} label="Ville" value={result.city} color={ACCENT} />
                    <Row icon={MapPin} label="Code postal" value={result.postal} color={ACCENT} />
                    <Row icon={Clock} label="Fuseau" value={result.timezone?.id} color={ACCENT} />
                  </div>
                </div>

                {/* OpenStreetMap embed */}
                {result.latitude && result.longitude && (
                  <div className="rounded-xl overflow-hidden border border-[#e5e5e5] dark:border-[#262626] mt-1">
                    <iframe
                      title="Carte"
                      width="100%"
                      height="200"
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${result.longitude - 0.015},${result.latitude - 0.015},${result.longitude + 0.015},${result.latitude + 0.015}&layer=mapnik&marker=${result.latitude},${result.longitude}`}
                      className="block w-full"
                      style={{ border: 0 }}
                    />
                    <div className="px-3 py-1.5 bg-[#fafafa] dark:bg-[#0a0a0a] border-t border-[#e5e5e5] dark:border-[#262626] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#a3a3a3]">
                        {result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}
                      </span>
                      <span className="text-[10px] text-[#a3a3a3]">© OpenStreetMap</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Network */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden sm:col-span-2">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                <Server className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">Réseau</span>
              </div>
              <div className="p-4 grid sm:grid-cols-2 gap-x-8">
                <div>
                  <Row icon={Server} label="ASN" value={result.connection?.asn && `AS${result.connection.asn}`} color={ACCENT} />
                  <Row icon={Server} label="Organisation" value={result.connection?.org} color={ACCENT} />
                  <Row icon={Server} label="ISP" value={result.connection?.isp} color={ACCENT} />
                </div>
                <div>
                  <Row icon={Server} label="Domaine" value={result.connection?.domain} color={ACCENT} />
                  <Row icon={Globe} label="Continent" value={result.continent} color={ACCENT} />
                  {result.security && (
                    <>
                      <Row icon={Server} label="VPN" value={result.security.vpn ? 'Oui' : 'Non'} color={ACCENT} />
                      <Row icon={Server} label="Proxy" value={result.security.proxy ? 'Oui' : 'Non'} color={ACCENT} />
                      <Row icon={Server} label="Tor" value={result.security.tor ? 'Oui' : 'Non'} color={ACCENT} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
