'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, X, AlertTriangle, Zap, Search, Accessibility, Lock, Image as ImageIcon, ClipboardList, Minus } from 'lucide-react';

const ACCENT = '#0ea5e9';

// ── Helpers ────────────────────────────────────────────────────
function ms(v) {
  if (!v && v !== 0) return '—';
  if (v < 1000) return `${v} ms`;
  return `${(v / 1000).toFixed(2)} s`;
}
function fmt(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`;
  return `${(b / (1024 * 1024)).toFixed(2)} Mo`;
}
function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function ScoreCircle({ label, score, color }) {
  const colors = {
    green:  { ring: '#10b981', text: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    orange: { ring: '#f59e0b', text: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    red:    { ring: '#ef4444', text: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20' },
  };
  const c = colors[color] || colors.orange;
  const r = 38, circ = 2 * Math.PI * r;
  const dash = circ - (score / 100) * circ;
  return (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-xl ${c.bg} border border-[#e5e5e5] dark:border-[#262626]`}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} strokeWidth="7" stroke="#e5e5e5" fill="none" />
        <circle cx="50" cy="50" r={r} strokeWidth="7" stroke={c.ring} fill="none"
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 26, fontWeight: 700, fill: c.text, fontFamily: 'inherit' }}>
          {score}
        </text>
        <text x="50" y="63" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 11, fill: '#a3a3a3', fontFamily: 'inherit' }}>
          /100
        </text>
      </svg>
      <p className="text-xs font-medium text-[#171717] dark:text-[#ededed] text-center">{label}</p>
    </div>
  );
}

function IssueRow({ issue }) {
  const cfg = {
    ok:    { icon: <Check className="w-3.5 h-3.5" />,          cls: 'text-emerald-600 dark:text-emerald-400' },
    warn:  { icon: <AlertTriangle className="w-3.5 h-3.5" />,  cls: 'text-amber-600 dark:text-amber-400' },
    error: { icon: <X className="w-3.5 h-3.5" />,              cls: 'text-red-600 dark:text-red-400' },
    info:  { icon: <Minus className="w-3.5 h-3.5" />,          cls: 'text-[#737373] dark:text-[#a3a3a3]' },
  };
  const c = cfg[issue.type] || cfg.info;
  return (
    <li className="flex items-start gap-2.5 py-1.5 text-sm border-b border-[#f5f5f5] dark:border-[#1a1a1a] last:border-0">
      <span className={`shrink-0 mt-0.5 ${c.cls}`}>{c.icon}</span>
      <span className="text-[#525252] dark:text-[#a3a3a3] text-xs leading-relaxed">{issue.msg}</span>
    </li>
  );
}

function WeightBar({ label, value, total, color }) {
  const p = pct(value, total);
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#525252] dark:text-[#a3a3a3]">{label}</span>
        <span className="font-medium text-[#171717] dark:text-[#ededed] tabular-nums">{fmt(value)} <span className="text-[#a3a3a3]">({p}%)</span></span>
      </div>
      <div className="h-2 bg-[#f5f5f5] dark:bg-[#262626] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function TimingRow({ label, value, good, warn }) {
  const color = !value ? 'text-[#a3a3a3]' : value <= good ? 'text-emerald-500' : value <= warn ? 'text-amber-500' : 'text-red-500';
  const barColor = !value ? '#e5e5e5' : value <= good ? '#10b981' : value <= warn ? '#f59e0b' : '#ef4444';
  const pctVal = Math.min(100, value ? (value / (warn * 2)) * 100 : 0);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#737373] dark:text-[#a3a3a3] w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[#f5f5f5] dark:bg-[#262626] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pctVal}%`, backgroundColor: barColor }} />
      </div>
      <span className={`text-xs font-mono font-medium w-20 text-right shrink-0 ${color}`}>{ms(value)}</span>
    </div>
  );
}

const TYPE_COLORS = { html: '#2563eb', css: '#7c3aed', js: '#f59e0b', image: '#10b981', font: '#ec4899', other: '#a3a3a3', data: '#0891b2' };

