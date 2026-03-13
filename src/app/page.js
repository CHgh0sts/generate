'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const groups = [
  {
    label: 'Images',
    tools: [
      { href: '/convert',  color: '#2563eb', title: "Convertisseur d'image",        description: 'Convertissez vos images entre PNG, JPEG, WebP, AVIF, GIF et TIFF.' },
      { href: '/compress', color: '#0891b2', title: "Compresseur d'images",          description: 'Réduisez le poids de vos images JPEG, PNG, WebP et AVIF avec un slider de qualité.' },
      { href: '/resize',   color: '#059669', title: "Redimensionneur d'images",      description: 'Redimensionnez vos images avec dimensions custom, ratio verrouillé et plusieurs modes.' },
    ],
  },
  {
    label: 'Médias',
    tools: [
      { href: '/convert-video', color: '#f97316', title: 'Convertisseur vidéo', description: 'Convertissez vos vidéos entre MP4, WebM, AVI, MOV et GIF. Lecteur intégré.' },
      { href: '/convert-audio', color: '#ec4899', title: 'Convertisseur audio', description: "Convertissez vos fichiers audio entre MP3, WAV, AAC, OGG, FLAC et M4A. Extrayez aussi l'audio d'une vidéo." },
    ],
  },
  {
    label: 'Utilitaires',
    tools: [
      { href: '/generate', color: '#7c3aed', title: 'Générateur QR Code / Data Matrix', description: 'Créez des QR codes, codes-barres (Code 128, EAN, UPC) et Data Matrix. Export PNG ou SVG.' },
      { href: '/password', color: '#ef4444', title: 'Générateur de mots de passe',      description: 'Générez des mots de passe sécurisés avec longueur, jeux de caractères et indicateur de force.' },
      { href: '/base64',   color: '#f59e0b', title: 'Encodeur / Décodeur Base64',        description: 'Encodez ou décodez du texte et des fichiers en Base64 / Data URI, directement dans le navigateur.' },
      { href: '/units',    color: '#6366f1', title: "Convertisseur d'unités",            description: 'Convertissez entre longueur, masse, température, surface, volume et vitesse — toutes unités.' },
      { href: '/pwa',   color: '#0d9488', title: 'Générateur PWA',              description: 'Générez icônes (27 tailles), manifest, service worker et code d\'intégration pour votre PWA.' },
      { href: '/audit', color: '#0ea5e9', title: 'Audit de performance web',   description: 'Analysez vitesse, Core Web Vitals, SEO, images, accessibilité et ressources d\'un site en quelques secondes.' },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-[#171717] dark:text-[#ededed] truncate">
              Generate
            </h1>
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] truncate">Suite d&apos;outils en ligne</p>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-12">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed] mb-2">
            Transformez vos fichiers en quelques clics
          </h2>
          <p className="text-sm text-[#737373] dark:text-[#a3a3a3] max-w-2xl">
            11 outils en ligne : conversion, compression, redimensionnement, génération PWA, audit de performance et utilitaires — tout directement dans votre navigateur.
          </p>
        </section>

        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[#a3a3a3] dark:text-[#737373] mb-3">
                {group.label}
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                        <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed] transition-colors">
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
