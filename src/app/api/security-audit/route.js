import { NextResponse } from 'next/server';
import tls from 'tls';

export const maxDuration = 90;
export const runtime = 'nodejs';

const UA = 'Mozilla/5.0 (compatible; SecurityAudit/1.0)';

function parseUrl(raw) {
  let url = raw.trim();
  if (!url.startsWith('http')) url = 'https://' + url;
  try {
    const u = new URL(url);
    return { url: u.href, origin: u.origin, hostname: u.hostname };
  } catch {
    return null;
  }
}

function sameOrigin(url, baseOrigin) {
  try {
    const u = new URL(url, baseOrigin);
    return u.origin === baseOrigin || u.hostname.endsWith(new URL(baseOrigin).hostname.replace(/^www\./, ''));
  } catch {
    return false;
  }
}

function normalizeUrl(u, base) {
  try {
    const url = new URL(u, base);
    return url.origin + url.pathname + (url.search || '');
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 8000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: ctrl.signal,
      ...opts,
    });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

function checkSSL(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate(true);
      const authorized = socket.authorized;
      socket.destroy();
      if (!cert || !cert.subject) return resolve({ error: 'Aucun certificat' });
      const validTo = new Date(cert.valid_to);
      const daysLeft = Math.floor((validTo - Date.now()) / (1000 * 60 * 60 * 24));
      resolve({
        ok: authorized && daysLeft > 0,
        authorized,
        daysLeft,
        expired: daysLeft < 0,
        expireSoon: daysLeft >= 0 && daysLeft < 30,
        issuer: cert.issuer?.CN,
        protocol: socket.getProtocol?.() || null,
      });
    });
    socket.on('error', () => resolve({ error: 'Erreur SSL' }));
    socket.setTimeout(6000, () => { socket.destroy(); resolve({ error: 'Timeout' }); });
  });
}

