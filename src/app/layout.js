import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' });

const BASE_URL = 'https://generate.chghosts.fr';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Generate — Suite d\'outils en ligne gratuits',
    template: '%s | Generate',
  },
  description:
    'Suite de 11 outils en ligne gratuits : convertisseur d\'image, vidéo, audio, compresseur, redimensionneur, générateur QR code & Data Matrix, mots de passe, Base64, convertisseur d\'unités, générateur PWA et audit de performance web.',
  keywords: [
    'outils en ligne', 'convertisseur image', 'compresseur image', 'QR code', 'générateur PWA',
    'audit performance web', 'convertisseur vidéo', 'convertisseur audio', 'Base64', 'mots de passe',
    'convertisseur unités', 'gratuit', 'sans inscription',
  ],
  authors: [{ name: 'Generate', url: BASE_URL }],
  creator: 'Generate',
  publisher: 'Generate',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: 'Generate',
    title: 'Generate — Suite d\'outils en ligne gratuits',
    description:
      '11 outils en ligne gratuits : conversion, compression, QR code, générateur PWA, audit de performance et plus — sans inscription.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Generate — Suite d\'outils en ligne' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generate — Suite d\'outils en ligne gratuits',
    description: '11 outils en ligne gratuits : conversion, compression, QR code, audit de performance et plus.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)',  color: '#0a0a0a' },
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Generate',
  url: BASE_URL,
  description:
    'Suite de 11 outils en ligne gratuits : convertisseur d\'image, vidéo, audio, compresseur, redimensionneur, QR code, mots de passe, Base64, unités, générateur PWA et audit de performance web.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  inLanguage: 'fr',
  author: { '@type': 'Organization', name: 'Generate', url: BASE_URL },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&d))document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed]`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#171717] focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
        >
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
