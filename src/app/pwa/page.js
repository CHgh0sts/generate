'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, ArrowRight } from 'lucide-react';

const ACCENT = '#0d9488';

const DISPLAY_MODES = [
  { value: 'standalone', label: 'Standalone', desc: 'Fenêtre dédiée, sans chrome navigateur' },
  { value: 'fullscreen', label: 'Fullscreen', desc: 'Plein écran total' },
  { value: 'minimal-ui', label: 'Minimal UI', desc: 'UI navigateur minimale' },
  { value: 'browser', label: 'Browser', desc: 'Onglet de navigateur classique' },
];

const ORIENTATIONS = [
  { value: 'any', label: 'Libre' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Paysage' },
  { value: 'portrait-primary', label: 'Portrait (primaire)' },
  { value: 'landscape-primary', label: 'Paysage (primaire)' },
];

const FRAMEWORKS = [
  { value: 'html',          label: 'HTML / Vanilla JS',       ext: 'html' },
  { value: 'nextjs-app',    label: 'Next.js — App Router',    ext: 'js'   },
  { value: 'nextjs-pages',  label: 'Next.js — Pages Router',  ext: 'jsx'  },
  { value: 'react',         label: 'React / Vite',            ext: 'html' },
  { value: 'vue',           label: 'Vue 3 / Vite',            ext: 'html' },
  { value: 'nuxt',          label: 'Nuxt 3',                  ext: 'ts'   },
  { value: 'svelte',        label: 'SvelteKit',               ext: 'html' },
  { value: 'angular',       label: 'Angular',                 ext: 'json' },
];

const CATEGORIES = [
  'books','business','education','entertainment','finance','fitness',
  'food','games','government','health','kids','lifestyle','magazines',
  'medical','music','navigation','news','photo','productivity',
  'security','shopping','social','sports','travel','utilities','weather',
];

const PREVIEW_SIZES = [
  { size: 512, label: '512' }, { size: 192, label: '192' },
  { size: 128, label: '128' }, { size: 96,  label: '96'  },
  { size: 48,  label: '48'  }, { size: 32,  label: '32'  },
  { size: 16,  label: '16'  },
];

function generateManifestPreview(info) {
  const icons = [
    { src: '/icons/favicon-16x16.png',         sizes: '16x16',   type: 'image/png' },
    { src: '/icons/favicon-32x32.png',         sizes: '32x32',   type: 'image/png' },
    { src: '/icons/icon-192x192.png',          sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512x512.png',          sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icons/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ];
  const m = {
    name: info.name || '',
    short_name: info.shortName || info.name || '',
    description: info.description || '',
    start_url: info.startUrl || '/',
    scope: info.scope || '/',
    display: info.display || 'standalone',
    orientation: info.orientation || 'any',
    theme_color: info.themeColor || '#000000',
    background_color: info.bgColor || '#ffffff',
    lang: info.lang || 'fr',
    icons,
  };
  if (info.categories?.length) m.categories = info.categories;
  return JSON.stringify(m, null, 2);
}

function generateCodePreview(info) {
  const fw = info.framework || 'html';
  const name = info.name || '';
  const shortName = info.shortName || name;
  const theme = info.themeColor || '#000000';

  const html = `<!-- Copiez ces balises dans votre <head> -->

<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">

<!-- Apple Touch Icons (iOS) -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png">

<!-- Manifest & Meta PWA -->
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="${theme}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${shortName}">

<!-- Service Worker -->
<script>
  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('/sw.js');
</script>`;

  if (fw === 'html' || fw === 'react' || fw === 'vue') return html;

  if (fw === 'nextjs-app') return `// app/layout.js
export const metadata = {
  title: '${name}',
  description: '${info.description || ''}',
  manifest: '/manifest.webmanifest',
  themeColor: '${theme}',
  appleWebApp: { capable: true, title: '${shortName}', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32' },
      { url: '/icons/icon-192x192.png',  sizes: '192x192' },
      { url: '/icons/icon-512x512.png',  sizes: '512x512' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
  },
};`;

  if (fw === 'nextjs-pages') return `// pages/_document.jsx
import { Html, Head, Main, NextScript } from 'next/document';
export default function Document() {
  return (
    <Html lang="${info.lang || 'fr'}">
      <Head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <meta name="theme-color" content="${theme}" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="${shortName}" />
      </Head>
      <body><Main /><NextScript /></body>
    </Html>
  );
}`;

  if (fw === 'nuxt') return `// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { name: 'theme-color', content: '${theme}' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: '${shortName}' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32x32.png' },
      ],
    },
  },
});`;

  if (fw === 'svelte') return `<!-- src/app.html — dans le <head> -->
<link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="%sveltekit.assets%/icons/favicon-32x32.png">
<link rel="apple-touch-icon" href="%sveltekit.assets%/icons/apple-touch-icon.png">
<meta name="theme-color" content="${theme}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${shortName}">`;

  if (fw === 'angular') return `<!-- src/index.html — dans le <head> -->
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32x32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="theme-color" content="${theme}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${shortName}">`;

  return html;
}

export default function PwaPage() {
  const [info, setInfo] = useState({
    name: '',
    shortName: '',
    description: '',
    startUrl: '/',
    scope: '/',
    themeColor: '#000000',
    bgColor: '#ffffff',
    maskableBgColor: '#ffffff',
    display: 'standalone',
    orientation: 'any',
    lang: 'fr',
    categories: [],
    framework: 'html',
  });

  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewTab, setPreviewTab] = useState('icons');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const set = useCallback((key, val) => setInfo((p) => ({ ...p, [key]: val })), []);

  const handleIconFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (PNG, SVG, JPG…)');
      return;
    }
    setError(null);
    setIconFile(file);
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleIconFile(e.dataTransfer.files?.[0]);
  };

  const toggleCategory = (cat) => {
    setInfo((p) => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter((c) => c !== cat)
        : [...p.categories, cat],
    }));
  };

  const handleGenerate = async () => {
    if (!info.name) { setError("Le nom de l'application est requis"); return; }
    if (!iconFile) { setError("L'icône est requise"); return; }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const fd = new FormData();
      fd.append('icon', iconFile);
      fd.append('config', JSON.stringify(info));
      const res = await fetch('/api/pwa', { method: 'POST', body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Erreur ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = info.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      a.download = `${slug}-pwa.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCodePreview(info));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const manifestPreview = generateManifestPreview(info);
  const codePreview = generateCodePreview(info);

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
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Générateur PWA</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Icônes, manifest, service worker, code d&apos;intégration</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── Formulaire ─────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-7">

            {/* 1 — Infos de base */}
            <section>
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] dark:text-[#737373] mb-4">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: ACCENT }}>1</span>
                Informations
              </h2>
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={info.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="Mon Application"
                      className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 transition-shadow"
                      style={{ '--tw-ring-color': ACCENT }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">
                      Nom court <span className="text-[#a3a3a3] text-[10px]">(≤ 12 car.)</span>
                    </label>
                    <input
                      value={info.shortName}
                      onChange={(e) => set('shortName', e.target.value)}
                      maxLength={12}
                      placeholder="MonApp"
                      className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': ACCENT }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">Description</label>
                  <textarea
                    value={info.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={2}
                    placeholder="Décrivez votre application en une phrase…"
                    className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ '--tw-ring-color': ACCENT }}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">URL de démarrage</label>
                    <input
                      value={info.startUrl}
                      onChange={(e) => set('startUrl', e.target.value)}
                      placeholder="/"
                      className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 font-mono"
                      style={{ '--tw-ring-color': ACCENT }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">Scope</label>
                    <input
                      value={info.scope}
                      onChange={(e) => set('scope', e.target.value)}
                      placeholder="/"
                      className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 font-mono"
                      style={{ '--tw-ring-color': ACCENT }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">Langue</label>
                  <select
                    value={info.lang}
                    onChange={(e) => set('lang', e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': ACCENT }}
                  >
                    <option value="fr">Français (fr)</option>
                    <option value="en">English (en)</option>
                    <option value="es">Español (es)</option>
                    <option value="de">Deutsch (de)</option>
                    <option value="it">Italiano (it)</option>
                    <option value="pt">Português (pt)</option>
                    <option value="ja">日本語 (ja)</option>
                    <option value="zh">中文 (zh)</option>
                    <option value="ar">العربية (ar)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 2 — Apparence */}
            <section>
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] dark:text-[#737373] mb-4">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: ACCENT }}>2</span>
                Apparence
              </h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">Couleur thème</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={info.themeColor}
                        onChange={(e) => set('themeColor', e.target.value)}
                        className="h-10 w-12 border border-[#e5e5e5] dark:border-[#262626] rounded-lg cursor-pointer p-1"
                      />
                      <input
                        value={info.themeColor}
                        onChange={(e) => set('themeColor', e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm font-mono focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': ACCENT }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">Couleur fond (splash)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={info.bgColor}
                        onChange={(e) => set('bgColor', e.target.value)}
                        className="h-10 w-12 border border-[#e5e5e5] dark:border-[#262626] rounded-lg cursor-pointer p-1"
                      />
                      <input
                        value={info.bgColor}
                        onChange={(e) => set('bgColor', e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm font-mono focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': ACCENT }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-2">Mode d&apos;affichage</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DISPLAY_MODES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => set('display', m.value)}
                        style={info.display === m.value ? { borderColor: ACCENT, backgroundColor: ACCENT + '15' } : {}}
                        className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                          info.display === m.value
                            ? 'text-[#171717] dark:text-[#ededed]'
                            : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#404040]'
                        }`}
                      >
                        <span className="block font-medium text-xs">{m.label}</span>
                        <span className="text-[10px] text-[#a3a3a3]">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-2">Orientation</label>
                  <div className="flex flex-wrap gap-2">
                    {ORIENTATIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => set('orientation', o.value)}
                        style={info.orientation === o.value ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          info.orientation === o.value ? 'text-white' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 3 — Icône */}
            <section>
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] dark:text-[#737373] mb-4">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: ACCENT }}>3</span>
                Icône source <span className="text-[#a3a3a3] font-normal text-[10px]">PNG/SVG — min. 512×512 recommandé</span>
              </h2>
              <div className="space-y-3">
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  style={dragging ? { borderColor: ACCENT } : {}}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors bg-white dark:bg-[#171717] ${
                    dragging ? '' : 'border-[#e5e5e5] dark:border-[#262626] hover:border-[#a3a3a3] dark:hover:border-[#525252]'
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleIconFile(e.target.files?.[0])} />
                  {iconPreview ? (
                    <div className="flex items-center gap-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={iconPreview} alt="Icône" className="w-20 h-20 rounded-2xl object-contain border border-[#e5e5e5] dark:border-[#262626] shrink-0" style={{ backgroundColor: info.bgColor }} />
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-[#171717] dark:text-[#ededed] truncate">{iconFile?.name}</p>
                        <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                          {iconFile?.size ? (iconFile.size / 1024).toFixed(1) + ' Ko' : ''} · Cliquez pour changer
                        </p>
                        <p className="text-[10px] text-[#a3a3a3] mt-1">27 tailles seront générées automatiquement</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#737373] dark:text-[#a3a3a3]">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">Cliquez ou glissez votre icône</p>
                      <p className="text-xs mt-1 text-[#a3a3a3]">PNG, SVG, JPG — de préférence 512×512 ou plus</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">
                    Fond icône maskable (Android adaptatif)
                    <span className="ml-1 text-[10px] text-[#a3a3a3]">— zone de sécurité 80%</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={info.maskableBgColor}
                      onChange={(e) => set('maskableBgColor', e.target.value)}
                      className="h-10 w-12 border border-[#e5e5e5] dark:border-[#262626] rounded-lg cursor-pointer p-1"
                    />
                    <input
                      value={info.maskableBgColor}
                      onChange={(e) => set('maskableBgColor', e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm font-mono focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': ACCENT }}
                    />
                    <div className="w-10 h-10 rounded-full shrink-0 border border-[#e5e5e5] dark:border-[#262626] overflow-hidden flex items-center justify-center" style={{ backgroundColor: info.maskableBgColor }}>
                      {iconPreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={iconPreview} alt="" className="w-8 h-8 object-contain" style={{ width: '80%', height: '80%' }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4 — Catégories */}
            <section>
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] dark:text-[#737373] mb-4">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: ACCENT }}>4</span>
                Catégories <span className="text-[#a3a3a3] font-normal text-[10px]">— optionnel</span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    style={info.categories.includes(cat) ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
                    className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                      info.categories.includes(cat) ? 'text-white' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#a3a3a3]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* 5 — Framework */}
            <section>
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] dark:text-[#737373] mb-4">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: ACCENT }}>5</span>
                Framework cible
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {FRAMEWORKS.map((fw) => (
                  <button
                    key={fw.value}
                    onClick={() => set('framework', fw.value)}
                    style={info.framework === fw.value ? { borderColor: ACCENT, backgroundColor: ACCENT + '15' } : {}}
                    className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      info.framework === fw.value
                        ? 'text-[#171717] dark:text-[#ededed]'
                        : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#a3a3a3]'
                    }`}
                  >
                    <span className="font-medium text-xs">{fw.label}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-[#a3a3a3] mt-0.5"><ArrowRight className="w-2.5 h-2.5" /> integration.{fw.ext}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Erreur / Succès */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{error}</div>
            )}
            {success && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                <span className="flex items-center gap-1"><Check className="w-4 h-4" /> ZIP généré et téléchargé — 27 icônes + manifest + service worker + code d&apos;intégration.</span>
              </div>
            )}

            {/* Bouton Générer */}
            <button
              onClick={handleGenerate}
              disabled={loading || !info.name || !iconFile}
              style={{ backgroundColor: ACCENT }}
              className="w-full py-3.5 px-6 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Génération en cours…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Générer et télécharger le ZIP
                </span>
              )}
            </button>

            {/* Contenu du ZIP */}
            <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-4">
              <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-3">Contenu du ZIP généré</p>
              <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                {[
                  ['icons/favicon-16x16.png', 'icons/favicon-32x32.png', 'icons/favicon-48x48.png'],
                  ['icons/apple-touch-icon.png', 'icons/apple-touch-icon-*.png', '(10 tailles Apple)'],
                  ['icons/icon-{72-512}.png', '(8 tailles Android)', 'icons/icon-maskable-{192,512}.png'],
                  ['manifest.webmanifest', 'browserconfig.xml', 'sw.js'],
                  ['offline.html', `integration.${FRAMEWORKS.find(f => f.value === info.framework)?.ext || 'html'}`, 'README.md'],
                ].flat().map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-[#525252] dark:text-[#a3a3a3]">
                    <span style={{ color: ACCENT }}>·</span>
                    <code className="font-mono text-[10px]">{item}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Prévisualisation ────────────────────────────── */}
          <div className="lg:col-span-2 self-start sticky top-8 space-y-4">

            {/* Tabs */}
            <div className="flex rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-1 gap-1">
              {['icons', 'manifest', 'code'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPreviewTab(tab)}
                  style={previewTab === tab ? { backgroundColor: ACCENT } : {}}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                    previewTab === tab ? 'text-white' : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed]'
                  }`}
                >
                  {tab === 'icons' ? 'Icônes' : tab === 'manifest' ? 'Manifest' : 'Code'}
                </button>
              ))}
            </div>

            {/* Tab: Icônes */}
            {previewTab === 'icons' && (
              <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-5">
                <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-4">Aperçu des tailles</p>
                {iconPreview ? (
                  <div className="space-y-5">
                    {/* Sizes grid */}
                    <div className="flex flex-wrap items-end gap-3">
                      {PREVIEW_SIZES.map(({ size, label }) => (
                        <div key={size} className="flex flex-col items-center gap-1.5">
                          <div
                            className="rounded-lg border border-[#e5e5e5] dark:border-[#262626] overflow-hidden"
                            style={{ width: Math.min(size, 64), height: Math.min(size, 64), backgroundColor: info.bgColor }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={iconPreview}
                              alt={`${size}px`}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          </div>
                          <span className="text-[9px] text-[#a3a3a3] tabular-nums">{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Maskable preview */}
                    <div>
                      <p className="text-[10px] text-[#a3a3a3] uppercase tracking-wider mb-2">Maskable (Android adaptatif)</p>
                      <div className="flex items-center gap-3">
                        {[64, 48].map((s) => (
                          <div key={s} className="flex flex-col items-center gap-1">
                            <div
                              className="rounded-full border border-[#e5e5e5] dark:border-[#262626] overflow-hidden flex items-center justify-center"
                              style={{ width: s, height: s, backgroundColor: info.maskableBgColor }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={iconPreview}
                                alt="maskable"
                                style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                              />
                            </div>
                            <span className="text-[9px] text-[#a3a3a3]">{s === 64 ? '512' : '192'}</span>
                          </div>
                        ))}
                        <p className="text-xs text-[#a3a3a3] flex-1">Zone de sécurité à 80% — icône visible même avec masques circulaires ou arrondis</p>
                      </div>
                    </div>

                    {/* Device mockups */}
                    <div>
                      <p className="text-[10px] text-[#a3a3a3] uppercase tracking-wider mb-3">Aperçu écran d&apos;accueil</p>
                      <div className="flex gap-4">
                        {/* iOS */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-12 h-12 rounded-[13px] overflow-hidden border border-[#e5e5e5] dark:border-[#262626] shadow-sm" style={{ backgroundColor: info.bgColor }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={iconPreview} alt="" className="w-full h-full object-contain" />
                          </div>
                          <span className="text-[9px] text-center text-[#a3a3a3] max-w-[52px] truncate">{info.shortName || info.name || 'App'}</span>
                          <span className="text-[8px] text-[#c3c3c3]">iOS</span>
                        </div>
                        {/* Android */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#e5e5e5] dark:border-[#262626] shadow-sm flex items-center justify-center" style={{ backgroundColor: info.maskableBgColor }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={iconPreview} alt="" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                          </div>
                          <span className="text-[9px] text-center text-[#a3a3a3] max-w-[52px] truncate">{info.shortName || info.name || 'App'}</span>
                          <span className="text-[8px] text-[#c3c3c3]">Android</span>
                        </div>
                        {/* Desktop */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#e5e5e5] dark:border-[#262626] shadow-sm" style={{ backgroundColor: info.bgColor }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={iconPreview} alt="" className="w-full h-full object-contain" />
                          </div>
                          <span className="text-[9px] text-center text-[#a3a3a3] max-w-[52px] truncate">{info.shortName || info.name || 'App'}</span>
                          <span className="text-[8px] text-[#c3c3c3]">Desktop</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#a3a3a3] dark:text-[#525252]">
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs">Importez une icône pour voir l&apos;aperçu</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Manifest */}
            {previewTab === 'manifest' && (
              <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626] flex items-center justify-between">
                  <p className="text-xs font-medium text-[#171717] dark:text-[#ededed]">manifest.webmanifest</p>
                  <span className="text-[10px] text-[#a3a3a3]">Mis à jour en temps réel</span>
                </div>
                <pre className="p-4 text-[10px] font-mono text-[#525252] dark:text-[#a3a3a3] overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap">{manifestPreview}</pre>
              </div>
            )}

            {/* Tab: Code */}
            {previewTab === 'code' && (
              <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626] flex items-center justify-between">
                  <p className="text-xs font-medium text-[#171717] dark:text-[#ededed]">
                    integration.{FRAMEWORKS.find(f => f.value === info.framework)?.ext || 'html'}
                  </p>
                  <button
                    onClick={copyCode}
                    className="text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors"
                  >
                    {copied ? <span className="flex items-center gap-1"><Check className="w-3 h-3" />Copié</span> : 'Copier'}
                  </button>
                </div>
                <pre className="p-4 text-[10px] font-mono text-[#525252] dark:text-[#a3a3a3] overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap">{codePreview}</pre>
              </div>
            )}

            {/* Checklist PWA */}
            <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-4">
              <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-3">Checklist PWA</p>
              <ul className="space-y-2">
                {[
                  { ok: !!info.name,          label: 'Nom de l\'application' },
                  { ok: !!info.description,   label: 'Description' },
                  { ok: !!iconFile,           label: 'Icône source importée' },
                  { ok: !!info.themeColor,    label: 'Couleur thème définie' },
                  { ok: !!info.startUrl,      label: 'URL de démarrage' },
                  { ok: !!info.framework,     label: 'Framework sélectionné' },
                ].map(({ ok, label }) => (
                  <li key={label} className="flex items-center gap-2 text-xs">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${ok ? 'text-white' : 'border border-[#e5e5e5] dark:border-[#404040] text-[#a3a3a3]'}`}
                      style={ok ? { backgroundColor: ACCENT } : {}}
                    >
                      {ok ? <Check className="w-2.5 h-2.5" /> : null}
                    </span>
                    <span className={ok ? 'text-[#171717] dark:text-[#ededed]' : 'text-[#a3a3a3]'}>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
