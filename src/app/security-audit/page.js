'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, ExternalLink, AlertTriangle, Info, ChevronDown, ChevronRight } from 'lucide-react';

const ACCENT = '#dc2626';

const SEVERITY_CONFIG = {
  critical: { label: 'Critique', color: '#dc2626', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900', icon: ShieldX },
  high:     { label: 'Élevé',   color: '#ea580c', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-900', icon: ShieldAlert },
  medium:   { label: 'Moyen',   color: '#ca8a04', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900', icon: AlertTriangle },
  low:      { label: 'Faible',  color: '#2563eb', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900', icon: Info },
};

const CATEGORY_LABELS = {
  ssl: 'SSL/TLS',
  https: 'HTTPS',
  headers: 'En-têtes HTTP',
  fichiers_sensibles: 'Fichiers sensibles',
  cookies: 'Cookies',
  cors: 'CORS',
  connexion: 'Connexion',
};

export default function SecurityAuditPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedFindings, setExpandedFindings] = useState(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = new URLSearchParams(window.location.search).get('url');
      if (u) setUrl(u);
    }
  }, []);

  const runAudit = async () => {
    if (!url.trim()) { setError('Entrez une URL'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/security-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setResult(data);
      setActiveTab('summary');
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'audit');
    } finally {
      setLoading(false);
    }
  };

  const toggleFinding = (i) => {
    setExpandedFindings(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const tabs = [
    { id: 'summary', label: 'Résumé' },
    { id: 'findings', label: 'Failles' },
    { id: 'urls', label: 'URLs découvertes' },
    { id: 'remediation', label: 'Comment corriger' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Audit de sécurité web</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Découverte d&apos;URLs, tests de failles, rapport et remédiations</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Input */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] block mb-3">URL du site à auditer</label>
          <div className="flex gap-3">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAudit()}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] text-sm font-mono focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': ACCENT }}
            />
            <button
              onClick={runAudit}
              disabled={loading || !url.trim()}
              style={{ backgroundColor: ACCENT }}
              className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyse…
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Lancer l&apos;audit
                </>
              )}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <p className="mt-2 text-xs text-[#a3a3a3]">L&apos;audit peut prendre 30–90 secondes. Crawl du site, tests SSL, headers, fichiers sensibles, cookies et CORS.</p>
        </div>

        {loading && (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[#e5e5e5] dark:border-[#262626]" />
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${ACCENT} transparent transparent transparent` }} />
              </div>
            </div>
            <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">Audit de sécurité en cours…</p>
            <div className="mt-3 space-y-1.5 text-xs text-[#a3a3a3] max-w-xs mx-auto">
              {['Découverte des URLs du domaine', 'Vérification SSL/TLS', 'Test des en-têtes de sécurité', 'Recherche de fichiers sensibles', 'Analyse des cookies et CORS'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT, animationDelay: `${i * 0.3}s` }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {result && !loading && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#a3a3a3]">Site audité :</p>
                <a href={result.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline truncate max-w-lg block" style={{ color: ACCENT }}>
                  {result.url}
                </a>
              </div>
              <p className="text-xs text-[#a3a3a3] shrink-0">{new Date(result.auditedAt).toLocaleString('fr-FR')}</p>
            </div>

            {/* Score badges */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.summary || {}).map(([sev, count]) => {
                if (count === 0) return null;
                const cfg = SEVERITY_CONFIG[sev];
                const Icon = cfg?.icon || Shield;
                return (
                  <span key={sev} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#171717] border"
                    style={{ borderColor: cfg?.color + '60', color: cfg?.color }}>
                    <Icon className="w-3.5 h-3.5" />
                    {cfg?.label || sev} : {count}
                  </span>
                );
              })}
              {result.findings?.length === 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Aucune faille critique détectée
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-1 border-b border-[#e5e5e5] dark:border-[#262626] pb-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id ? 'border-current' : 'border-transparent text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed]'
                  }`}
                  style={activeTab === tab.id ? { borderColor: ACCENT, color: ACCENT } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Summary */}
            {activeTab === 'summary' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Statistiques</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#525252] dark:text-[#a3a3a3]">URLs découvertes</span>
                      <span className="font-mono font-medium text-[#171717] dark:text-[#ededed]">{result.discoveredUrls?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#525252] dark:text-[#a3a3a3]">Failles totales</span>
                      <span className="font-mono font-medium text-[#171717] dark:text-[#ededed]">{result.findings?.length || 0}</span>
                    </div>
                    {result.ssl && !result.ssl.error && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#525252] dark:text-[#a3a3a3]">SSL</span>
                        <span className={`font-mono font-medium ${result.ssl.expired ? 'text-red-500' : result.ssl.expireSoon ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {result.ssl.expired ? 'Expiré' : result.ssl.expireSoon ? `${result.ssl.daysLeft} jours` : 'OK'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Par catégorie</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                      const count = result.findings?.filter(f => f.category === key).length || 0;
                      if (count === 0) return null;
                      return (
                        <span key={key} className="px-2.5 py-1 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] text-xs">
                          {label} : <strong>{count}</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Findings */}
            {activeTab === 'findings' && (
              <div className="space-y-3">
                {result.findings?.length === 0 ? (
                  <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-10 text-center">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                    <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">Aucune faille détectée</p>
                    <p className="text-xs text-[#a3a3a3] mt-1">Les tests de base n&apos;ont pas révélé de problèmes.</p>
                  </div>
                ) : (
                  result.findings?.map((f, i) => {
                    const cfg = SEVERITY_CONFIG[f.severity] || SEVERITY_CONFIG.low;
                    const Icon = cfg.icon;
                    const isExpanded = expandedFindings.has(i);
                    return (
                      <div key={i} className={`rounded-xl border ${cfg.bg} ${cfg.border} overflow-hidden`}>
                        <button
                          onClick={() => toggleFinding(i)}
                          className="w-full flex items-start gap-3 p-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <span className="shrink-0 mt-0.5" style={{ color: cfg.color }}><Icon className="w-4 h-4" /></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">{f.title}</p>
                            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5 truncate">{f.url}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: cfg.color + '30', color: cfg.color }}>
                              {cfg.label} · {CATEGORY_LABELS[f.category] || f.category}
                            </span>
                          </div>
                          {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0 text-[#a3a3a3]" /> : <ChevronRight className="w-4 h-4 shrink-0 text-[#a3a3a3]" />}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 border-t border-[#e5e5e5] dark:border-[#262626]">
                            <p className="text-xs text-[#525252] dark:text-[#a3a3a3] mb-2">{f.description}</p>
                            <div className="bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg p-3 border border-[#e5e5e5] dark:border-[#262626]">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-1">Comment corriger</p>
                              <p className="text-sm text-[#171717] dark:text-[#ededed]">{f.remediation}</p>
                            </div>
                            <a href={f.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline" style={{ color: ACCENT }}>
                              <ExternalLink className="w-3 h-3" /> Vérifier l&apos;URL
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* URLs */}
            {activeTab === 'urls' && (
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
                <div className="px-5 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">
                    {result.discoveredUrls?.length || 0} URLs trouvées sur le domaine
                  </p>
                </div>
                <div className="max-h-96 overflow-y-auto p-4">
                  <ul className="space-y-1 font-mono text-xs">
                    {result.discoveredUrls?.map((u, i) => (
                      <li key={i} className="flex items-center gap-2 py-1">
                        <a href={u} target="_blank" rel="noopener noreferrer"
                          className="text-[#525252] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] truncate hover:underline"
                          style={{ color: ACCENT }}>
                          {u}
                        </a>
                        <ExternalLink className="w-3 h-3 shrink-0 text-[#a3a3a3]" />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Remediation guide */}
            {activeTab === 'remediation' && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-4">Guide de remédiation</p>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-semibold text-[#171717] dark:text-[#ededed] mb-1">En-têtes de sécurité (HTTP)</p>
                      <p className="text-[#525252] dark:text-[#a3a3a3]">Ajoutez ces headers dans votre serveur (nginx, Apache, etc.) ou via votre framework :</p>
                      <pre className="mt-2 p-3 bg-[#0a0a0a] dark:bg-[#000] text-[#ededed] rounded-lg text-xs overflow-x-auto font-mono">{`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; script-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()`}</pre>
                    </div>
                    <div>
                      <p className="font-semibold text-[#171717] dark:text-[#ededed] mb-1">SSL/TLS</p>
                      <p className="text-[#525252] dark:text-[#a3a3a3]">Utilisez Let&apos;s Encrypt (gratuit) ou un certificat commercial. Renouvelez avant expiration.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#171717] dark:text-[#ededed] mb-1">Fichiers sensibles</p>
                      <p className="text-[#525252] dark:text-[#a3a3a3]">Ne déployez jamais .git, .env ou fichiers de config. Bloquez l&apos;accès via .htaccess ou nginx.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#171717] dark:text-[#ededed] mb-1">Cookies</p>
                      <p className="text-[#525252] dark:text-[#a3a3a3]">Utilisez Secure, HttpOnly et SameSite=Strict pour les cookies de session.</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-[#a3a3a3]">
                  Consultez les failles détectées dans l&apos;onglet « Failles » pour des remédiations spécifiques à votre site.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
