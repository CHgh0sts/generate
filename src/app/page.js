import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { HomeSearch } from './HomeSearch';

const groups = [
  {
    label: 'Images',
    tools: [
      { href: '/convert',    color: '#2563eb', title: "Convertisseur d'image",        description: 'PNG, JPEG, WebP, AVIF, GIF, TIFF, ICO, BMP — comparaison avant/après.' },
      { href: '/compress',   color: '#0891b2', title: "Compresseur d'images",          description: 'Réduisez le poids de vos images avec slider de qualité.' },
      { href: '/resize',     color: '#059669', title: "Redimensionneur d'images",      description: 'Redimensionnez, faites pivoter, retournez — aperçu en temps réel.' },
      { href: '/watermark',  color: '#7c3aed', title: 'Filigrane sur image',           description: 'Ajoutez un texte watermark personnalisé — position, opacité, couleur, mode tuilé.' },
    ],
  },
  {
    label: 'Médias',
    tools: [
      { href: '/convert-video', color: '#f97316', title: 'Convertisseur vidéo', description: 'MP4, WebM, AVI, MOV, GIF — lecteur intégré et aperçu.' },
      { href: '/convert-audio', color: '#ec4899', title: 'Convertisseur audio', description: 'MP3, WAV, AAC, OGG, FLAC, M4A — extraction audio de vidéos.' },
    ],
  },
  {
    label: 'Texte & Code',
    tools: [
      { href: '/json',        color: '#16a34a', title: 'JSON Tools',                   description: 'Formatez, validez, minifiez et explorez des données JSON.' },
      { href: '/sql',         color: '#b45309', title: 'Formateur SQL',                description: 'Formatez MySQL, PostgreSQL, SQLite, BigQuery et MariaDB.' },
      { href: '/minify',      color: '#c026d3', title: 'Minify / Beautify',            description: 'Minifiez ou formatez du HTML, CSS, JavaScript et JSON.' },
      { href: '/markdown',    color: '#0369a1', title: 'Éditeur Markdown',             description: "Éditeur split-view avec export HTML/MD et barre d'outils." },
      { href: '/regex',       color: '#9333ea', title: 'Regex Tester',                 description: 'Testez vos expressions régulières avec cheat sheet intégrée.' },
      { href: '/text',        color: '#f472b6', title: 'Outils texte',                 description: 'Lorem ipsum, compteur de mots/caractères, diff de texte.' },
      { href: '/data',        color: '#b45309', title: 'Convertisseur de données',     description: 'CSV↔JSON, JSON↔YAML, validation JSON/YAML/XML.' },
      { href: '/ascii',       color: '#f97316', title: 'ASCII Art Generator',           description: 'Convertissez du texte en ASCII art avec polices et encadrements.' },
      { href: '/html-encode', color: '#db2777', title: 'Encodeur HTML',                description: 'Encodez / décodez les entités HTML — &amp;, &lt;, &gt; et plus.' },
      { href: '/ocr',         color: '#0284c7', title: 'OCR — Image vers texte',       description: 'Extrayez du texte depuis une image · 10 langues · 100% navigateur.' },
    ],
  },
  {
    label: 'Couleurs',
    tools: [
      { href: '/colors',   color: '#e11d48', title: 'Outils couleurs',    description: 'HEX/RGB/HSL/CMYK, palette Tailwind, harmonies, gradient CSS.' },
      { href: '/palette',  color: '#e11d48', title: 'Palette depuis image', description: 'Extrayez les couleurs dominantes d\'une photo — HEX, RGB, HSL.' },
    ],
  },
  {
    label: 'Développement',
    tools: [
      { href: '/hash',      color: '#84cc16', title: 'Générateur de hash',            description: 'MD5, SHA-1, SHA-256, SHA-512, SHA-3, RIPEMD-160 — texte ou fichier.' },
      { href: '/uuid',      color: '#a855f7', title: 'UUID & Timestamp',              description: 'UUID v1/v4, ULID, NanoID et convertisseur Timestamp↔Date.' },
      { href: '/url',       color: '#06b6d4', title: 'Outils URL',                    description: "Encodeur/décodeur URL, analyseur, constructeur et historique." },
      { href: '/cron',      color: '#475569', title: 'Générateur Cron',               description: 'Créez et décodez des expressions cron avec description naturelle.' },
      { href: '/jwt',       color: '#8b5cf6', title: 'Décodeur JWT',                  description: 'Décodez et inspectez vos JSON Web Tokens — header, payload, expiration.' },
      { href: '/css',       color: '#f59e0b', title: 'Générateur CSS',                description: 'Box shadow, border-radius, gradient, text-shadow et animations visuelles.' },
      { href: '/svg',       color: '#10b981', title: 'Optimiseur SVG',                description: 'Réduisez la taille de vos SVG avec SVGO — suppressions, conversions, fusion.' },
      { href: '/ssl',       color: '#16a34a', title: 'Vérificateur SSL',              description: 'Validité, expiration, empreinte et détails du certificat SSL/TLS.' },
      { href: '/robots',    color: '#64748b', title: 'Générateur robots.txt',         description: 'Créez votre robots.txt — Googlebot, Bingbot, GPTBot, Sitemap.' },
      { href: '/bytes',     color: '#0f766e', title: 'Calculateur bits / octets',     description: 'Convertissez KB, MB, GB, TB et calculez les temps de téléchargement.' },
    ],
  },
  {
    label: 'Fichiers',
    tools: [
      { href: '/pdf',      color: '#dc2626', title: 'Outils PDF',        description: 'Fusionnez plusieurs PDF et extrayez des pages — 100% navigateur.' },
      { href: '/img-diff', color: '#7c3aed', title: "Comparaison d'images", description: "Diff pixel par pixel, slider avant/après, côte à côte." },
    ],
  },
  {
    label: 'Utilitaires',
    tools: [
      { href: '/currency',  color: '#16a34a', title: 'Convertisseur de devises',         description: 'Plus de 30 devises · Taux BCE en temps réel · EUR, USD, GBP, MAD…' },
      { href: '/generate',  color: '#7c3aed', title: 'Générateur QR Code / Data Matrix', description: 'QR codes, codes-barres (Code 128, EAN, UPC) et Data Matrix. Export PNG/SVG.' },
      { href: '/qr-reader', color: '#06b6d4', title: 'Lecteur QR Code, Data Matrix & codes-barres', description: 'Décodez QR, Data Matrix, Code 128, EAN, UPC… image ou caméra.' },
      { href: '/ip',        color: '#0ea5e9', title: 'Infos IP / Domaine',               description: "Géolocalisation, ASN, DNS, rDNS et informations réseau d'une IP ou domaine." },
      { href: '/password',  color: '#ef4444', title: 'Générateur de mots de passe',      description: 'Mot de passe & passphrase, historique local, indicateur de force.' },
      { href: '/base64',    color: '#f59e0b', title: 'Encodeur / Décodeur Base64',        description: 'Encodez ou décodez texte et fichiers en Base64 / Data URI.' },
      { href: '/units',     color: '#6366f1', title: "Convertisseur d'unités",            description: 'Longueur, masse, température, surface, volume, vitesse.' },
      { href: '/faker',     color: '#7c3aed', title: 'Données factices',                  description: 'Générez des données de test — noms, emails, adresses · JSON, CSV, SQL.' },
      { href: '/pwa',       color: '#0d9488', title: 'Générateur PWA',                    description: "Icônes, manifest, service worker et code d'intégration pour PWA." },
      { href: '/audit',     color: '#0ea5e9', title: 'Audit de performance web',          description: 'Vitesse, Core Web Vitals, SEO, images, accessibilité et ressources.' },
    ],
  },
];

const totalTools = groups.reduce((s, g) => s + g.tools.length, 0);

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Generate</h1>
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Suite d&apos;outils en ligne</p>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-6 py-12">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed] mb-2">
            Transformez vos fichiers en quelques clics
          </h2>
          <p className="text-sm text-[#737373] dark:text-[#a3a3a3] max-w-2xl">
            {totalTools} outils en ligne : images, médias, texte, couleurs, développement et utilitaires — tout directement dans votre navigateur.
          </p>
        </section>

        <HomeSearch groups={groups} />
      </main>
    </div>
  );
}