export async function POST(req) {
  try {
    const { url: rawUrl } = await req.json();
    if (!rawUrl) return NextResponse.json({ error: 'URL requise' }, { status: 400 });

    const parsed = parseUrl(rawUrl);
    if (!parsed) return NextResponse.json({ error: 'URL invalide' }, { status: 400 });

    const { url, origin, hostname } = parsed;
    const discoveredUrls = new Set([url]);
    const findings = [];
    const urlsToTest = [];

    // ── 1. Crawl pour découvrir les URLs ──
    try {
      const res = await fetchWithTimeout(url, { method: 'GET' });
      const html = await res.text();
      const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
      let m;
      while ((m = linkRegex.exec(html)) !== null) {
        const href = m[1].trim();
        if (href.startsWith('#') || href.startsWith('javascript:')) continue;
        const norm = normalizeUrl(href, url);
        if (norm && sameOrigin(norm, origin)) {
          const u = new URL(norm);
          const path = u.pathname.replace(/\/$/, '') || '/';
          const clean = u.origin + path;
          discoveredUrls.add(clean);
          if (discoveredUrls.size >= 80) break;
        }
      }
      // Also extract from <img src>, <script src>, <link href>
      const srcRegex = /(?:src|href)=["']([^"']+)["']/gi;
      while ((m = srcRegex.exec(html)) !== null) {
        const norm = normalizeUrl(m[1], url);
        if (norm && sameOrigin(norm, origin)) {
          const u = new URL(norm);
          discoveredUrls.add(u.origin + (u.pathname.replace(/\/$/, '') || '/'));
          if (discoveredUrls.size >= 80) break;
        }
      }
    } catch (e) {
      findings.push({ severity: 'critical', category: 'connexion', url, title: 'Impossible de charger la page', description: e.message, remediation: 'Vérifiez que le site est accessible et que le serveur répond.' });
    }

    // Limiter à 30 URLs pour les tests
    urlsToTest.push(...[...discoveredUrls].slice(0, 30));

    // ── 2. Test SSL ──
    const ssl = await checkSSL(hostname);
    if (ssl.error) {
      findings.push({ severity: 'critical', category: 'ssl', url: `https://${hostname}`, title: 'Erreur SSL/TLS', description: ssl.error, remediation: 'Vérifiez que le certificat est correctement installé et que le port 443 est ouvert.' });
    } else if (ssl.expired) {
      findings.push({ severity: 'critical', category: 'ssl', url: `https://${hostname}`, title: 'Certificat SSL expiré', description: `Le certificat a expiré depuis ${-ssl.daysLeft} jours.`, remediation: 'Renouvelez le certificat SSL auprès de votre émetteur (Let\'s Encrypt, etc.) et redéployez.' });
    } else if (ssl.expireSoon) {
      findings.push({ severity: 'high', category: 'ssl', url: `https://${hostname}`, title: 'Certificat SSL expire bientôt', description: `Expire dans ${ssl.daysLeft} jours.`, remediation: 'Renouvelez le certificat avant expiration pour éviter les coupures.' });
    } else if (!ssl.authorized) {
      findings.push({ severity: 'high', category: 'ssl', url: `https://${hostname}`, title: 'Certificat SSL non vérifié', description: 'Le certificat n\'est pas signé par une autorité reconnue.', remediation: 'Utilisez un certificat émis par une CA reconnue (Let\'s Encrypt, DigiCert, etc.).' });
    }

    // ── 3. Fichiers sensibles à tester ──
    const sensitivePaths = [
      '/.git/HEAD', '/.git/config', '/.env', '/.env.local', '/.env.production',
      '/wp-config.php', '/config.php', '/backup.sql', '/backup.zip', '/.htaccess',
      '/phpinfo.php', '/admin', '/administrator', '/.gitignore',
      '/.DS_Store', '/web.config', '/crossdomain.xml',
    ];

    for (const path of sensitivePaths) {
      try {
        const u = origin + path;
        const res = await fetchWithTimeout(u, { method: 'GET' });
        if (res.ok && res.status === 200) {
          const body = await res.text();
          const ct = (res.headers.get('content-type') || '').toLowerCase();
          const is404Page = ct.includes('text/html') && body.length > 500 && (body.includes('404') || body.includes('not found') || body.includes('Not Found'));
          if (!is404Page) {
            findings.push({
              severity: 'critical',
              category: 'fichiers_sensibles',
              url: u,
              title: `Fichier sensible exposé : ${path}`,
              description: `Le fichier ${path} est accessible (HTTP ${status}).`,
              remediation: path.startsWith('/.git') ? 'Supprimez le dossier .git du déploiement ou bloquez l\'accès via .htaccess/nginx.' :
                path.includes('.env') ? 'Ne déployez jamais les fichiers .env. Ajoutez-les au .gitignore et utilisez des variables d\'environnement.' :
                  path.includes('config') ? 'Protégez les fichiers de configuration par des règles serveur ou déplacez-les hors de la racine web.' :
                    'Bloquez l\'accès à ce fichier via la configuration serveur (nginx, Apache, etc.).',
            });
          }
        }
      } catch {
        // Ignore
      }
    }

    // ── 4. Headers de sécurité sur les URLs principales ──
    const headerChecks = [
      { name: 'Strict-Transport-Security', key: 'strict-transport-security', desc: 'HSTS', remediation: 'Ajoutez : Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' },
      { name: 'X-Content-Type-Options', key: 'x-content-type-options', desc: 'X-Content-Type-Options', remediation: 'Ajoutez : X-Content-Type-Options: nosniff' },
      { name: 'X-Frame-Options', key: 'x-frame-options', desc: 'X-Frame-Options', remediation: 'Ajoutez : X-Frame-Options: DENY ou SAMEORIGIN' },
      { name: 'X-XSS-Protection', key: 'x-xss-protection', desc: 'X-XSS-Protection (legacy)', remediation: 'X-XSS-Protection: 1; mode=block (ou remplacez par CSP)' },
      { name: 'Content-Security-Policy', key: 'content-security-policy', desc: 'CSP', remediation: 'Définissez une Content-Security-Policy stricte pour limiter les sources de scripts et ressources.' },
      { name: 'Referrer-Policy', key: 'referrer-policy', desc: 'Referrer-Policy', remediation: 'Ajoutez : Referrer-Policy: strict-origin-when-cross-origin' },
      { name: 'Permissions-Policy', key: 'permissions-policy', desc: 'Permissions-Policy', remediation: 'Ajoutez : Permissions-Policy: geolocation=(), microphone=(), camera=()' },
    ];

    const testedUrls = new Set();
    for (const testUrl of urlsToTest.slice(0, 10)) {
      if (testedUrls.has(testUrl)) continue;
      testedUrls.add(testUrl);
      try {
        const res = await fetchWithTimeout(testUrl, { method: 'HEAD' });
        const headers = Object.fromEntries([...res.headers.entries()].map(([k, v]) => [k.toLowerCase(), v]));

        for (const { name, key, desc, remediation } of headerChecks) {
          const val = headers[key] || headers[name.toLowerCase()];
          if (!val) {
            findings.push({
              severity: 'medium',
              category: 'headers',
              url: testUrl,
              title: `Header manquant : ${desc}`,
              description: `Le header ${name} n'est pas défini.`,
              remediation,
            });
          } else if (key === 'strict-transport-security' && !val.includes('max-age')) {
            findings.push({ severity: 'medium', category: 'headers', url: testUrl, title: 'HSTS mal configuré', description: `Valeur actuelle : ${val}`, remediation });
          } else if (key === 'x-content-type-options' && val.toLowerCase() !== 'nosniff') {
            findings.push({ severity: 'medium', category: 'headers', url: testUrl, title: 'X-Content-Type-Options incorrect', description: `Valeur : ${val}`, remediation });
          }
        }

        // Server / X-Powered-By disclosure
        const server = headers['server'] || headers['x-powered-by'];
        if (server) {
          findings.push({
            severity: 'low',
            category: 'headers',
            url: testUrl,
            title: 'Information disclosure',
            description: `Le serveur expose : ${server}`,
            remediation: 'Masquez les headers Server et X-Powered-By pour éviter de révéler la version du serveur.',
          });
        }
      } catch {
        // Skip
      }
    }

    // ── 5. HTTP vs HTTPS ──
    if (url.startsWith('https://')) {
      try {
        const httpUrl = 'http://' + hostname + '/';
        const res = await fetchWithTimeout(httpUrl, { method: 'HEAD' });
        const finalUrl = res.url || httpUrl;
        const stayedOnHttp = finalUrl.startsWith('http://') && (res.ok || res.status < 400);
        if (stayedOnHttp) {
          findings.push({
            severity: 'high',
            category: 'https',
            url: httpUrl,
            title: 'HTTP accessible',
            description: 'Le site peut être accessible en HTTP non sécurisé.',
            remediation: 'Redirigez toutes les requêtes HTTP vers HTTPS (301) et activez HSTS.',
          });
        }
      } catch {
        // OK
      }
    } else {
      findings.push({
        severity: 'critical',
        category: 'https',
        url,
        title: 'Connexion non sécurisée',
        description: 'Le site utilise HTTP au lieu de HTTPS.',
        remediation: 'Installez un certificat SSL et forcez HTTPS.',
      });
    }

    // ── 6. Cookies (sur la page principale) ──
    try {
      const res = await fetchWithTimeout(url, { method: 'GET' });
      const setCookie = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
      if (setCookie?.length) {
        const cookies = setCookie;
        for (const c of cookies) {
          const ck = c.split(';')[0];
          const hasSecure = /;\s*secure/i.test(c);
          const hasHttpOnly = /;\s*httponly/i.test(c);
          const hasSameSite = /;\s*samesite/i.test(c);
          if (!hasSecure) {
            findings.push({
              severity: 'medium',
              category: 'cookies',
              url,
              title: 'Cookie sans Secure',
              description: `Cookie : ${ck.slice(0, 40)}...`,
              remediation: 'Ajoutez le flag Secure à tous les cookies pour qu\'ils ne soient envoyés qu\'en HTTPS.',
            });
          }
          if (!hasHttpOnly) {
            findings.push({
              severity: 'medium',
              category: 'cookies',
              url,
              title: 'Cookie sans HttpOnly',
              description: `Cookie : ${ck.slice(0, 40)}...`,
              remediation: 'Ajoutez HttpOnly aux cookies de session pour éviter les attaques XSS.',
            });
          }
        }
      }
    } catch {
      // Ignore
    }

    // ── 7. CORS (test rapide) ──
    try {
      const res = await fetchWithTimeout(url, {
        method: 'OPTIONS',
        headers: { 'Origin': 'https://evil.example.com', 'Access-Control-Request-Method': 'GET' },
      });
      const acao = res.headers.get('access-control-allow-origin');
      if (acao === '*') {
        findings.push({
          severity: 'medium',
          category: 'cors',
          url,
          title: 'CORS trop permissif',
          description: 'Access-Control-Allow-Origin: * permet à tous les domaines d\'accéder aux ressources.',
          remediation: 'Restreignez CORS à des domaines spécifiques de confiance.',
        });
      } else if (acao && acao !== origin) {
        findings.push({
          severity: 'low',
          category: 'cors',
          url,
          title: 'CORS configuré',
          description: `Origin autorisée : ${acao}`,
          remediation: 'Vérifiez que seuls les domaines légitimes sont autorisés.',
        });
      }
    } catch {
      // Ignore
    }

    // Dédupliquer les findings par type
    const seen = new Set();
    const uniqueFindings = findings.filter(f => {
      const key = `${f.category}:${f.title}:${f.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    uniqueFindings.forEach(f => { if (bySeverity[f.severity] !== undefined) bySeverity[f.severity]++; });

    return NextResponse.json({
      url,
      origin,
      hostname,
      auditedAt: new Date().toISOString(),
      discoveredUrls: [...discoveredUrls].sort(),
      findings: uniqueFindings,
      summary: bySeverity,
      ssl: ssl.error ? null : ssl,
    });
  } catch (err) {
    console.error('Audit sécurité:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors de l\'audit' }, { status: 500 });
  }
}
