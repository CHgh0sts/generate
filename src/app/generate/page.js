'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { ChevronRight } from 'lucide-react';

const defaultParams = {
  value: 'Hello World',
  type: 'qrcode',
  format: 'png',
  width: 500,
  height: 500,
  margin: 1,
  color: '#000000',
  backgroundColor: '#ffffff',
  transparent: false,
  dataMatrixSize: 'auto',
  errorCorrectionLevel: 'M',
  displayValue: true,
  fontSize: 20,
  textAlign: 'center',
  textPosition: 'bottom',
  textMargin: 2,
  textPrefix: '',
  textSuffix: '',
  wifiMode: false,
  wifiSSID: '',
  wifiPassword: '',
  wifiSecurity: 'WPA',
  wifiHidden: false,
  gradientMode: false,
  gradientColors: ['#000000', '#0066cc'],
  gradientDirection: 'horizontal'
};

const ACCENT = '#7c3aed';

const codeTypes = [
  { value: 'qrcode', label: 'QR Code' },
  { value: 'code128', label: 'Code 128' },
  { value: 'code39', label: 'Code 39' },
  { value: 'ean13', label: 'EAN-13' },
  { value: 'ean8', label: 'EAN-8' },
  { value: 'upc', label: 'UPC' },
  { value: 'datamatrix', label: 'Data Matrix' },
];

