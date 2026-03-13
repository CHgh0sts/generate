import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "Generate — Suite d'outils en ligne gratuits";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  const tools = [
    'Convertisseur image', 'Compresseur', 'Redimensionneur',
    'Convertisseur vidéo', 'Convertisseur audio', 'QR Code / Data Matrix',
    'Mots de passe', 'Base64', 'Unités', 'Générateur PWA', 'Audit web',
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: '#0a0a0a', padding: '64px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#0ea5e9' }} />
          <span style={{ color: '#a3a3a3', fontSize: 18, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            generate.chghosts.fr
          </span>
        </div>

        {/* Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ color: '#ededed', fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
            Generate
          </div>
          <div style={{ color: '#737373', fontSize: 28, fontWeight: 400, maxWidth: 700, lineHeight: 1.4 }}>
            Suite de 11 outils en ligne gratuits — sans inscription
          </div>
        </div>

        {/* Tool pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {tools.map((tool) => (
            <div
              key={tool}
              style={{
                padding: '6px 14px', borderRadius: 20,
                background: '#171717', border: '1px solid #262626',
                color: '#a3a3a3', fontSize: 14,
              }}
            >
              {tool}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
