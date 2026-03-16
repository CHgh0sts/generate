'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Check, AlertTriangle, X, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#8b5cf6';

function b64url(str) {
  try {
    return JSON.parse(atob(str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=')));
  } catch { return null; }
}

function parseJWT(token) {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return { error: 'Format invalide — un JWT doit avoir 3 parties séparées par "."' };
  const header  = b64url(parts[0]);
  const payload = b64url(parts[1]);
  if (!header)  return { error: 'Header invalide (base64url malformé)' };
  if (!payload) return { error: 'Payload invalide (base64url malformé)' };
  return { header, payload, signature: parts[2], raw: parts };
}

function timeAgo(ts) {
  const d = Date.now() / 1000 - ts;
  if (Math.abs(d) < 60)   return d > 0 ? `il y a ${Math.round(d)}s` : `dans ${Math.round(-d)}s`;
  if (Math.abs(d) < 3600) return d > 0 ? `il y a ${Math.round(d/60)} min` : `dans ${Math.round(-d/60)} min`;
  if (Math.abs(d) < 86400)return d > 0 ? `il y a ${Math.round(d/3600)}h` : `dans ${Math.round(-d/3600)}h`;
  return d > 0 ? `il y a ${Math.round(d/86400)} jours` : `dans ${Math.round(-d/86400)} jours`;
}

const CLAIMS = {
  iss: 'Issuer — émetteur du token',
  sub: 'Subject — sujet du token (souvent l\'ID utilisateur)',
  aud: 'Audience — destinataires prévus',
  exp: 'Expiration — date d\'expiration (Unix timestamp)',
  nbf: 'Not Before — valide seulement après cette date',
  iat: 'Issued At — date d\'émission',
  jti: 'JWT ID — identifiant unique du token',
};

const EXAMPLES = {
  'HS256': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  'RS256': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJBbGljZSIsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJhZG1pbiIsInVzZXIiXSwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.signature',
};

export default function JwtPage() {
  const [token, setToken]         = useState('');
  const [showRaw, setShowRaw]     = useState(false);
  const pushToast = useToast();

  const result = useMemo(() => token.trim() ? parseJWT(token.trim()) : null, [token]);

  const copy = (text, label = 'Copié') => {
    navigator.clipboard.writeText(text);
    pushToast?.(label);
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = result?.payload?.exp;
  const nbf = result?.payload?.nbf;
  const iat = result?.payload?.iat;
  const isExpired = exp && exp < now;
  const notYetValid = nbf && nbf > now;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Décodeur JWT</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Décodez et inspectez vos JSON Web Tokens</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        {/* Input */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Token JWT</label>
            <div className="flex gap-2">
              {Object.entries(EXAMPLES).map(([alg, tok]) => (
                <button key={alg} onClick={() => setToken(tok)}
                  className="text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded-md px-2 py-1 text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                  Exemple {alg}
                </button>
              ))}
            </div>
          </div>
          <textarea rows={4} value={token} onChange={e => setToken(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature"
            className="w-full px-3 py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-xs font-mono bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] resize-none focus:outline-none focus:ring-2 break-all"
            style={{ '--tw-ring-color': ACCENT }} />
          {token && (
            <div className="flex gap-2 flex-wrap">
              {result && !result.error && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                  <Check className="w-3 h-3" /> JWT valide
                </span>
              )}
              {result?.error && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                  <X className="w-3 h-3" /> {result.error}
                </span>
              )}
              {!result?.error && isExpired && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-3 h-3" /> Expiré {timeAgo(exp)}
                </span>
              )}
              {!result?.error && !isExpired && exp && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                  <Info className="w-3 h-3" /> Expire {timeAgo(exp)}
                </span>
              )}
              {notYetValid && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" /> Pas encore valide
                </span>
              )}
            </div>
          )}
        </div>

        {result && !result.error && (
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Header */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">Header</span>
                </div>
                <button onClick={() => copy(JSON.stringify(result.header, null, 2), 'Header copié')}
                  className="text-[10px] text-[#a3a3a3] hover:text-[#525252] border border-[#e5e5e5] dark:border-[#262626] px-2 py-0.5 rounded">Copier</button>
              </div>
              <div className="p-4">
                {Object.entries(result.header).map(([k, v]) => (
                  <div key={k} className="flex gap-3 py-1.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a] last:border-0">
                    <span className="text-xs font-mono font-semibold text-red-500 w-20 shrink-0">{k}</span>
                    <span className="text-xs font-mono text-[#525252] dark:text-[#a3a3a3] break-all">{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payload */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                  <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">Payload</span>
                </div>
                <button onClick={() => copy(JSON.stringify(result.payload, null, 2), 'Payload copié')}
                  className="text-[10px] text-[#a3a3a3] hover:text-[#525252] border border-[#e5e5e5] dark:border-[#262626] px-2 py-0.5 rounded">Copier</button>
              </div>
              <div className="p-4">
                {Object.entries(result.payload).map(([k, v]) => {
                  const isTime = ['exp','iat','nbf'].includes(k);
                  const date   = isTime ? new Date(v * 1000).toLocaleString('fr-FR') : null;
                  return (
                    <div key={k} className="flex gap-3 py-1.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a] last:border-0">
                      <div className="w-24 shrink-0">
                        <span className="text-xs font-mono font-semibold text-violet-500">{k}</span>
                        {CLAIMS[k] && <p className="text-[9px] text-[#a3a3a3] mt-0.5 leading-tight">{CLAIMS[k].split(' — ')[0]}</p>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-mono text-[#525252] dark:text-[#a3a3a3] break-all">{JSON.stringify(v)}</span>
                        {date && <p className="text-[10px] text-[#737373] mt-0.5">{date} · {timeAgo(v)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Signature */}
            <div className="lg:col-span-2 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">Signature</span>
                <span className="ml-auto text-[10px] text-[#a3a3a3]">Vérification de la signature nécessite la clé secrète — non effectuée ici</span>
              </div>
              <div className="p-4">
                <code className="text-xs font-mono text-sky-500 dark:text-sky-400 break-all">{result.signature}</code>
              </div>
            </div>

            {/* Raw toggle */}
            <div className="lg:col-span-2 bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              <button onClick={() => setShowRaw(!showRaw)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors">
                JSON brut (header + payload)
                {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showRaw && (
                <div className="border-t border-[#f5f5f5] dark:border-[#1a1a1a] p-4 grid sm:grid-cols-2 gap-4">
                  {[['Header', result.header, 'red'], ['Payload', result.payload, 'violet']].map(([label, obj, c]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-semibold text-${c}-500`}>{label}</span>
                        <button onClick={() => copy(JSON.stringify(obj, null, 2))} className="text-[10px] text-[#a3a3a3] hover:text-[#525252] border border-[#e5e5e5] dark:border-[#262626] rounded px-1.5 py-0.5">Copier</button>
                      </div>
                      <pre className="text-[11px] font-mono text-[#525252] dark:text-[#a3a3a3] bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg p-3 overflow-auto max-h-48">
                        {JSON.stringify(obj, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
