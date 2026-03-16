'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';

const ACCENT = '#e11d48';

// ── Color math ────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255 };
}
function rgbToHex({r,g,b}) { return '#' + [r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join(''); }
function rgbToHsl({r,g,b}) {
  const [R,G,B] = [r/255,g/255,b/255];
  const max=Math.max(R,G,B),min=Math.min(R,G,B),l=(max+min)/2,d=max-min;
  if(!d) return {h:0,s:0,l:Math.round(l*100)};
  const s=l>0.5?d/(2-max-min):d/(max+min);
  const h=max===R?(G-B)/d+(G<B?6:0):max===G?(B-R)/d+2:(R-G)/d+4;
  return {h:Math.round(h*60),s:Math.round(s*100),l:Math.round(l*100)};
}
function hslToRgb({h,s,l}) {
  const S=s/100,L=l/100,C=(1-Math.abs(2*L-1))*S,X=C*(1-Math.abs((h/60)%2-1)),m=L-C/2;
  let [r,g,b]=[0,0,0];
  if(h<60)[r,g,b]=[C,X,0];else if(h<120)[r,g,b]=[X,C,0];else if(h<180)[r,g,b]=[0,C,X];
  else if(h<240)[r,g,b]=[0,X,C];else if(h<300)[r,g,b]=[X,0,C];else[r,g,b]=[C,0,X];
  return {r:Math.round((r+m)*255),g:Math.round((g+m)*255),b:Math.round((b+m)*255)};
}
function rgbToCmyk({r,g,b}) {
  const [R,G,B]=[r/255,g/255,b/255];
  const k=1-Math.max(R,G,B);
  if(k===1)return{c:0,m:0,y:0,k:100};
  return{c:Math.round((1-R-k)/(1-k)*100),m:Math.round((1-G-k)/(1-k)*100),y:Math.round((1-B-k)/(1-k)*100),k:Math.round(k*100)};
}
function cmykToRgb({c,m,y,k}) {
  const K=k/100;
  return{r:Math.round(255*(1-c/100)*(1-K)),g:Math.round(255*(1-m/100)*(1-K)),b:Math.round(255*(1-y/100)*(1-K))};
}
function luminance({r,g,b}) {
  const [R,G,B]=[r,g,b].map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});
  return 0.2126*R+0.7152*G+0.0722*B;
}
function contrast(hex1, hex2) {
  const [l1,l2]=[luminance(hexToRgb(hex1)),luminance(hexToRgb(hex2))];
  return Math.round(((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05))*100)/100;
}

function generatePalette(hex) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const variants = [
    {label:'50',  hsl:{...hsl,s:Math.min(100,hsl.s+10),l:97}},
    {label:'100', hsl:{...hsl,s:Math.min(100,hsl.s+5),l:94}},
    {label:'200', hsl:{...hsl,l:87}},
    {label:'300', hsl:{...hsl,l:76}},
    {label:'400', hsl:{...hsl,l:64}},
    {label:'500', hsl:{...hsl}},
    {label:'600', hsl:{...hsl,l:Math.max(0,hsl.l-10)}},
    {label:'700', hsl:{...hsl,l:Math.max(0,hsl.l-20)}},
    {label:'800', hsl:{...hsl,l:Math.max(0,hsl.l-30)}},
    {label:'900', hsl:{...hsl,l:Math.max(0,hsl.l-42)}},
    {label:'950', hsl:{...hsl,l:Math.max(0,hsl.l-50)}},
  ];
  return variants.map(v => ({ label: v.label, hex: rgbToHex(hslToRgb(v.hsl)) }));
}

function generateHarmony(hex, type) {
  const hsl = rgbToHsl(hexToRgb(hex));
  const shifts = type === 'complementary' ? [0,180] : type === 'triadic' ? [0,120,240] : type === 'analogous' ? [0,30,60] : type === 'split' ? [0,150,210] : [0,90,180,270];
  return shifts.map(s => rgbToHex(hslToRgb({...hsl, h: (hsl.h + s) % 360})));
}

