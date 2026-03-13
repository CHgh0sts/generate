import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const maxDuration = 60;

// ── Scoring helpers ────────────────────────────────────────────
function scorePerformance(t, weight, requests) {
  let s = 0;
  if (t.ttfb < 200) s += 15; else if (t.ttfb < 400) s += 10; else if (t.ttfb < 800) s += 5;
  if (t.fcp < 1800) s += 20; else if (t.fcp < 3000) s += 10; else if (t.fcp < 5000) s += 3;
  if (t.lcp < 2500) s += 25; else if (t.lcp < 4000) s += 12; else if (t.lcp < 6000) s += 4;
  if (t.load < 3000) s += 20; else if (t.load < 6000) s += 10; else if (t.load < 10000) s += 4;
  if (weight < 512000) s += 12; else if (weight < 1500000) s += 7; else if (weight < 3000000) s += 3;
  if (requests < 40) s += 8; else if (requests < 80) s += 4;
  return Math.min(100, s);
}

function scoreSEO(seo) {
  let s = 0;
  if (seo.title) { s += 10; if (seo.title.length >= 30 && seo.title.length <= 60) s += 8; else s += 3; }
  if (seo.description) { s += 15; if (seo.description.length >= 70 && seo.description.length <= 160) s += 5; }
  if (seo.h1Count === 1) s += 10; else if (seo.h1Count > 1) s += 4;
  if (seo.hasViewport) s += 10;
  if (seo.lang) s += 8;
  if (seo.hasCanonical) s += 7;
  if (seo.ogTitle) s += 7;
  if (seo.ogDescription) s += 5;
  if (seo.ogImage) s += 5;
  if (seo.hasTwitterCard) s += 5;
  if (seo.hasStructuredData) s += 5;
  return Math.min(100, s);
}

function scoreAccessibility(a11y) {
  let s = 0;
  if (a11y.lang) s += 15;
  if (a11y.hasViewport) s += 15;
  const imgRatio = a11y.totalImages > 0 ? a11y.imagesWithAlt / a11y.totalImages : 1;
  s += Math.round(imgRatio * 30);
  if (a11y.h1Count === 1) s += 10;
  if (a11y.headingOrder) s += 15;
  if (a11y.formLabels) s += 15;
  return Math.min(100, s);
}

function scoreBestPractices(bp, resources) {
  let s = 0;
  if (bp.https) s += 25;
  if (bp.hasFavicon) s += 8;
  const imgWithDims = resources.images.filter(i => i.hasDimensions).length;
  const imgTotal = resources.images.length;
  if (imgTotal > 0) s += Math.round((imgWithDims / imgTotal) * 15);
  else s += 15;
  const syncScripts = resources.scripts.filter(sc => !sc.async && !sc.defer && !sc.inline).length;
  if (syncScripts === 0) s += 20; else if (syncScripts <= 2) s += 12; else if (syncScripts <= 5) s += 6;
  if (bp.noMixedContent) s += 12;
  const nextGenImages = resources.images.filter(i => i.isNextGen).length;
  if (imgTotal > 0) s += Math.round((nextGenImages / imgTotal) * 15);
  else s += 15;
  return Math.min(100, s);
}

function scoreColor(score) {
  if (score >= 90) return 'green';
  if (score >= 50) return 'orange';
  return 'red';
}

function categorizeResource(mimeType, url) {
  if (!mimeType) mimeType = '';
  if (mimeType.includes('html')) return 'html';
  if (mimeType.includes('css')) return 'css';
  if (mimeType.includes('javascript') || mimeType.includes('ecmascript')) return 'js';
  if (mimeType.includes('image/')) return 'image';
  if (mimeType.includes('font') || url.match(/\.(woff2?|ttf|eot|otf)(\?|$)/i)) return 'font';
  if (mimeType.includes('json') || mimeType.includes('xml')) return 'data';
  return 'other';
}