const formats = [{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' }];
const errorLevels = [{ value: 'L', label: 'L' }, { value: 'M', label: 'M' }, { value: 'Q', label: 'Q' }, { value: 'H', label: 'H' }];
const textAlignments = [{ value: 'left', label: 'Gauche' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Droite' }];
const textPositions = [{ value: 'bottom', label: 'Bas' }, { value: 'top', label: 'Haut' }];
const wifiSecurityTypes = [{ value: 'WPA', label: 'WPA' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'Aucune' }];
const gradientDirections = [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }, { value: 'diagonal-lr', label: 'Diagonal ↘' }, { value: 'diagonal-rl', label: 'Diagonal ↙' }, { value: 'radial', label: 'Radial' }, { value: 'conic', label: 'Conique' }];
const dataMatrixSizes = [{ value: 'auto', label: 'Auto' }, { value: '10', label: '10×10' }, { value: '12', label: '12×12' }, { value: '14', label: '14×14' }, { value: '16', label: '16×16' }, { value: '18', label: '18×18' }, { value: '20', label: '20×20' }, { value: '22', label: '22×22' }, { value: '24', label: '24×24' }];

export default function GeneratePage() {
  const [params, setParams] = useState({ ...defaultParams });
  const [previewUrl, setPreviewUrl] = useState('');
  const [fullApiUrl, setFullApiUrl] = useState('');
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get('value');
    const t = sp.get('type');
    if (v || t) {
      setParams(prev => ({
        ...prev,
        ...(v != null && { value: v }),
        ...(t && ['qrcode','datamatrix','code128','code39','ean13','ean8','upc'].includes(t) && { type: t }),
      }));
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const strValue = (key === 'gradientColors' && Array.isArray(value)) ? value.join(',') : value.toString();
        const defaultVal = defaultParams[key];
        const strDefault = (key === 'gradientColors' && Array.isArray(defaultVal)) ? defaultVal.join(',') : (defaultVal !== undefined && defaultVal !== null ? defaultVal.toString() : undefined);
        if (['value', 'type'].includes(key) || strValue !== strDefault) {
          urlParams.append(key, strValue);
        }
      }
    });
    const downloadApiUrl = `/api/generate?${urlParams.toString()}`;
    const previewParams = new URLSearchParams(urlParams);
    if (params.gradientMode) previewParams.set('format', 'svg');
    setPreviewUrl(`/api/generate?${previewParams.toString()}`);
    if (typeof window !== 'undefined') setFullApiUrl(`${window.location.origin}${downloadApiUrl}`);
  }, [params]);

  const handleParamChange = (key, value) => {
    setParams(prev => {
      const newParams = { ...prev, [key]: value };
      if (key === 'type') {
        const barcodeTypes = ['code128', 'code39', 'ean13', 'ean8', 'upc'];
        const twoDTypes = ['qrcode', 'datamatrix'];
        if (twoDTypes.includes(prev.type) && barcodeTypes.includes(value)) { newParams.width = 200; newParams.height = 100; }
        else if (barcodeTypes.includes(prev.type) && twoDTypes.includes(value)) { newParams.width = 500; newParams.height = 500; }
      }
      return newParams;
    });
  };

  const addGradientColor = () => setParams(prev => ({ ...prev, gradientColors: [...prev.gradientColors, '#ff0000'] }));
  const removeGradientColor = (i) => setParams(prev => ({ ...prev, gradientColors: prev.gradientColors.filter((_, idx) => idx !== i) }));
  const updateGradientColor = (i, c) => setParams(prev => ({ ...prev, gradientColors: prev.gradientColors.map((col, idx) => idx === i ? c : col) }));

  const downloadImage = () => {
    const url = fullApiUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/generate?value=${encodeURIComponent(params.value)}&type=${params.type}` : '#');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${params.type}-${params.value.slice(0, 10)}.${params.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyApiUrl = () => {
    navigator.clipboard.writeText(fullApiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] shrink-0" aria-label="Retour aux outils">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#ededed] truncate">Générateur de codes</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] truncate">QR Code, codes-barres, Data Matrix</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/qr-reader" className="text-xs px-3 py-1.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
              Lire un code
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire principal */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Texte à encoder</label>
              <input
                type="text"
                value={params.value}
                onChange={(e) => handleParamChange('value', e.target.value)}
                placeholder="Ex: Hello World"
                className="w-full px-4 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252] focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252] focus:border-transparent transition-shadow"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Type</label>
                <select
                  value={params.type}
                  onChange={(e) => handleParamChange('type', e.target.value)}
                  className="w-full px-4 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252] focus:border-transparent"
                >
                  {codeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">Format</label>
                <select
                  value={params.format}
                  onChange={(e) => handleParamChange('format', e.target.value)}
                  className="w-full px-4 py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252] focus:border-transparent"
                >
                  {formats.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>

            {/* Options avancées */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-[#737373] dark:text-[#a3a3a3] hover:text-[#404040] dark:hover:text-[#ededed] transition-colors"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                Options avancées
              </button>

              {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-[#e5e5e5] dark:border-[#262626] space-y-4">
                  {/* Dimensions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Largeur</label>
                      <input type="number" value={params.width} onChange={(e) => handleParamChange('width', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252]" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Hauteur</label>
                      <input type="number" value={params.height} onChange={(e) => handleParamChange('height', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm focus:outline-none focus:ring-2 focus:ring-[#404040] dark:focus:ring-[#525252]" />
                    </div>
                  </div>

                  {/* Dégradé */}
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="gradientMode" checked={params.gradientMode} onChange={(e) => handleParamChange('gradientMode', e.target.checked)} className="rounded border-[#e5e5e5] dark:border-[#404040] text-[#404040] dark:text-[#525252] focus:ring-[#404040] dark:focus:ring-[#525252]" />
                    <label htmlFor="gradientMode" className="text-sm text-[#525252] dark:text-[#a3a3a3]">Mode dégradé</label>
                  </div>

                  {/* Couleurs */}
                  {!params.gradientMode ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Couleur</label>
                        <input type="color" value={params.color} onChange={(e) => handleParamChange('color', e.target.value)} className="w-full h-9 border border-[#e5e5e5] dark:border-[#404040] rounded-md cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Fond</label>
                        <input type="color" value={params.backgroundColor} onChange={(e) => handleParamChange('backgroundColor', e.target.value)} disabled={params.transparent} className="w-full h-9 border border-[#e5e5e5] dark:border-[#404040] rounded-md cursor-pointer disabled:opacity-50" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Direction</label>
                        <select value={params.gradientDirection} onChange={(e) => handleParamChange('gradientDirection', e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm">
                          {gradientDirections.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-[#737373] dark:text-[#a3a3a3]">Couleurs</label>
                          <button type="button" onClick={addGradientColor} className="text-xs text-[#404040] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] font-medium">+ Ajouter</button>
                        </div>
                        <div className="space-y-2">
                          {params.gradientColors.map((c, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input type="color" value={c} onChange={(e) => updateGradientColor(i, e.target.value)} className="h-8 w-12 border border-[#e5e5e5] dark:border-[#404040] rounded cursor-pointer" />
                              {params.gradientColors.length > 2 && <button type="button" onClick={() => removeGradientColor(i)} className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] text-sm">×</button>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="transparent" checked={params.transparent} onChange={(e) => handleParamChange('transparent', e.target.checked)} className="rounded border-[#e5e5e5] dark:border-[#404040] text-[#404040] dark:text-[#525252]" />
                    <label htmlFor="transparent" className="text-sm text-[#525252] dark:text-[#a3a3a3]">Fond transparent</label>
                  </div>

                  {params.type !== 'datamatrix' && (
                    <div>
                      <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Marge: {params.margin}px</label>
                      <input type="range" min="0" max="20" value={params.margin} onChange={(e) => handleParamChange('margin', parseInt(e.target.value))} className="w-full" />
                    </div>
                  )}

                  {params.type === 'datamatrix' && (
                    <div>
                      <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Taille matrice</label>
                      <select value={params.dataMatrixSize} onChange={(e) => handleParamChange('dataMatrixSize', e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm">
                        {dataMatrixSizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  )}

                  {/* QR Code */}
                  {params.type === 'qrcode' && (
                    <>
                      <div>
                        <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Correction erreur</label>
                        <select value={params.errorCorrectionLevel} onChange={(e) => handleParamChange('errorCorrectionLevel', e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm">
                          {errorLevels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="wifiMode" checked={params.wifiMode} onChange={(e) => handleParamChange('wifiMode', e.target.checked)} className="rounded border-[#e5e5e5] dark:border-[#404040] text-[#404040] dark:text-[#525252]" />
                        <label htmlFor="wifiMode" className="text-sm text-[#525252] dark:text-[#a3a3a3]">Mode WiFi</label>
                      </div>
                      {params.wifiMode && (
                        <div className="space-y-3 pl-4 border-l-2 border-[#e5e5e5] dark:border-[#262626]">
                          <div>
                            <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">SSID</label>
                            <input type="text" value={params.wifiSSID} onChange={(e) => handleParamChange('wifiSSID', e.target.value)} placeholder="Nom du réseau" className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Sécurité</label>
                            <select value={params.wifiSecurity} onChange={(e) => handleParamChange('wifiSecurity', e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm">
                              {wifiSecurityTypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </div>
                          {params.wifiSecurity !== 'nopass' && (
                            <div className="relative">
                              <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Mot de passe</label>
                              <input type={showWifiPassword ? 'text' : 'password'} value={params.wifiPassword} onChange={(e) => handleParamChange('wifiPassword', e.target.value)} placeholder="Mot de passe" className="w-full px-3 py-2 pr-10 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm" />
                              <button type="button" onClick={() => setShowWifiPassword(!showWifiPassword)} className="absolute right-2 top-8 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed]">
                                {showWifiPassword ? <EyeOffIcon /> : <EyeIcon />}
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="wifiHidden" checked={params.wifiHidden} onChange={(e) => handleParamChange('wifiHidden', e.target.checked)} className="rounded border-[#e5e5e5] dark:border-[#404040] text-[#404040] dark:text-[#525252]" />
                            <label htmlFor="wifiHidden" className="text-sm text-[#525252] dark:text-[#a3a3a3]">Réseau caché</label>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Codes-barres */}
                  {params.type !== 'qrcode' && params.type !== 'datamatrix' && (
                    <>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="displayValue" checked={params.displayValue} onChange={(e) => handleParamChange('displayValue', e.target.checked)} className="rounded border-[#e5e5e5] dark:border-[#404040] text-[#404040] dark:text-[#525252]" />
                        <label htmlFor="displayValue" className="text-sm text-[#525252] dark:text-[#a3a3a3]">Afficher la valeur</label>
                      </div>
                      {params.displayValue && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Préfixe</label>
                            <input type="text" value={params.textPrefix} onChange={(e) => handleParamChange('textPrefix', e.target.value)} placeholder="REF: " className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Suffixe</label>
                            <input type="text" value={params.textSuffix} onChange={(e) => handleParamChange('textSuffix', e.target.value)} placeholder="€, kg" className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Taille police: {params.fontSize}px</label>
                            <input type="range" min="8" max="40" value={params.fontSize} onChange={(e) => handleParamChange('fontSize', parseInt(e.target.value))} className="w-full" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Alignement</label>
                            <select value={params.textAlign} onChange={(e) => handleParamChange('textAlign', e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm">
                              {textAlignments.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-[#737373] dark:text-[#a3a3a3] mb-1">Position</label>
                            <select value={params.textPosition} onChange={(e) => handleParamChange('textPosition', e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] text-sm">
                              {textPositions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Aperçu et actions */}
          <div className="flex flex-col self-start sticky top-8">
            <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-xl p-8 flex items-center justify-center min-h-[280px]">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Aperçu"
                  className="max-w-full max-h-[240px] object-contain"
                  style={{ backgroundColor: !params.gradientMode ? params.backgroundColor : 'transparent', padding: 12, borderRadius: 8 }}
                />
              ) : (
                <p className="text-[#a3a3a3] dark:text-[#525252] text-sm">Aperçu</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={downloadImage}
                style={{ backgroundColor: ACCENT }}
                className="flex-1 py-3 px-4 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Télécharger
              </button>
              <button
                onClick={copyApiUrl}
                className={`flex-1 py-3 px-4 border rounded-lg text-sm font-medium transition-colors ${copied ? 'border-[#404040] dark:border-[#525252] bg-[#f5f5f5] dark:bg-[#262626] text-[#171717] dark:text-[#ededed]' : 'border-[#e5e5e5] dark:border-[#404040] text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]'}`}
              >
                {copied ? 'Copié !' : "Copier l'URL"}
              </button>
            </div>

            <div className="mt-6">
              <label className="block text-xs font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">URL API</label>
              <div className="bg-[#f5f5f5] dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg p-3 font-mono text-xs text-[#525252] dark:text-[#a3a3a3] break-all">
                {fullApiUrl || '—'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  );
}