export default function ColorsPage() {
  const [tab, setTab]       = useState('convert');
  const [hex, setHex]       = useState('#e11d48');
  const [copied, setCopied] = useState('');
  // Gradient
  const [gColors, setGColors] = useState(['#e11d48','#7c3aed']);
  const [gAngle, setGAngle]   = useState(135);
  const [gType, setGType]     = useState('linear');
  const [harmony, setHarmony] = useState('complementary');

  const copy = (t, id) => navigator.clipboard.writeText(t).then(() => { setCopied(id); setTimeout(() => setCopied(''), 1500); });

  const rgb  = useMemo(() => hexToRgb(hex), [hex]);
  const hsl  = useMemo(() => rgbToHsl(rgb), [rgb]);
  const cmyk = useMemo(() => rgbToCmyk(rgb), [rgb]);
  const palette = useMemo(() => generatePalette(hex), [hex]);
  const harmonyColors = useMemo(() => generateHarmony(hex, harmony), [hex, harmony]);

  const gradientCSS = gType === 'linear'
    ? `linear-gradient(${gAngle}deg, ${gColors.join(', ')})`
    : `radial-gradient(circle, ${gColors.join(', ')})`;

  const TABS = [{id:'convert',label:'Convertisseur'},{id:'palette',label:'Palette'},{id:'harmony',label:'Harmonie'},{id:'gradient',label:'Gradient'}];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Retour" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Outils couleurs</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">HEX, RGB, HSL, CMYK, palette, gradient</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        <div className="flex gap-1 border-b border-[#e5e5e5] dark:border-[#262626]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={tab===t.id?{borderColor:ACCENT,color:ACCENT}:{}}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===t.id?'':'border-transparent text-[#737373] dark:text-[#a3a3a3]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Convert */}
        {tab === 'convert' && (
          <div className="space-y-4">
            {/* Picker */}
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 flex items-center gap-4">
              <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="w-16 h-16 rounded-xl border-0 cursor-pointer bg-transparent p-0" style={{ appearance: 'none' }} />
              <div className="flex-1">
                <div className="h-14 rounded-xl border border-[#e5e5e5] dark:border-[#262626] mb-2" style={{ backgroundColor: hex }} />
                <p className="text-sm font-mono font-semibold text-[#171717] dark:text-[#ededed]">{hex.toUpperCase()}</p>
              </div>
              <div className="text-right text-xs space-y-1">
                <p className="text-[#a3a3a3]">Contraste vs blanc : <strong className="text-[#171717] dark:text-[#ededed]">{contrast(hex,'#ffffff')}:1</strong></p>
                <p className="text-[#a3a3a3]">Contraste vs noir : <strong className="text-[#171717] dark:text-[#ededed]">{contrast(hex,'#000000')}:1</strong></p>
              </div>
            </div>
            {/* Values */}
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: 'HEX',  value: hex.toUpperCase(), id: 'hex' },
                { label: 'RGB',  value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, id: 'rgb' },
                { label: 'HSL',  value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, id: 'hsl' },
                { label: 'CMYK', value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, id: 'cmyk' },
                { label: 'CSS var', value: `--color-primary: ${hex};`, id: 'cssvar' },
                { label: 'Tailwind', value: `[${hex}]`, id: 'tw' },
              ].map(({label, value, id}) => (
                <div key={id} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-[#a3a3a3] mb-0.5">{label}</p>
                    <code className="text-sm font-mono text-[#171717] dark:text-[#ededed]">{value}</code>
                  </div>
                  <button onClick={() => copy(value, id)} style={copied===id?{backgroundColor:'#10b981'}:{backgroundColor:ACCENT}} className="px-2 py-1 text-white text-[10px] font-semibold rounded-md shrink-0">
                    {copied===id?'✓':'Copier'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Palette */}
        {tab === 'palette' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0 bg-transparent" />
              <input value={hex} onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setHex(e.target.value)} className="px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm font-mono bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] w-32" />
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Palette Tailwind-style générée à partir de votre couleur</p>
            </div>
            <div className="grid grid-cols-11 gap-1">
              {palette.map(({label, hex: h}) => (
                <div key={label} className="flex flex-col gap-1 cursor-pointer" onClick={() => copy(h, `p${label}`)}>
                  <div className="h-14 rounded-lg border border-black/5" style={{ backgroundColor: h }} title={h} />
                  <p className="text-center text-[10px] text-[#737373] dark:text-[#a3a3a3]">{label}</p>
                  <p className="text-center text-[9px] font-mono text-[#a3a3a3]">{h}</p>
                  {copied===`p${label}` && <p className="text-center text-[9px] text-emerald-500">✓</p>}
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
              <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-2">Export CSS</p>
              <pre className="text-xs font-mono text-[#525252] dark:text-[#a3a3a3] overflow-x-auto">{`:root {\n${palette.map(({label,hex:h})=>`  --color-${label}: ${h};`).join('\n')}\n}`}</pre>
              <button onClick={() => copy(`:root {\n${palette.map(({label,hex:h})=>`  --color-${label}: ${h};`).join('\n')}\n}`, 'css')} style={copied==='css'?{backgroundColor:'#10b981'}:{backgroundColor:ACCENT}} className="mt-2 px-3 py-1.5 text-white text-xs font-semibold rounded-lg">
                {copied==='css'?'✓ Copié':'Copier CSS'}
              </button>
            </div>
          </div>
        )}

        {/* Harmony */}
        {tab === 'harmony' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0" />
              {['complementary','triadic','analogous','split','tetradic'].map(h => (
                <button key={h} onClick={() => setHarmony(h)} style={harmony===h?{backgroundColor:ACCENT}:{}}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${harmony===h?'text-white border-transparent':'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                  {h === 'complementary' ? 'Complémentaire' : h === 'triadic' ? 'Triadique' : h === 'analogous' ? 'Analogue' : h === 'split' ? 'Split complémentaire' : 'Tétradique'}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              {harmonyColors.map((h, i) => (
                <div key={i} className="flex-1 cursor-pointer" onClick={() => copy(h, `harm${i}`)}>
                  <div className="h-32 rounded-xl border border-black/5 shadow-sm mb-2" style={{ backgroundColor: h }} />
                  <p className="text-center text-xs font-mono text-[#171717] dark:text-[#ededed]">{h.toUpperCase()}</p>
                  <p className="text-center text-[10px] text-[#a3a3a3]">{copied===`harm${i}`?'✓ Copié':'Cliquer pour copier'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gradient */}
        {tab === 'gradient' && (
          <div className="space-y-4">
            <div className="h-40 rounded-xl border border-[#e5e5e5] dark:border-[#262626] shadow-sm" style={{ background: gradientCSS }} />
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-4">
              <div className="flex gap-3 items-center flex-wrap">
                <div className="flex gap-1.5">
                  {['linear','radial'].map(t => (
                    <button key={t} onClick={() => setGType(t)} style={gType===t?{backgroundColor:ACCENT}:{}}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${gType===t?'text-white border-transparent':'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3]'}`}>
                      {t === 'linear' ? 'Linéaire' : 'Radial'}
                    </button>
                  ))}
                </div>
                {gType === 'linear' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#737373]">Angle</label>
                    <input type="range" min={0} max={360} value={gAngle} onChange={e => setGAngle(Number(e.target.value))} className="w-24" style={{ accentColor: ACCENT }} />
                    <span className="text-xs font-mono text-[#171717] dark:text-[#ededed] w-12">{gAngle}°</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-2">Couleurs ({gColors.length})</p>
                <div className="flex flex-wrap gap-2">
                  {gColors.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input type="color" value={c} onChange={e => setGColors(gColors.map((x,j)=>j===i?e.target.value:x))} className="w-8 h-8 rounded border-0 p-0 cursor-pointer" />
                      <button onClick={() => setGColors(gColors.filter((_,j)=>j!==i))} className="text-[#a3a3a3] hover:text-red-500 text-xs">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setGColors([...gColors,'#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')])} style={{color:ACCENT}} className="text-xs font-semibold px-2 py-1 border border-dashed border-current rounded-lg">+ Couleur</button>
                </div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4 relative">
                <code className="text-xs font-mono text-[#ededed] break-all">{`background: ${gradientCSS};`}</code>
                <button onClick={() => copy(`background: ${gradientCSS};`, 'grad')} style={copied==='grad'?{backgroundColor:'#10b981'}:{backgroundColor:ACCENT}} className="absolute top-3 right-3 px-2 py-1 text-white text-[10px] font-semibold rounded">
                  {copied==='grad'?'✓':'Copier'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
