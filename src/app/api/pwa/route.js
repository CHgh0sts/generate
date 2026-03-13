import { NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 255, g: 255, b: 255 };
}

async function makeIcon(src, size, bgColor) {
  const bg = hexToRgb(bgColor || '#ffffff');
  const inner = await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { ...bg, alpha: 1 } } })
    .composite([{ input: inner, blend: 'over' }])
    .png()
    .toBuffer();
}

async function makeMaskableIcon(src, size, bgColor) {
  const padding = Math.round(size * 0.1);
  const innerSize = size - 2 * padding;
  const bg = hexToRgb(bgColor || '#ffffff');
  const inner = await sharp(src)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { ...bg, alpha: 1 } } })
    .composite([{ input: inner, top: padding, left: padding }])
    .png()
    .toBuffer();
}

function generateManifest(cfg) {
  const icons = [
    { src: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    { src: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
    { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
    { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
    { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
    { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-256x256.png', sizes: '256x256', type: 'image/png' },
    { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
    { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icons/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ];
  const manifest = {
    name: cfg.name || '',
    short_name: cfg.shortName || cfg.name || '',
    description: cfg.description || '',
    start_url: cfg.startUrl || '/',
    scope: cfg.scope || '/',
    display: cfg.display || 'standalone',
    orientation: cfg.orientation || 'any',
    theme_color: cfg.themeColor || '#000000',
    background_color: cfg.bgColor || '#ffffff',
    lang: cfg.lang || 'fr',
    icons,
  };
  if (cfg.categories?.length) manifest.categories = cfg.categories;
  return manifest;
}

function generateBrowserConfig(cfg) {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/icons/icon-72x72.png"/>
      <square150x150logo src="/icons/icon-144x144.png"/>
      <square310x310logo src="/icons/icon-256x256.png"/>
      <TileColor>${cfg.themeColor || '#000000'}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
}

function generateServiceWorker(cfg) {
  const name = cfg.name || 'app';
  return `// Service Worker — ${name}
const CACHE_NAME = '${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-v1';

const PRECACHE = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match('/offline.html'));
      return cached || network;
    })
  );
});
`;
}

function generateOfflinePage(cfg) {
  const name = cfg.name || 'App';
  const theme = cfg.themeColor || '#000000';
  const bg = cfg.bgColor || '#ffffff';
  return `<!DOCTYPE html>
<html lang="${cfg.lang || 'fr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hors ligne — ${name}</title>
  <meta name="theme-color" content="${theme}">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: ${bg}; color: #333;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; padding: 2rem; text-align: center; }
    .icon { width: 80px; height: 80px; background: ${theme}; border-radius: 20px;
            margin: 0 auto 1.5rem; display: flex; align-items: center;
            justify-content: center; font-size: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #666; margin-bottom: 1.5rem; }
    button { background: ${theme}; color: white; border: none; padding: 0.75rem 1.5rem;
             border-radius: 8px; font-size: 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <div>
    <div class="icon">📡</div>
    <h1>Vous êtes hors ligne</h1>
    <p>Vérifiez votre connexion internet puis réessayez.</p>
    <button onclick="window.location.reload()">Réessayer</button>
  </div>
</body>
</html>`;
}

function generateCodeSnippet(cfg) {
  const fw = cfg.framework || 'html';
  const name = cfg.name || '';
  const shortName = cfg.shortName || name;
  const theme = cfg.themeColor || '#000000';

  const htmlTags = `<!-- ========================================
   PWA — ${name}
   Copiez ces lignes dans votre <head>
   ======================================== -->

<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">
<link rel="shortcut icon" href="/icons/favicon-32x32.png">

<!-- Apple Touch Icons (iOS / iPadOS) -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="57x57"  href="/icons/apple-touch-icon-57x57.png">
<link rel="apple-touch-icon" sizes="60x60"  href="/icons/apple-touch-icon-60x60.png">
<link rel="apple-touch-icon" sizes="72x72"  href="/icons/apple-touch-icon-72x72.png">
<link rel="apple-touch-icon" sizes="76x76"  href="/icons/apple-touch-icon-76x76.png">
<link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-touch-icon-114x114.png">
<link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png">
<link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-touch-icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.webmanifest">

<!-- PWA Meta -->
<meta name="application-name" content="${name}">
<meta name="theme-color" content="${theme}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${shortName}">

<!-- Microsoft Tiles -->
<meta name="msapplication-TileColor" content="${theme}">
<meta name="msapplication-TileImage" content="/icons/icon-144x144.png">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Enregistrement du Service Worker -->
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
</script>`;

  if (fw === 'html' || fw === 'react' || fw === 'vue') return htmlTags;

  if (fw === 'nextjs-app') {
    return `// app/layout.js  (ou layout.tsx)
// Ajoutez ou fusionnez cet objet metadata dans votre layout racine

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${name}',
  description: '${cfg.description || ''}',
  manifest: '/manifest.webmanifest',
  themeColor: '${theme}',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '${shortName}',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png',  sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png',  sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/icons/apple-touch-icon-167x167.png', sizes: '167x167' },
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/icon-maskable-512x512.png', color: '${theme}' },
    ],
  },
  openGraph: {
    title: '${name}',
    description: '${cfg.description || ''}',
  },
};

// Copiez les fichiers du dossier icons/ dans votre dossier public/icons/
// Copiez manifest.webmanifest, sw.js et offline.html dans public/

// Ajoutez aussi dans votre layout.js le script d'enregistrement du SW :
// <Script strategy="afterInteractive">
//   {if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')}
// </Script>`;
  }

  if (fw === 'nextjs-pages') {
    return `// pages/_document.js  (ou _document.tsx)
// Ajoutez les balises PWA dans le <Head>

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="${cfg.lang || 'fr'}">
      <Head>
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* PWA Meta */}
        <meta name="application-name" content="${name}" />
        <meta name="theme-color" content="${theme}" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="${shortName}" />
        <meta name="msapplication-TileColor" content="${theme}" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// Copiez les fichiers du dossier icons/ dans votre dossier public/icons/
// Copiez manifest.webmanifest, sw.js et offline.html dans public/

// Enregistrement du SW dans pages/_app.js :
// useEffect(() => {
//   if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
// }, []);`;
  }

  if (fw === 'nuxt') {
    return `// nuxt.config.ts
// Ajoutez ou fusionnez cette configuration

export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: { lang: '${cfg.lang || 'fr'}' },
      title: '${name}',
      meta: [
        { name: 'description', content: '${cfg.description || ''}' },
        { name: 'theme-color', content: '${theme}' },
        { name: 'application-name', content: '${name}' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: '${shortName}' },
        { name: 'msapplication-TileColor', content: '${theme}' },
        { name: 'msapplication-TileImage', content: '/icons/icon-144x144.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icons/favicon-16x16.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/icons/apple-touch-icon-152x152.png' },
        { rel: 'apple-touch-icon', sizes: '167x167', href: '/icons/apple-touch-icon-167x167.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      script: [
        {
          innerHTML: \`if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }\`,
        },
      ],
    },
  },
});

// Copiez les fichiers du dossier icons/ dans votre dossier public/icons/
// Copiez manifest.webmanifest, sw.js et offline.html dans public/`;
  }

  if (fw === 'svelte') {
    return `<!-- src/app.html -->
<!-- Ajoutez ces balises dans le <head> -->

<link rel="icon" type="image/png" sizes="32x32" href="%sveltekit.assets%/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="%sveltekit.assets%/icons/favicon-16x16.png">

<link rel="apple-touch-icon" href="%sveltekit.assets%/icons/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="152x152" href="%sveltekit.assets%/icons/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="167x167" href="%sveltekit.assets%/icons/apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="180x180" href="%sveltekit.assets%/icons/apple-touch-icon.png">

<link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest">

<meta name="application-name" content="${name}">
<meta name="theme-color" content="${theme}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${shortName}">
<meta name="msapplication-TileColor" content="${theme}">
<meta name="msapplication-TileImage" content="%sveltekit.assets%/icons/icon-144x144.png">
<meta name="msapplication-config" content="%sveltekit.assets%/browserconfig.xml">

<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
</script>

<!-- Copiez les fichiers du dossier icons/ dans votre dossier static/icons/ -->
<!-- Copiez manifest.webmanifest, sw.js et offline.html dans static/ -->`;
  }

  if (fw === 'angular') {
    return `// angular.json — ajoutez les assets dans le tableau "assets"
// puis modifiez src/index.html

// 1. Dans angular.json > projects > architect > build > options > assets :
// { "glob": "**/*", "input": "src/icons", "output": "/icons" },
// { "glob": "manifest.webmanifest", "input": "src", "output": "/" },
// { "glob": "sw.js", "input": "src", "output": "/" },
// { "glob": "offline.html", "input": "src", "output": "/" }

// 2. Dans src/index.html <head> :
/*
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="icons/favicon-16x16.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="${theme}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${shortName}">
<meta name="msapplication-TileColor" content="${theme}">
<meta name="msapplication-config" content="browserconfig.xml">
*/

// 3. Dans src/app/app.component.ts ou main.ts :
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

// Copiez les fichiers du dossier icons/ dans src/icons/
// Copiez manifest.webmanifest, sw.js et offline.html dans src/`;
  }

  return htmlTags;
}

function generateReadme(cfg) {
  const name = cfg.name || 'Mon App';
  return `# PWA Assets — ${name}

Généré avec Generate PWA Tool le ${new Date().toLocaleDateString('fr-FR')}.

## Contenu du ZIP

\`\`\`
icons/
  favicon-16x16.png        Favicon navigateur
  favicon-32x32.png        Favicon navigateur HD
  apple-touch-icon.png     Icône iOS principale (180×180)
  apple-touch-icon-*.png   Icônes iOS toutes tailles
  icon-*.png               Icônes Android/Chrome
  icon-maskable-*.png      Icônes adaptatives Android
manifest.webmanifest       Manifeste PWA
browserconfig.xml          Configuration Microsoft
sw.js                      Service Worker (cache offline)
offline.html               Page hors ligne
integration.*              Code d'intégration (${cfg.framework || 'html'})
README.md                  Ce fichier
\`\`\`

## Installation

### 1. Copier les fichiers

Placez les fichiers dans votre dossier **public/** (ou équivalent) :
- \`icons/\` → \`public/icons/\`
- \`manifest.webmanifest\` → \`public/manifest.webmanifest\`
- \`sw.js\` → \`public/sw.js\`
- \`offline.html\` → \`public/offline.html\`
- \`browserconfig.xml\` → \`public/browserconfig.xml\`

### 2. Intégrer le code

Ouvrez le fichier \`integration.*\` et suivez les instructions pour votre framework.

### 3. Tester

- Chrome DevTools → Application → Manifest (vérifiez que tout est détecté)
- Lighthouse → PWA audit (objectif 100%)
- Sur mobile : menu navigateur → "Ajouter à l'écran d'accueil"

## Vérification

✅ Manifest valide et détecté  
✅ Service Worker enregistré  
✅ Icônes 192×192 et 512×512 présentes  
✅ Icône maskable disponible  
✅ theme-color défini  
✅ HTTPS requis en production  
`;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const iconFile = formData.get('icon');
    const configStr = formData.get('config');

    if (!iconFile || !(iconFile instanceof Blob)) {
      return NextResponse.json({ error: 'Icône manquante' }, { status: 400 });
    }

    const cfg = JSON.parse(configStr || '{}');
    const iconBuffer = Buffer.from(await iconFile.arrayBuffer());
    const maskBg = cfg.maskableBgColor || cfg.bgColor || '#ffffff';
    const iconBg = cfg.bgColor || '#ffffff';

    const zip = new JSZip();
    const icons = zip.folder('icons');

    // Favicons
    icons.file('favicon-16x16.png', await makeIcon(iconBuffer, 16, iconBg));
    icons.file('favicon-32x32.png', await makeIcon(iconBuffer, 32, iconBg));
    icons.file('favicon-48x48.png', await makeIcon(iconBuffer, 48, iconBg));

    // Apple touch icons
    for (const size of [57, 60, 72, 76, 114, 120, 144, 152, 167, 180]) {
      const name = size === 180 ? 'apple-touch-icon.png' : `apple-touch-icon-${size}x${size}.png`;
      icons.file(name, await makeIcon(iconBuffer, size, iconBg));
    }

    // Standard icons
    for (const size of [72, 96, 128, 144, 152, 192, 256, 384, 512]) {
      icons.file(`icon-${size}x${size}.png`, await makeIcon(iconBuffer, size, iconBg));
    }

    // Maskable icons
    icons.file('icon-maskable-192x192.png', await makeMaskableIcon(iconBuffer, 192, maskBg));
    icons.file('icon-maskable-512x512.png', await makeMaskableIcon(iconBuffer, 512, maskBg));

    // Manifest
    zip.file('manifest.webmanifest', JSON.stringify(generateManifest(cfg), null, 2));

    // Browser config
    zip.file('browserconfig.xml', generateBrowserConfig(cfg));

    // Service Worker
    zip.file('sw.js', generateServiceWorker(cfg));

    // Offline page
    zip.file('offline.html', generateOfflinePage(cfg));

    // README
    zip.file('README.md', generateReadme(cfg));

    // Code snippet
    const snippet = generateCodeSnippet(cfg);
    const extMap = {
      html: 'html', react: 'html', vue: 'html', svelte: 'html',
      'nextjs-app': 'js', 'nextjs-pages': 'jsx',
      nuxt: 'ts', angular: 'js',
    };
    const ext = extMap[cfg.framework] || 'html';
    zip.file(`integration.${ext}`, snippet);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const appSlug = (cfg.name || 'app').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${appSlug}-pwa.zip"`,
        'X-Icon-Count': '27',
      },
    });
  } catch (err) {
    console.error('Erreur génération PWA:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors de la génération' }, { status: 500 });
  }
}