export default function AuditPage() {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URLSearchParams(window.location.search).get('url');
    if (u) setUrl(u);
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [serpOpen, setSerpOpen] = useState(false);
  const [serpTitle, setSerpTitle] = useState('');
  const [serpDesc, setSerpDesc] = useState('');
  const [serpCopied, setSerpCopied] = useState(false);

  const handleAudit = async () => {
    if (!url.trim()) { setError('Entrez une URL'); return; }
    setLoading(true);
    setError(null);
      setResult(null);
    setActiveTab('todo');
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'audit');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'todo',      label: 'À faire', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: 'overview',  label: 'Vue d\'ensemble' },
    { id: 'perf',      label: 'Performance' },
    { id: 'seo',       label: 'SEO' },
    { id: 'images',    label: 'Images' },
    { id: 'resources', label: 'Ressources' },
    { id: 'a11y',      label: 'Accessibilité' },
    { id: 'security',  label: 'Sécurité' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Audit de performance web</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Vitesse, SEO, images, accessibilité, ressources</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* URL Input */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
              </span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
                placeholder="https://example.com"
                className="w-full pl-9 pr-4 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 font-mono"
                style={{ '--tw-ring-color': ACCENT }}
              />
            </div>
            <button
              onClick={handleAudit}
              disabled={loading || !url.trim()}
              style={{ backgroundColor: ACCENT }}
              className="px-5 py-2.5 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyse…
                </span>
              ) : 'Analyser'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <p className="mt-2 text-xs text-[#a3a3a3]">L&apos;analyse peut prendre 15–30 secondes selon la complexité du site.</p>
        </div>

        {/* Loading animation */}
        {loading && (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[#e5e5e5] dark:border-[#262626]" />
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${ACCENT} transparent transparent transparent` }} />
              </div>
            </div>
            <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">Analyse en cours…</p>
            <div className="mt-3 space-y-1.5 text-xs text-[#a3a3a3] max-w-xs mx-auto">
              {['Chargement de la page', 'Mesure des temps de réponse', 'Analyse du DOM et SEO', 'Calcul des Web Vitals', 'Audit des ressources'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT, animationDelay: `${i * 0.3}s` }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Audited URL + date */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#a3a3a3]">Site analysé :</p>
                <a href={result.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline truncate max-w-lg block" style={{ color: ACCENT }}>
                  {result.url}
                </a>
              </div>
              <p className="text-xs text-[#a3a3a3] shrink-0">{new Date(result.auditedAt).toLocaleString('fr-FR')}</p>
            </div>

            {/* Score circles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ScoreCircle label="Performance"    score={result.scores.performance.value}    color={result.scores.performance.color} />
              <ScoreCircle label="SEO"             score={result.scores.seo.value}             color={result.scores.seo.color} />
              <ScoreCircle label="Accessibilité"  score={result.scores.accessibility.value}  color={result.scores.accessibility.color} />
              <ScoreCircle label="Bonnes pratiques" score={result.scores.bestPractices.value} color={result.scores.bestPractices.color} />
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-1 border-b border-[#e5e5e5] dark:border-[#262626] pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? 'border-current text-[#171717] dark:text-[#ededed]'
                      : 'border-transparent text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed]'
                  }`}
                  style={activeTab === tab.id ? { borderColor: ACCENT, color: ACCENT } : {}}
                >
                  <span className="flex items-center gap-1">{tab.icon}{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── À faire ───────────────────── */}
            {activeTab === 'todo' && (() => {
              const CATEGORIES = [
                { key: 'performance', label: 'Performance',    color: '#f59e0b', icon: <Zap className="w-3 h-3" /> },
                { key: 'seo',         label: 'SEO',            color: '#2563eb', icon: <Search className="w-3 h-3" /> },
                { key: 'accessibility', label: 'Accessibilité', color: '#7c3aed', icon: <Accessibility className="w-3 h-3" /> },
                { key: 'security',    label: 'Sécurité',       color: '#ef4444', icon: <Lock className="w-3 h-3" /> },
              ];

              // Collect all error/warn issues with category tags
              const allTodos = [];
              for (const cat of CATEGORIES) {
                const issues = result[cat.key]?.issues || [];
                for (const issue of issues) {
                  if (issue.type === 'error' || issue.type === 'warn') {
                    allTodos.push({ ...issue, category: cat.label, catColor: cat.color, catIcon: cat.icon });
                  }
                }
              }

              // Image issues aggregation
              const imgsNoAlt = result.images.list.filter(i => !i.hasAlt).length;
              const imgsNoDims = result.images.list.filter(i => !i.hasDimensions).length;
              const imgsNoLazy = result.images.list.filter(i => i.loading !== 'lazy').length;
              const imgsNoNextGen = result.images.list.filter(i => !i.isNextGen).length;
              if (imgsNoAlt > 0) allTodos.push({ type: 'error', category: 'Images', catColor: '#10b981', catIcon: <ImageIcon className="w-3 h-3" />, msg: `${imgsNoAlt} image(s) sans attribut alt — requis pour l'accessibilité et le SEO` });
              if (imgsNoDims > 0) allTodos.push({ type: 'warn', category: 'Images', catColor: '#10b981', catIcon: <ImageIcon className="w-3 h-3" />, msg: `${imgsNoDims} image(s) sans attributs width/height — provoque un CLS élevé` });
              if (imgsNoNextGen > 0) allTodos.push({ type: 'warn', category: 'Images', catColor: '#10b981', catIcon: <ImageIcon className="w-3 h-3" />, msg: `${imgsNoNextGen} image(s) non converties en WebP/AVIF — gain de poids potentiel important` });
              if (imgsNoLazy > 0) allTodos.push({ type: 'warn', category: 'Images', catColor: '#10b981', catIcon: <ImageIcon className="w-3 h-3" />, msg: `${imgsNoLazy} image(s) sans lazy loading — ralentit le chargement initial` });

              // Sort: errors first, then warns
              allTodos.sort((a, b) => (a.type === 'error' ? -1 : 1) - (b.type === 'error' ? -1 : 1));

              const errors = allTodos.filter(t => t.type === 'error');
              const warns  = allTodos.filter(t => t.type === 'warn');

              const PRIORITY_CFG = {
                error: { label: 'Critique', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900', dot: 'bg-red-500', badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' },
                warn:  { label: 'À améliorer', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900', dot: 'bg-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' },
              };

              const renderGroup = (items, type) => {
                if (!items.length) return null;
                const cfg = PRIORITY_CFG[type];
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">
                        {cfg.label} — {items.length} point{items.length > 1 ? 's' : ''}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {items.map((item, i) => (
                        <li key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                          <span className={`mt-0.5 p-1 rounded shrink-0 ${cfg.badge}`}>
                            {type === 'error' ? <X className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#171717] dark:text-[#ededed] leading-snug">{item.msg}</p>
                          </div>
                          <span className="shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border border-[#e5e5e5] dark:border-[#262626] text-[#737373] dark:text-[#a3a3a3] bg-white dark:bg-[#171717]">
                            <span>{item.catIcon}</span> {item.category}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              };

              return (
                <div className="space-y-6">
                  {/* Summary header */}
                  <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">Plan d&apos;action</h2>
                        <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">Points à corriger pour améliorer votre site, classés par priorité.</p>
                      </div>
                      <div className="flex gap-2">
                        {errors.length > 0 && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                            {errors.length} critique{errors.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {warns.length > 0 && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                            {warns.length} à améliorer
                          </span>
                        )}
                        {allTodos.length === 0 && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Aucun problème détecté</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Score global recap */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Performance',     s: result.scores.performance },
                        { label: 'SEO',             s: result.scores.seo },
                        { label: 'Accessibilité',   s: result.scores.accessibility },
                        { label: 'Bonnes pratiques',s: result.scores.bestPractices },
                      ].map(({ label, s }) => (
                        <div key={label} className="bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg p-2.5 text-center">
                          <p className={`text-lg font-bold tabular-nums ${s.color === 'green' ? 'text-emerald-500' : s.color === 'orange' ? 'text-amber-500' : 'text-red-500'}`}>{s.value}</p>
                          <p className="text-[10px] text-[#a3a3a3] leading-tight mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {allTodos.length === 0 ? (
                    <div className="text-center py-12 text-[#737373] dark:text-[#a3a3a3]">
                      <Check className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                      <p className="text-sm font-medium">Aucun problème critique détecté</p>
                      <p className="text-xs mt-1">Votre site semble bien optimisé sur les points analysés.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {renderGroup(errors, 'error')}
                      {renderGroup(warns, 'warn')}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Overview ──────────────────── */}
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-5">
                {/* Core Web Vitals */}
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-4">Core Web Vitals</p>
                  <div className="space-y-3">
                    <TimingRow label="TTFB"  value={result.timing.ttfb} good={200}  warn={800} />
                    <TimingRow label="FCP"   value={result.timing.fcp}  good={1800} warn={3000} />
                    <TimingRow label="LCP"   value={result.timing.lcp}  good={2500} warn={4000} />
                    <TimingRow label="DCL"   value={result.timing.dcl}  good={2000} warn={4000} />
                    <TimingRow label="Load"  value={result.timing.load} good={3000} warn={6000} />
                  </div>
                  {result.timing.cls !== undefined && (
                    <div className="mt-3 pt-3 border-t border-[#f5f5f5] dark:border-[#1a1a1a] flex items-center justify-between text-xs">
                      <span className="text-[#737373] dark:text-[#a3a3a3]">CLS</span>
                      <span className={`font-mono font-medium ${result.timing.cls <= 0.1 ? 'text-emerald-500' : result.timing.cls <= 0.25 ? 'text-amber-500' : 'text-red-500'}`}>
                        {result.timing.cls ?? '—'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Poids page */}
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Poids de la page</p>
                    <span className="text-sm font-bold text-[#171717] dark:text-[#ededed]">{result.pageWeight.totalFormatted}</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'js',    label: 'JavaScript' },
                      { key: 'image', label: 'Images' },
                      { key: 'css',   label: 'CSS' },
                      { key: 'font',  label: 'Polices' },
                      { key: 'html',  label: 'HTML' },
                      { key: 'other', label: 'Autres' },
                    ].map(({ key, label }) => (
                      result.pageWeight[key] > 0 && (
                        <WeightBar key={key} label={label} value={result.pageWeight[key]} total={result.pageWeight.total} color={TYPE_COLORS[key]} />
                      )
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#f5f5f5] dark:border-[#1a1a1a] text-xs text-[#737373] dark:text-[#a3a3a3]">
                    {result.pageWeight.requests} requêtes HTTP
                  </div>
                </div>

                {/* Meta stats */}
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Statistiques page</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Nœuds DOM', value: result.meta.domNodes },
                      { label: 'Scripts',   value: result.meta.totalScripts },
                      { label: 'Feuilles CSS', value: result.meta.stylesheets },
                      { label: 'Liens internes', value: result.meta.internalLinks },
                      { label: 'Liens externes', value: result.meta.externalLinks },
                      { label: 'Images', value: result.images.total },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg p-3">
                        <p className="text-lg font-bold text-[#171717] dark:text-[#ededed] tabular-nums">{value ?? '—'}</p>
                        <p className="text-[10px] text-[#a3a3a3] mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timing breakdown */}
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Décomposition réseau</p>
                  <div className="space-y-2.5">
                    {[
                      { label: 'DNS',       value: result.timing.dns },
                      { label: 'TCP',       value: result.timing.tcp },
                      { label: 'SSL/TLS',   value: result.timing.ssl },
                      { label: 'TTFB',      value: result.timing.ttfb },
                      { label: 'Réponse',   value: result.timing.response },
                      { label: 'DOM parsing', value: result.timing.domParsing },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="text-[#737373] dark:text-[#a3a3a3] w-28">{label}</span>
                        <span className="font-mono font-medium text-[#171717] dark:text-[#ededed]">{ms(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Performance ───────────────── */}
            {activeTab === 'perf' && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Analyse de performance</p>
                  <ul className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
                    {result.performance.issues.map((issue, i) => <IssueRow key={i} issue={issue} />)}
                  </ul>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: 'JavaScript',   val: fmt(result.pageWeight.js),    sub: `${result.pageWeight.requestsByType?.js || 0} fichiers`,    color: TYPE_COLORS.js },
                    { label: 'Images',       val: fmt(result.pageWeight.image), sub: `${result.images.total} images`,                              color: TYPE_COLORS.image },
                    { label: 'CSS',          val: fmt(result.pageWeight.css),   sub: `${result.pageWeight.requestsByType?.css || 0} fichiers`,   color: TYPE_COLORS.css },
                  ].map(({ label, val, sub, color }) => (
                    <div key={label} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
                      <div className="w-3 h-3 rounded-sm mb-2" style={{ backgroundColor: color }} />
                      <p className="text-lg font-bold text-[#171717] dark:text-[#ededed]">{val}</p>
                      <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{label}</p>
                      <p className="text-[10px] text-[#a3a3a3] mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>
                {result.meta.totalScripts > 0 && (
                  <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Scripts ({result.meta.totalScripts} total)</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[#a3a3a3] border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                            <th className="text-left py-2 font-medium">URL</th>
                            <th className="text-center py-2 font-medium w-16">async</th>
                            <th className="text-center py-2 font-medium w-16">defer</th>
                            <th className="text-center py-2 font-medium w-16">inline</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.resources.topBySize.filter(r => r.type === 'js').map((r, i) => (
                            <tr key={i} className="border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                              <td className="py-2 pr-4">
                                <span className="truncate block max-w-xs text-[#525252] dark:text-[#a3a3a3] font-mono text-[10px]">{r.url}</span>
                                <span className="text-[#a3a3a3]">{r.sizeFormatted}</span>
                              </td>
                              <td className="text-center py-2"><span className="text-[#a3a3a3]">—</span></td>
                              <td className="text-center py-2"><span className="text-[#a3a3a3]">—</span></td>
                              <td className="text-center py-2"><span className="text-[#a3a3a3]">—</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SEO ───────────────────────── */}
            {activeTab === 'seo' && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Audit SEO</p>
                  <ul className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
                    {result.seo.issues.map((issue, i) => <IssueRow key={i} issue={issue} />)}
                  </ul>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {result.seo.extras.title && (
                    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
                      <p className="text-xs text-[#a3a3a3] mb-1">Balise title ({result.seo.extras.title.length} car.)</p>
                      <p className="text-sm text-[#171717] dark:text-[#ededed] font-medium">{result.seo.extras.title}</p>
                    </div>
                  )}
                  {result.seo.extras.description && (
                    <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
                      <p className="text-xs text-[#a3a3a3] mb-1">Meta description ({result.seo.extras.description.length} car.)</p>
                      <p className="text-sm text-[#525252] dark:text-[#a3a3a3]">{result.seo.extras.description}</p>
                    </div>
                  )}
                </div>
                {/* SERP preview */}
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Aperçu SERP Google</p>
                    <button
                      onClick={() => {
                        const currentTitle = result.seo.extras.title || '';
                        const currentDesc = result.seo.extras.description || '';
                        const h1 = result.seo.extras.h1Text || '';
                        const domain = (() => { try { return new URL(result.url).hostname.replace('www.', ''); } catch { return ''; } })();
                        // Smart suggestions
                        let sugTitle = currentTitle;
                        if (!sugTitle && h1) sugTitle = `${h1}${domain ? ` — ${domain}` : ''}`;
                        else if (sugTitle && sugTitle.length < 30 && domain && !sugTitle.toLowerCase().includes(domain.split('.')[0])) sugTitle = `${sugTitle} — ${domain}`;
                        let sugDesc = currentDesc;
                        if (!sugDesc && h1) sugDesc = `Découvrez ${h1.toLowerCase()} sur ${domain}. Retrouvez toutes les informations, ressources et services disponibles.`;
                        setSerpTitle(sugTitle.slice(0, 60));
                        setSerpDesc(sugDesc.slice(0, 160));
                        setSerpCopied(false);
                        setSerpOpen(true);
                      }}
                      style={{ backgroundColor: ACCENT }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Générer une version optimisée
                    </button>
                  </div>

                  {/* Current SERP */}
                  <div className="bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg p-4 max-w-xl">
                    <p className="text-[#1a0dab] dark:text-[#8ab4f8] text-lg font-normal leading-snug hover:underline cursor-pointer truncate">
                      {result.seo.extras.title || '(title manquant)'}
                    </p>
                    <p className="text-[#006621] dark:text-[#34a853] text-xs mt-0.5">{result.url}</p>
                    <p className="text-[#545454] dark:text-[#bdc1c6] text-sm mt-1 leading-relaxed line-clamp-2">
                      {result.seo.extras.description || '(meta description manquante — Google choisira un extrait automatiquement)'}
                    </p>
                  </div>

                  {/* SERP Optimizer panel */}
                  {serpOpen && (
                    <div className="border border-[#e5e5e5] dark:border-[#262626] rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#fafafa] dark:bg-[#0a0a0a] border-b border-[#e5e5e5] dark:border-[#262626] flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">Éditeur SERP</p>
                        <button onClick={() => setSerpOpen(false)} className="text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#ededed]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="p-4 space-y-4">
                        {/* Title input */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-[#525252] dark:text-[#a3a3a3]">Balise title</label>
                            <span className={`text-[10px] font-mono font-medium ${serpTitle.length < 30 ? 'text-amber-500' : serpTitle.length <= 60 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {serpTitle.length}/60 car.
                            </span>
                          </div>
                          <input
                            value={serpTitle}
                            onChange={e => { setSerpTitle(e.target.value.slice(0, 70)); setSerpCopied(false); }}
                            placeholder="Titre de la page — Nom du site"
                            className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2"
                            style={{ '--tw-ring-color': ACCENT }}
                          />
                          <p className="mt-1 text-[10px] text-[#a3a3a3]">Idéal : 30–60 caractères. Incluez le mot-clé principal en premier.</p>
                        </div>
                        {/* Description input */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-[#525252] dark:text-[#a3a3a3]">Meta description</label>
                            <span className={`text-[10px] font-mono font-medium ${serpDesc.length < 70 ? 'text-amber-500' : serpDesc.length <= 160 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {serpDesc.length}/160 car.
                            </span>
                          </div>
                          <textarea
                            rows={3}
                            value={serpDesc}
                            onChange={e => { setSerpDesc(e.target.value.slice(0, 180)); setSerpCopied(false); }}
                            placeholder="Description courte et engageante de la page, avec votre mot-clé principal…"
                            className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2 resize-none"
                            style={{ '--tw-ring-color': ACCENT }}
                          />
                          <p className="mt-1 text-[10px] text-[#a3a3a3]">Idéal : 70–160 caractères. Rédigez comme un accroche publicitaire.</p>
                        </div>

                        {/* Live preview */}
                        <div>
                          <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-2">Prévisualisation</p>
                          <div className="bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded-lg p-4 max-w-xl">
                            <p className="text-[#1a0dab] dark:text-[#8ab4f8] text-lg font-normal leading-snug hover:underline cursor-pointer" style={{ wordBreak: 'break-word' }}>
                              {serpTitle || <span className="italic text-[#a3a3a3]">(title manquant)</span>}
                            </p>
                            <p className="text-[#006621] dark:text-[#34a853] text-xs mt-0.5 truncate">{result.url}</p>
                            <p className="text-[#545454] dark:text-[#bdc1c6] text-sm mt-1 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {serpDesc || <span className="italic text-[#a3a3a3]">(description manquante)</span>}
                            </p>
                          </div>
                        </div>

                        {/* Generated code */}
                        <div>
                          <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-2">Code à intégrer dans votre <code className="font-mono bg-[#f5f5f5] dark:bg-[#262626] px-1 rounded text-[10px]">&lt;head&gt;</code></p>
                          <div className="relative">
                            <pre className="text-[11px] font-mono bg-[#0a0a0a] dark:bg-[#000] text-[#ededed] rounded-lg p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">{`<title>${serpTitle || 'Votre titre ici'}</title>
<meta name="description" content="${serpDesc || 'Votre description ici'}" />

<!-- Open Graph (réseaux sociaux) -->
<meta property="og:title" content="${serpTitle || 'Votre titre ici'}" />
<meta property="og:description" content="${serpDesc || 'Votre description ici'}" />
<meta property="og:url" content="${result.url}" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${serpTitle || 'Votre titre ici'}" />
<meta name="twitter:description" content="${serpDesc || 'Votre description ici'}" />`}</pre>
                            <button
                              onClick={() => {
                                const code = `<title>${serpTitle || 'Votre titre ici'}</title>\n<meta name="description" content="${serpDesc || 'Votre description ici'}" />\n\n<!-- Open Graph (réseaux sociaux) -->\n<meta property="og:title" content="${serpTitle || 'Votre titre ici'}" />\n<meta property="og:description" content="${serpDesc || 'Votre description ici'}" />\n<meta property="og:url" content="${result.url}" />\n<meta property="og:type" content="website" />\n\n<!-- Twitter Card -->\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${serpTitle || 'Votre titre ici'}" />\n<meta name="twitter:description" content="${serpDesc || 'Votre description ici'}" />`;
                                navigator.clipboard.writeText(code).then(() => { setSerpCopied(true); setTimeout(() => setSerpCopied(false), 2000); });
                              }}
                              style={serpCopied ? { backgroundColor: '#10b981' } : { backgroundColor: ACCENT }}
                              className="absolute top-3 right-3 px-2.5 py-1 text-white text-[10px] font-semibold rounded transition-colors"
                            >
                              {serpCopied ? <><Check className="inline w-3 h-3 mr-0.5" />Copié</> : 'Copier'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* OG preview */}
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Open Graph</p>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    {[
                      ['og:title',       result.seo.data.ogTitle || '—'],
                      ['og:description', result.seo.data.ogDescription || '—'],
                      ['og:image',       result.seo.data.ogImage || '—'],
                      ['og:type',        result.seo.extras?.ogType || '—'],
                      ['twitter:card',   result.seo.data.hasTwitterCard ? result.seo.data.twitterCard || 'OK' : '—'],
                      ['structured data', result.seo.data.hasStructuredData ? 'JSON-LD présent' : '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg p-2.5">
                        <p className="text-[10px] text-[#a3a3a3] mb-0.5 font-mono">{k}</p>
                        <p className="text-[#525252] dark:text-[#a3a3a3] truncate">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Images ────────────────────── */}
            {activeTab === 'images' && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total',            val: result.images.total,          color: 'text-[#171717] dark:text-[#ededed]' },
                    { label: 'Avec alt',          val: result.images.withAlt,        color: 'text-emerald-500' },
                    { label: 'Format next-gen',   val: result.images.nextGen,        color: 'text-emerald-500' },
                    { label: 'Lazy loading',      val: result.images.lazy,           color: 'text-emerald-500' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
                      <p className={`text-2xl font-bold tabular-nums ${color}`}>{val ?? '—'}</p>
                      <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Détail des images</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[#a3a3a3] bg-[#fafafa] dark:bg-[#0a0a0a] border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                          <th className="text-left px-4 py-2.5 font-medium">Image</th>
                          <th className="text-left px-4 py-2.5 font-medium">Alt</th>
                          <th className="text-center px-3 py-2.5 font-medium">Dims.</th>
                          <th className="text-center px-3 py-2.5 font-medium">Lazy</th>
                          <th className="text-center px-3 py-2.5 font-medium">Next-gen</th>
                          <th className="text-left px-4 py-2.5 font-medium">Problèmes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
                        {result.images.list.map((img, i) => (
                          <tr key={i} className={`hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] ${img.issues.length > 0 ? '' : ''}`}>
                            <td className="px-4 py-2.5 max-w-[200px]">
                              <span className="truncate block font-mono text-[10px] text-[#737373] dark:text-[#a3a3a3]">{img.src || '(sans src)'}</span>
                              {img.width && img.height ? <span className="text-[#a3a3a3] text-[10px]">{img.width}×{img.height}</span> : null}
                            </td>
                            <td className="px-4 py-2.5 max-w-[150px]">
                              {!img.hasAlt ? (
                                <span className="text-red-500 font-medium">manquant</span>
                              ) : img.altEmpty ? (
                                <span className="text-amber-500">vide</span>
                              ) : (
                                <span className="truncate block text-[#525252] dark:text-[#a3a3a3]">&ldquo;{img.alt.slice(0, 40)}&rdquo;</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">{img.hasDimensions ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <X className="w-3.5 h-3.5 text-red-400 mx-auto" />}</td>
                            <td className="px-3 py-2.5 text-center">{img.loading === 'lazy' ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <Minus className="w-3.5 h-3.5 text-[#a3a3a3] mx-auto" />}</td>
                            <td className="px-3 py-2.5 text-center">{img.isNextGen ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <Minus className="w-3.5 h-3.5 text-[#a3a3a3] mx-auto" />}</td>
                            <td className="px-4 py-2.5">
                              {img.issues.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {img.issues.map(issue => (
                                    <span key={issue} className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px]">{issue}</span>
                                  ))}
                                </div>
                              ) : <span className="text-emerald-500 flex items-center gap-0.5 text-[10px]"><Check className="w-3 h-3" />OK</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Resources ─────────────────── */}
            {activeTab === 'resources' && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-3 gap-3">
                  {Object.entries(result.pageWeight.requestsByType).filter(([, v]) => v > 0).map(([type, count]) => (
                    <div key={type} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: TYPE_COLORS[type] || '#a3a3a3' }} />
                        <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase">{type}</p>
                      </div>
                      <p className="text-xl font-bold text-[#171717] dark:text-[#ededed]">{count}</p>
                      <p className="text-xs text-[#a3a3a3]">{fmt(result.pageWeight[type])}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a] flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Top ressources par poids</p>
                    <p className="text-xs text-[#a3a3a3]">{result.resources.total} total</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[#a3a3a3] bg-[#fafafa] dark:bg-[#0a0a0a] border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                          <th className="text-left px-4 py-2.5 font-medium">Ressource</th>
                          <th className="text-left px-3 py-2.5 font-medium">Type</th>
                          <th className="text-right px-4 py-2.5 font-medium">Poids</th>
                          <th className="text-right px-4 py-2.5 font-medium">Durée</th>
                          <th className="text-center px-3 py-2.5 font-medium">Statut</th>
                          <th className="text-center px-3 py-2.5 font-medium">Cache</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
                        {result.resources.topBySize.map((r, i) => (
                          <tr key={i} className="hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]">
                            <td className="px-4 py-2.5 max-w-xs">
                              <span className="truncate block font-mono text-[10px] text-[#525252] dark:text-[#a3a3a3]">{r.url}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: TYPE_COLORS[r.type] || '#a3a3a3' }}>{r.type}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-medium text-[#171717] dark:text-[#ededed] whitespace-nowrap">{r.sizeFormatted}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">{ms(r.duration)}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`font-mono font-medium ${r.status >= 200 && r.status < 300 ? 'text-emerald-500' : r.status >= 300 && r.status < 400 ? 'text-amber-500' : 'text-red-500'}`}>{r.status || '—'}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">{r.fromCache ? <span className="text-emerald-500 text-[10px]">cache</span> : <span className="text-[#a3a3a3] text-[10px]">réseau</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Accessibilité ─────────────── */}
            {activeTab === 'a11y' && (
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Accessibilité</p>
                <ul className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
                  {result.accessibility.issues.map((issue, i) => <IssueRow key={i} issue={issue} />)}
                </ul>
              </div>
            )}

            {/* ── Sécurité ──────────────────── */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3] mb-3">Sécurité & bonnes pratiques</p>
                <ul className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
                  {result.security.issues.map((issue, i) => <IssueRow key={i} issue={issue} />)}
                </ul>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
