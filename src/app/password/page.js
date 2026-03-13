'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Modal } from '../Modal';

const ACCENT = '#ef4444';

const CHARS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: 'iIlL1oO0',
};

function generatePassword(length, options) {
  let charset = '';
  if (options.upper) charset += CHARS.upper;
  if (options.lower) charset += CHARS.lower;
  if (options.numbers) charset += CHARS.numbers;
  if (options.symbols) charset += CHARS.symbols;
  if (!charset) charset = CHARS.lower;
  if (options.noSimilar) charset = charset.split('').filter((c) => !CHARS.similar.includes(c)).join('');
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (x) => charset[x % charset.length]).join('');
}

function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '', bars: 0 };
  let score = 0;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 20) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500', textColor: 'text-red-500', bars: 1 };
  if (score <= 4) return { score, label: 'Moyen', color: 'bg-yellow-500', textColor: 'text-yellow-500', bars: 2 };
  if (score === 5) return { score, label: 'Fort', color: 'bg-blue-500', textColor: 'text-blue-500', bars: 3 };
  return { score, label: 'Très fort', color: 'bg-green-500', textColor: 'text-green-500', bars: 4 };
}

export default function PasswordPage() {
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(5);
  const [options, setOptions] = useState({ upper: true, lower: true, numbers: true, symbols: false, noSimilar: false });
  const [passwords, setPasswords] = useState([]);
  const [copied, setCopied] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const generate = useCallback(() => {
    const list = Array.from({ length: count }, () => generatePassword(length, options));
    setPasswords(list);
    setCopied(null);
    setModalOpen(true);
  }, [length, count, options]);

  const copyOne = (pwd, idx) => {
    navigator.clipboard.writeText(pwd);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(passwords.join('\n'));
    setCopied('all');
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleOption = (key) => setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  const strength = passwords[0] ? getStrength(passwords[0]) : null;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] shrink-0" aria-label="Retour">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Générateur de mots de passe</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Sécurisé, 100% local</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-5">
            <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-5 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">Longueur</label>
                  <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums">{length}</span>
                </div>
                <input type="range" min={4} max={128} value={length} onChange={(e) => setLength(Number(e.target.value))} style={{ accentColor: ACCENT }} className="w-full cursor-pointer" />
                <div className="flex justify-between text-[10px] text-[#a3a3a3] mt-1"><span>4</span><span>128</span></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-3">Caractères inclus</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'upper', label: 'Majuscules', example: 'A–Z' },
                    { key: 'lower', label: 'Minuscules', example: 'a–z' },
                    { key: 'numbers', label: 'Chiffres', example: '0–9' },
                    { key: 'symbols', label: 'Symboles', example: '!@#…' },
                  ].map(({ key, label, example }) => (
                    <button
                      key={key} onClick={() => toggleOption(key)}
                      style={options[key] ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${options[key] ? 'text-white' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}
                    >
                      <span>{label}</span>
                      <span className={`text-xs font-mono ${options[key] ? 'text-white/60' : 'text-[#a3a3a3]'}`}>{example}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm text-[#171717] dark:text-[#ededed]">Exclure les caractères similaires</p>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">i, I, l, L, 1, o, O, 0</p>
                </div>
                <button
                  onClick={() => toggleOption('noSimilar')}
                  style={options.noSimilar ? { backgroundColor: ACCENT, height: '22px' } : { height: '22px' }}
                  className={`relative w-10 rounded-full transition-colors shrink-0 ${options.noSimilar ? '' : 'bg-[#e5e5e5] dark:bg-[#404040]'}`}
                >
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#0a0a0a] shadow transition-transform" style={{ left: '2px', transform: options.noSimilar ? 'translateX(18px)' : 'translateX(0)' }} />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">Nombre de mots de passe</label>
                  <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums">{count}</span>
                </div>
                <input type="range" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ accentColor: ACCENT }} className="w-full cursor-pointer" />
              </div>
            </div>

            <button
              onClick={generate}
              style={{ backgroundColor: ACCENT }}
              className="w-full py-3 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Générer {count} mot{count > 1 ? 's' : ''} de passe
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-5">
              <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-3">Sécurité</p>
              <ul className="space-y-2 text-xs text-[#525252] dark:text-[#a3a3a3]">
                <li className="flex gap-2"><span className="text-[#a3a3a3]">→</span> Génération 100% locale (crypto.getRandomValues)</li>
                <li className="flex gap-2"><span className="text-[#a3a3a3]">→</span> Aucune donnée n&apos;est envoyée au serveur</li>
                <li className="flex gap-2"><span className="text-[#a3a3a3]">→</span> 16+ caractères recommandés</li>
                <li className="flex gap-2"><span className="text-[#a3a3a3]">→</span> Combinez majuscules, chiffres et symboles</li>
              </ul>
            </div>

            {passwords.length > 0 && (
              <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider">Dernier résultat</p>
                  <button onClick={() => setModalOpen(true)} className="text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors">Voir tout →</button>
                </div>
                {strength && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((b) => (
                        <div key={b} className={`h-1.5 flex-1 rounded-full ${b <= strength.bars ? strength.color : 'bg-[#e5e5e5] dark:bg-[#262626]'}`} />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</span>
                  </div>
                )}
                <code className="text-xs font-mono text-[#171717] dark:text-[#ededed] break-all">{passwords[0]}</code>
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${passwords.length} mot${passwords.length > 1 ? 's' : ''} de passe généré${passwords.length > 1 ? 's' : ''}`} size="lg">
        <div className="space-y-4">
          {strength && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((b) => (
                  <div key={b} className={`h-2 flex-1 rounded-full ${b <= strength.bars ? strength.color : 'bg-[#e5e5e5] dark:bg-[#262626]'}`} />
                ))}
              </div>
              <span className={`text-sm font-medium shrink-0 ${strength.textColor}`}>{strength.label}</span>
              <span className="text-xs text-[#737373] dark:text-[#a3a3a3] shrink-0">{length} caractères</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{passwords.length} mots de passe</p>
            <button onClick={copyAll} className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors">
              {copied === 'all' ? '✓ Tout copié' : 'Tout copier'}
            </button>
          </div>

          <ul className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
            {passwords.map((pwd, idx) => (
              <li key={idx} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#171717] group hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-colors">
                <span className="text-xs text-[#a3a3a3] tabular-nums w-5 shrink-0">{idx + 1}</span>
                <code className="text-sm font-mono text-[#171717] dark:text-[#ededed] break-all flex-1">{pwd}</code>
                <button
                  onClick={() => copyOne(pwd, idx)}
                  className="shrink-0 flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] opacity-0 group-hover:opacity-100 transition-all px-2 py-1 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626]"
                >
                  {copied === idx ? (
                    <><svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copié</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copier</>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => { const list = Array.from({ length: count }, () => generatePassword(length, options)); setPasswords(list); setCopied(null); }}
            className="w-full py-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-medium text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
          >
            Regénérer
          </button>
        </div>
      </Modal>
    </div>
  );
}
