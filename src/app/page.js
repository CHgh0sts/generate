'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const groups = [
  {
    label: 'Images',
    tools: [
      { href: '/convert',  color: '#2563eb', title: "Convertisseur d'image",        description: 'PNG, JPEG, WebP, AVIF, GIF, TIFF, ICO, BMP — conversion instantanée.' },
      { href: '/compress', color: '#0891b2', title: "Compresseur d'images",          description: 'Réduisez le poids de vos images avec slider de qualité.' },
      { href: '/resize',   color: '#059669', title: "Redimensionneur d'images",      description: 'Redimensionnez avec aperçu en temps réel et modes de cadrage.' },
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
      { href: '/json',     color: '#16a34a', title: 'JSON Tools',                   description: 'Formatez, validez, minifiez et explorez des données JSON.' },
      { href: '/markdown', color: '#0369a1', title: 'Éditeur Markdown',              description: 'Éditeur split-view avec export HTML/MD et barre d\'outils.' },
      { href: '/regex',    color: '#9333ea', title: 'Regex Tester',                  description: 'Testez vos expressions régulières avec cheat sheet intégrée.' },
      { href: '/text',     color: '#f472b6', title: 'Outils texte',                  description: 'Lorem ipsum, compteur de mots/caractères, diff de texte.' },
      { href: '/data',     color: '#b45309', title: 'Convertisseur de données',      description: 'CSV↔JSON, JSON↔YAML, validation JSON/YAML/XML.' },
    ],
  },
  {
    label: 'Couleurs',
    tools: [
      { href: '/colors',   color: '#e11d48', title: 'Outils couleurs',               description: 'HEX/RGB/HSL/CMYK, palette Tailwind, harmonies, gradient CSS.' },
    ],
  },
  {
    label: 'Développement',
    tools: [
      { href: '/hash',     color: '#84cc16', title: 'Générateur de hash',            description: 'MD5, SHA-1, SHA-256, SHA-512, SHA-3, RIPEMD-160 — texte ou fichier.' },
      { href: '/uuid',     color: '#a855f7', title: 'UUID & Timestamp',              description: 'UUID v1/v4, ULID, NanoID et convertisseur Timestamp↔Date.' },
      { href: '/url',      color: '#06b6d4', title: 'Outils URL',                    description: 'Encodeur/décodeur URL, analyseur et constructeur de requêtes.' },
      { href: '/cron',     color: '#475569', title: 'Générateur Cron',               description: 'Créez et décodez des expressions cron avec description naturelle.' },
    ],
  },
  {
    label: 'Fichiers',
    tools: [
      { href: '/pdf',      color: '#dc2626', title: 'Outils PDF',                    description: 'Fusionnez plusieurs PDF et extrayez des pages — 100% navigateur.' },
    ],
  },
  {
    label: 'Utilitaires',
    tools: [
      { href: '/generate', color: '#7c3aed', title: 'Générateur QR Code / Data Matrix', description: 'QR codes, codes-barres (Code 128, EAN, UPC) et Data Matrix. Export PNG/SVG.' },
      { href: '/password', color: '#ef4444', title: 'Générateur de mots de passe',       description: 'Mot de passe & passphrase, historique local, indicateur de force.' },
      { href: '/base64',   color: '#f59e0b', title: 'Encodeur / Décodeur Base64',         description: 'Encodez ou décodez texte et fichiers en Base64 / Data URI.' },
      { href: '/units',    color: '#6366f1', title: "Convertisseur d'unités",              description: 'Longueur, masse, température, surface, volume, vitesse.' },
      { href: '/pwa',      color: '#0d9488', title: 'Générateur PWA',                     description: 'Icônes, manifest, service worker et code d\'intégration pour PWA.' },
      { href: '/audit',    color: '#0ea5e9', title: 'Audit de performance web',            description: 'Vitesse, Core Web Vitals, SEO, images, accessibilité et ressources.' },
    ],
  },
];

export default function Home() {
  const totalTools = groups.reduce((s, g) => s + g.tools.length, 0);

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

        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[#a3a3a3] dark:text-[#737373] mb-3">
                {group.label}
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.tools.map((tool) => (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      style={{ '--tool-color': tool.color, borderColor: tool.color + '40' }}
                      className="flex h-full flex-col rounded-xl border bg-white dark:bg-[#171717] p-4 hover:-translate-y-0.5 hover:shadow-md transition-all group"
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = tool.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = tool.color + '40')}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tool.color }} />
                        <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                          {tool.title}
                        </h4>
                      </div>
                      <p className="text-xs text-[#737373] dark:text-[#a3a3a3] flex-1 leading-relaxed pl-4">{tool.description}</p>
                      <span className="mt-3 pl-4 inline-flex items-center text-xs font-medium transition-colors" style={{ color: tool.color }}>
                        Ouvrir <span className="ml-1 text-[10px]">→</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
