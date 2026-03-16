import { NextResponse } from 'next/server';
import tls from 'tls';

export const runtime = 'nodejs';

function checkSSL(hostname, port = 443) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: hostname, port, servername: hostname, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate(true);
      const authorized = socket.authorized;
      socket.destroy();
      if (!cert || !cert.subject) return reject(new Error('Aucun certificat reçu'));

      const validFrom = new Date(cert.valid_from);
      const validTo   = new Date(cert.valid_to);
      const daysLeft  = Math.floor((validTo - Date.now()) / (1000 * 60 * 60 * 24));

      resolve({
        hostname,
        authorized,
        authError: socket.authorizationError || null,
        subject: {
          CN: cert.subject?.CN,
          O:  cert.subject?.O,
          C:  cert.subject?.C,
        },
        issuer: {
          CN: cert.issuer?.CN,
          O:  cert.issuer?.O,
          C:  cert.issuer?.C,
        },
        serialNumber: cert.serialNumber,
        fingerprint:  cert.fingerprint,
        fingerprint256: cert.fingerprint256,
        validFrom:  validFrom.toISOString(),
        validTo:    validTo.toISOString(),
        daysLeft,
        expired:    daysLeft < 0,
        expireSoon: daysLeft >= 0 && daysLeft < 30,
        san: cert.subjectaltname
          ? cert.subjectaltname.split(', ').map(s => s.replace('DNS:', '').replace('IP:', ''))
          : [],
        version:  cert.version || 3,
        protocol: socket.getProtocol?.() || null,
        cipher:   socket.getCipher?.()?.name || null,
      });
    });
    socket.on('error', reject);
    socket.setTimeout(8000, () => { socket.destroy(); reject(new Error('Timeout')); });
  });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get('host')?.trim();
  if (!host) return NextResponse.json({ error: 'Paramètre host requis' }, { status: 400 });

  const hostname = host.replace(/^https?:\/\//i, '').split('/')[0];
  try {
    const result = await checkSSL(hostname);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