function formatBytes(b) {
  if (!b) return '0 o';
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`;
  return `${(b / (1024 * 1024)).toFixed(2)} Mo`;
}

// ── Main handler ───────────────────────────────────────────────
export async function POST(req) {
  let browser;
  try {
    const { url: rawUrl } = await req.json();
    if (!rawUrl) return NextResponse.json({ error: 'URL requise' }, { status: 400 });

    let url = rawUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

    try { new URL(url); } catch {
      return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' });

    // ── CDP: track all network resources ──
    const client = await page.createCDPSession();
    await client.send('Network.enable');

    const rawResources = {};
    client.on('Network.requestWillBeSent', ({ requestId, request, type }) => {
      rawResources[requestId] = { url: request.url, type: (type || 'other').toLowerCase(), size: 0, status: 0, mimeType: '', fromCache: false, duration: 0, _start: Date.now() };
    });
    client.on('Network.responseReceived', ({ requestId, response }) => {
      if (rawResources[requestId]) {
        rawResources[requestId].status = response.status;
        rawResources[requestId].mimeType = response.mimeType || '';
        rawResources[requestId].fromCache = !!(response.fromDiskCache || response.fromServiceWorker);
        rawResources[requestId].headers = response.headers || {};
      }
    });
    client.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => {
      if (rawResources[requestId]) {
        rawResources[requestId].size = encodedDataLength || 0;
        rawResources[requestId].duration = Date.now() - rawResources[requestId]._start;
      }
    });

    // ── Navigate ──
    const navStart = Date.now();
    let navError = null;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
      navError = e.message;
    }
    const navEnd = Date.now();

    if (navError && !Object.keys(rawResources).length) {
      await browser.close();
      return NextResponse.json({ error: `Impossible d'accéder à ${url} : ${navError}` }, { status: 400 });
    }

    // Wait a bit more for web vitals observers
    await new Promise(r => setTimeout(r, 1200));

    // ── Timing ──
    const timing = await page.evaluate(() => {
      const t = performance.timing;
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(e => e.name === 'first-contentful-paint')?.startTime || 0;
      return {
        dns: Math.max(0, t.domainLookupEnd - t.domainLookupStart),
        tcp: Math.max(0, t.connectEnd - t.connectStart),
        ssl: t.secureConnectionStart > 0 ? Math.max(0, t.connectEnd - t.secureConnectionStart) : 0,
        ttfb: Math.max(0, t.responseStart - t.requestStart),
        response: Math.max(0, t.responseEnd - t.responseStart),
        domParsing: Math.max(0, t.domInteractive - t.domLoading),
        domContentLoaded: Math.max(0, t.domContentLoadedEventEnd - t.navigationStart),
        load: Math.max(0, t.loadEventEnd - t.navigationStart),
        fcp: Math.round(fcp),
      };
    }).catch(() => ({ dns: 0, tcp: 0, ssl: 0, ttfb: 0, response: 0, domParsing: 0, domContentLoaded: 0, load: navEnd - navStart, fcp: 0 }));

    // ── LCP & CLS via PerformanceObserver ──
    const { lcp, cls } = await page.evaluate(() => {
      return new Promise(resolve => {
        let lcpVal = 0, clsVal = 0;
        try {
          new PerformanceObserver(list => {
            list.getEntries().forEach(e => { lcpVal = Math.max(lcpVal, e.startTime); });
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch {}
        try {
          new PerformanceObserver(list => {
            list.getEntries().forEach(e => { if (!e.hadRecentInput) clsVal += e.value; });
          }).observe({ type: 'layout-shift', buffered: true });
        } catch {}
        setTimeout(() => resolve({ lcp: Math.round(lcpVal), cls: Math.round(clsVal * 1000) / 1000 }), 600);
      });
    }).catch(() => ({ lcp: 0, cls: 0 }));

    timing.lcp = lcp;
    timing.cls = cls;

    // ── DOM / SEO / Content analysis ──
    const analysis = await page.evaluate((pageUrl) => {
      const doc = document;
      const imgs = Array.from(doc.querySelectorAll('img'));
      const anchors = Array.from(doc.querySelectorAll('a[href]'));
      const scripts = Array.from(doc.querySelectorAll('script'));
      const stylesheets = doc.querySelectorAll('link[rel="stylesheet"]');
      const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'));

      // Check heading order
      let prevLevel = 0, headingOrderOk = true;
      for (const h of headings) {
        const level = parseInt(h.tagName[1]);
        if (level > prevLevel + 1 && prevLevel !== 0) { headingOrderOk = false; break; }
        prevLevel = level;
      }

      // Check form labels
      const inputs = Array.from(doc.querySelectorAll('input:not([type="hidden"]), select, textarea'));
      const formLabelsOk = inputs.every(inp => {
        const id = inp.id;
        return inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby') || (id && doc.querySelector(`label[for="${id}"]`));
      });

      return {
        url: pageUrl,
        finalUrl: window.location.href,
        title: doc.title || '',
        description: doc.querySelector('meta[name="description"]')?.content || '',
        h1Count: doc.querySelectorAll('h1').length,
        h1Text: doc.querySelector('h1')?.textContent?.trim().slice(0, 80) || '',
        h2Count: doc.querySelectorAll('h2').length,
        h3Count: doc.querySelectorAll('h3').length,
        hasViewport: !!doc.querySelector('meta[name="viewport"]'),
        viewportContent: doc.querySelector('meta[name="viewport"]')?.content || '',
        hasCanonical: !!doc.querySelector('link[rel="canonical"]'),
        canonicalUrl: doc.querySelector('link[rel="canonical"]')?.href || '',
        hasRobots: !!doc.querySelector('meta[name="robots"]'),
        robots: doc.querySelector('meta[name="robots"]')?.content || '',
        lang: doc.documentElement.lang || '',
        charset: doc.characterSet || '',
        ogTitle: doc.querySelector('meta[property="og:title"]')?.content || '',
        ogDescription: doc.querySelector('meta[property="og:description"]')?.content || '',
        ogImage: doc.querySelector('meta[property="og:image"]')?.content || '',
        ogType: doc.querySelector('meta[property="og:type"]')?.content || '',
        hasTwitterCard: !!doc.querySelector('meta[name="twitter:card"]'),
        twitterCard: doc.querySelector('meta[name="twitter:card"]')?.content || '',
        hasStructuredData: !!doc.querySelector('script[type="application/ld+json"]'),
        hasFavicon: !!doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]'),
        hasManifest: !!doc.querySelector('link[rel="manifest"]'),
        domNodes: doc.querySelectorAll('*').length,
        htmlLength: doc.documentElement.outerHTML.length,
        headingOrderOk,
        formLabelsOk: inputs.length === 0 || formLabelsOk,
        images: imgs.slice(0, 30).map(img => ({
          src: img.src ? img.src.substring(0, 120) : '',
          alt: img.alt,
          hasAlt: img.hasAttribute('alt'),
          altEmpty: img.alt === '',
          width: img.naturalWidth,
          height: img.naturalHeight,
          loading: img.loading,
          hasDimensions: img.hasAttribute('width') && img.hasAttribute('height'),
          isNextGen: img.src.match(/\.(webp|avif)(\?|$)/i) != null || img.currentSrc?.match(/\.(webp|avif)(\?|$)/i) != null,
        })),
        totalImages: imgs.length,
        internalLinks: anchors.filter(a => a.href.startsWith(window.location.origin)).length,
        externalLinks: anchors.filter(a => !a.href.startsWith(window.location.origin) && a.href.startsWith('http')).length,
        totalLinks: anchors.length,
        scripts: scripts.map(s => ({
          src: s.src ? s.src.substring(0, 100) : '',
          inline: !s.src,
          async: s.async,
          defer: s.defer,
          type: s.type,
        })).slice(0, 20),
        totalScripts: scripts.length,
        stylesheets: stylesheets.length,
        hasSkipLink: !!doc.querySelector('a[href="#main"], a[href="#content"], a[href^="#skip"]'),
      };
    }, url).catch(() => ({}));

    // ── Build resource summary ──
    const resList = Object.values(rawResources).filter(r => r.url && !r.url.startsWith('data:'));
    const weightByType = { html: 0, css: 0, js: 0, image: 0, font: 0, data: 0, other: 0 };
    const requestsByType = { html: 0, css: 0, js: 0, image: 0, font: 0, data: 0, other: 0 };
    let totalWeight = 0;

    for (const r of resList) {
      const cat = categorizeResource(r.mimeType, r.url);
      weightByType[cat] = (weightByType[cat] || 0) + r.size;
      requestsByType[cat] = (requestsByType[cat] || 0) + 1;
      totalWeight += r.size;
    }

    const topResources = resList
      .sort((a, b) => b.size - a.size)
      .slice(0, 15)
      .map(r => ({
        url: r.url.length > 80 ? r.url.substring(0, 80) + '…' : r.url,
        fullUrl: r.url,
        type: categorizeResource(r.mimeType, r.url),
        size: r.size,
        sizeFormatted: formatBytes(r.size),
        duration: r.duration,
        status: r.status,
        fromCache: r.fromCache,
      }));

    // ── Build scores input data ──
    const seoData = {
      title: analysis.title,
      description: analysis.description,
      h1Count: analysis.h1Count,
      hasViewport: analysis.hasViewport,
      lang: analysis.lang,
      hasCanonical: analysis.hasCanonical,
      ogTitle: analysis.ogTitle,
      ogDescription: analysis.ogDescription,
      ogImage: analysis.ogImage,
      hasTwitterCard: analysis.hasTwitterCard,
      hasStructuredData: analysis.hasStructuredData,
    };

    const a11yData = {
      lang: analysis.lang,
      hasViewport: analysis.hasViewport,
      totalImages: analysis.totalImages,
      imagesWithAlt: (analysis.images || []).filter(i => i.hasAlt && !i.altEmpty).length + Math.max(0, (analysis.totalImages - (analysis.images?.length || 0))),
      h1Count: analysis.h1Count,
      headingOrder: analysis.headingOrderOk,
      formLabels: analysis.formLabelsOk,
    };

    const bpData = {
      https: url.startsWith('https://'),
      hasFavicon: analysis.hasFavicon,
      noMixedContent: !resList.some(r => r.url.startsWith('http://') && url.startsWith('https://')),
    };

    const resourcesForScore = {
      images: (analysis.images || []).map(i => ({ hasDimensions: i.hasDimensions, isNextGen: i.isNextGen })),
      scripts: (analysis.scripts || []).map(s => ({ async: s.async, defer: s.defer, inline: s.inline })),
    };

    const perfScore = scorePerformance(timing, totalWeight, resList.length);
    const seoScore = scoreSEO(seoData);
    const a11yScore = scoreAccessibility(a11yData);
    const bpScore = scoreBestPractices(bpData, resourcesForScore);

    // ── Build issues lists ──
    const seoIssues = [];
    if (!analysis.title) seoIssues.push({ type: 'error', msg: 'Balise <title> manquante' });
    else if (analysis.title.length < 30) seoIssues.push({ type: 'warn', msg: `Title trop court (${analysis.title.length} car., min. 30 recommandé)` });
    else if (analysis.title.length > 60) seoIssues.push({ type: 'warn', msg: `Title trop long (${analysis.title.length} car., max. 60 recommandé)` });
    else seoIssues.push({ type: 'ok', msg: `Title correct (${analysis.title.length} car.)` });
    if (!analysis.description) seoIssues.push({ type: 'error', msg: 'Meta description manquante' });
    else if (analysis.description.length < 70) seoIssues.push({ type: 'warn', msg: `Description trop courte (${analysis.description.length} car., min. 70 recommandé)` });
    else if (analysis.description.length > 160) seoIssues.push({ type: 'warn', msg: `Description trop longue (${analysis.description.length} car., max. 160 recommandé)` });
    else seoIssues.push({ type: 'ok', msg: `Description correcte (${analysis.description.length} car.)` });
    if (analysis.h1Count === 0) seoIssues.push({ type: 'error', msg: 'Aucune balise H1 trouvée' });
    else if (analysis.h1Count > 1) seoIssues.push({ type: 'warn', msg: `${analysis.h1Count} balises H1 (une seule recommandée)` });
    else seoIssues.push({ type: 'ok', msg: 'Une seule balise H1' });
    if (!analysis.hasViewport) seoIssues.push({ type: 'error', msg: 'Meta viewport manquante (non-responsive)' });
    else seoIssues.push({ type: 'ok', msg: 'Meta viewport présente' });
    if (!analysis.lang) seoIssues.push({ type: 'warn', msg: 'Attribut lang absent sur <html>' });
    else seoIssues.push({ type: 'ok', msg: `Langue définie (${analysis.lang})` });
    if (!analysis.hasCanonical) seoIssues.push({ type: 'warn', msg: 'Pas de lien canonical' });
    else seoIssues.push({ type: 'ok', msg: 'Lien canonical présent' });
    if (!analysis.ogTitle) seoIssues.push({ type: 'warn', msg: 'Open Graph title manquant' });
    else seoIssues.push({ type: 'ok', msg: 'Open Graph configuré' });
    if (!analysis.hasStructuredData) seoIssues.push({ type: 'info', msg: 'Pas de données structurées (JSON-LD)' });
    else seoIssues.push({ type: 'ok', msg: 'Données structurées présentes (JSON-LD)' });

    const perfIssues = [];
    if (timing.ttfb > 800) perfIssues.push({ type: 'error', msg: `TTFB élevé : ${timing.ttfb}ms (objectif < 800ms)` });
    else if (timing.ttfb > 400) perfIssues.push({ type: 'warn', msg: `TTFB à améliorer : ${timing.ttfb}ms (objectif < 200ms)` });
    else perfIssues.push({ type: 'ok', msg: `TTFB excellent : ${timing.ttfb}ms` });
    if (timing.fcp > 3000) perfIssues.push({ type: 'error', msg: `FCP lent : ${timing.fcp}ms (objectif < 1.8s)` });
    else if (timing.fcp > 1800) perfIssues.push({ type: 'warn', msg: `FCP acceptable : ${timing.fcp}ms (objectif < 1.8s)` });
    else if (timing.fcp > 0) perfIssues.push({ type: 'ok', msg: `FCP bon : ${timing.fcp}ms` });
    if (timing.lcp > 4000) perfIssues.push({ type: 'error', msg: `LCP lent : ${timing.lcp}ms (objectif < 2.5s)` });
    else if (timing.lcp > 2500) perfIssues.push({ type: 'warn', msg: `LCP acceptable : ${timing.lcp}ms (objectif < 2.5s)` });
    else if (timing.lcp > 0) perfIssues.push({ type: 'ok', msg: `LCP bon : ${timing.lcp}ms` });
    const blockingScripts = (analysis.scripts || []).filter(s => !s.async && !s.defer && !s.inline && s.src).length;
    if (blockingScripts > 0) perfIssues.push({ type: 'warn', msg: `${blockingScripts} script(s) bloquant(s) sans async/defer` });
    if (totalWeight > 3000000) perfIssues.push({ type: 'error', msg: `Page très lourde : ${formatBytes(totalWeight)} (objectif < 1.5 Mo)` });
    else if (totalWeight > 1500000) perfIssues.push({ type: 'warn', msg: `Page lourde : ${formatBytes(totalWeight)} (objectif < 1.5 Mo)` });
    else if (totalWeight > 0) perfIssues.push({ type: 'ok', msg: `Poids correct : ${formatBytes(totalWeight)}` });
    if (resList.length > 100) perfIssues.push({ type: 'warn', msg: `${resList.length} requêtes HTTP (objectif < 50)` });
    else if (resList.length > 50) perfIssues.push({ type: 'info', msg: `${resList.length} requêtes HTTP` });
    else perfIssues.push({ type: 'ok', msg: `${resList.length} requêtes HTTP` });
    if (analysis.domNodes > 1500) perfIssues.push({ type: 'warn', msg: `DOM large : ${analysis.domNodes} nœuds (objectif < 1500)` });
    else if (analysis.domNodes > 0) perfIssues.push({ type: 'ok', msg: `DOM raisonnable : ${analysis.domNodes} nœuds` });

    const a11yIssues = [];
    if (!analysis.lang) a11yIssues.push({ type: 'error', msg: 'Attribut lang manquant sur <html>' });
    else a11yIssues.push({ type: 'ok', msg: `Langue définie : ${analysis.lang}` });
    if (!analysis.hasViewport) a11yIssues.push({ type: 'error', msg: 'Meta viewport absente' });
    else a11yIssues.push({ type: 'ok', msg: 'Meta viewport présente' });
    const imgsWithoutAlt = (analysis.images || []).filter(i => !i.hasAlt).length;
    if (imgsWithoutAlt > 0) a11yIssues.push({ type: 'error', msg: `${imgsWithoutAlt} image(s) sans attribut alt` });
    else if (analysis.totalImages > 0) a11yIssues.push({ type: 'ok', msg: `Toutes les images ont un alt (${analysis.totalImages})` });
    if (!analysis.headingOrderOk) a11yIssues.push({ type: 'warn', msg: 'Hiérarchie des titres incorrecte (H1→H2→H3…)' });
    else a11yIssues.push({ type: 'ok', msg: 'Hiérarchie des titres correcte' });
    if (!analysis.formLabelsOk) a11yIssues.push({ type: 'warn', msg: 'Des champs de formulaire n\'ont pas de label associé' });
    else a11yIssues.push({ type: 'ok', msg: 'Labels de formulaire corrects' });
    if (!analysis.hasSkipLink) a11yIssues.push({ type: 'info', msg: 'Pas de lien "Aller au contenu" détecté' });
    else a11yIssues.push({ type: 'ok', msg: 'Lien d\'évitement présent' });

    const securityIssues = [];
    if (!url.startsWith('https://')) securityIssues.push({ type: 'error', msg: 'Site non HTTPS — connexion non sécurisée' });
    else securityIssues.push({ type: 'ok', msg: 'HTTPS activé' });
    if (!analysis.hasManifest) securityIssues.push({ type: 'info', msg: 'Pas de manifest PWA' });
    else securityIssues.push({ type: 'ok', msg: 'Manifest PWA présent' });
    if (!analysis.hasFavicon) securityIssues.push({ type: 'warn', msg: 'Favicon manquant' });
    else securityIssues.push({ type: 'ok', msg: 'Favicon présent' });
    const mixedContent = resList.filter(r => r.url.startsWith('http://') && url.startsWith('https://')).length;
    if (mixedContent > 0) securityIssues.push({ type: 'error', msg: `${mixedContent} ressource(s) en HTTP sur page HTTPS (contenu mixte)` });
    else if (url.startsWith('https://')) securityIssues.push({ type: 'ok', msg: 'Pas de contenu mixte HTTP/HTTPS' });

    const imageIssues = [];
    for (const img of (analysis.images || [])) {
      const issues = [];
      if (!img.hasAlt) issues.push('alt manquant');
      if (!img.hasDimensions) issues.push('width/height absents');
      if (!img.isNextGen) issues.push('pas WebP/AVIF');
      if (img.loading !== 'lazy') issues.push('pas de lazy-loading');
      imageIssues.push({ ...img, issues });
    }

    await browser.close();
    browser = null;

    return NextResponse.json({
      url: analysis.finalUrl || url,
      auditedAt: new Date().toISOString(),
      scores: {
        performance: { value: perfScore, color: scoreColor(perfScore) },
        seo: { value: seoScore, color: scoreColor(seoScore) },
        accessibility: { value: a11yScore, color: scoreColor(a11yScore) },
        bestPractices: { value: bpScore, color: scoreColor(bpScore) },
      },
      timing: {
        dns: timing.dns,
        tcp: timing.tcp,
        ssl: timing.ssl,
        ttfb: timing.ttfb,
        fcp: timing.fcp,
        lcp: timing.lcp,
        cls: timing.cls,
        dcl: timing.domContentLoaded,
        load: timing.load,
      },
      pageWeight: {
        total: totalWeight,
        totalFormatted: formatBytes(totalWeight),
        html: weightByType.html,
        css: weightByType.css,
        js: weightByType.js,
        image: weightByType.image,
        font: weightByType.font,
        other: weightByType.data + weightByType.other,
        requests: resList.length,
        requestsByType,
      },
      seo: { data: seoData, issues: seoIssues, extras: { h1Text: analysis.h1Text, description: analysis.description, title: analysis.title, ogImage: analysis.ogImage, hasManifest: analysis.hasManifest } },
      accessibility: { data: a11yData, issues: a11yIssues },
      security: { issues: securityIssues },
      performance: { issues: perfIssues },
      images: { list: imageIssues, total: analysis.totalImages, withAlt: a11yData.imagesWithAlt, withDimensions: imageIssues.filter(i => i.hasDimensions).length, nextGen: imageIssues.filter(i => i.isNextGen).length, lazy: imageIssues.filter(i => i.loading === 'lazy').length },
      resources: { topBySize: topResources, total: resList.length },
      meta: { domNodes: analysis.domNodes, charset: analysis.charset, internalLinks: analysis.internalLinks, externalLinks: analysis.externalLinks, totalLinks: analysis.totalLinks, totalScripts: analysis.totalScripts, stylesheets: analysis.stylesheets },
    });
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('Erreur audit:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors de l\'audit' }, { status: 500 });
  }
}
