'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#f59e0b';

const TOOLS = ['Box Shadow', 'Border Radius', 'Gradient', 'Text Shadow', 'Animation'];

// ── BOX SHADOW ─────────────────────────────────────────────────────────────
function BoxShadowTool() {
  const [shadows, setShadows] = useState([
    { x: 4, y: 4, blur: 12, spread: 0, color: '#00000033', inset: false }
  ]);
  const [bg, setBg] = useState('#ffffff');
  const pushToast = useToast();

  const update = (i, k, v) => setShadows(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const add = () => setShadows(prev => [...prev, { x: 4, y: 4, blur: 12, spread: 0, color: '#00000033', inset: false }]);
  const remove = (i) => setShadows(prev => prev.filter((_, idx) => idx !== i));

  const css = useMemo(() =>
    shadows.map(s => `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`).join(',\n       '),
  [shadows]);

  const copy = () => { navigator.clipboard.writeText(`box-shadow: ${css};`); pushToast?.('CSS copié !'); };

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#f5f5f5] dark:border-[#1a1a1a] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">Aperçu</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#a3a3a3]">Fond :</span>
            <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0" />
          </div>
        </div>
        <div className="h-40 flex items-center justify-center" style={{ backgroundColor: bg }}>
          <div className="w-24 h-24 rounded-xl bg-white dark:bg-[#171717]" style={{ boxShadow: shadows.map(s => `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`).join(', ') }} />
        </div>
      </div>

      {/* Layers */}
      <div className="space-y-3">
        {shadows.map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#525252] dark:text-[#a3a3a3]">Couche {i + 1}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#a3a3a3]">
                  <input type="checkbox" checked={s.inset} onChange={e => update(i, 'inset', e.target.checked)} className="accent-amber-500" />
                  Inset
                </label>
                {shadows.length > 1 && (
                  <button onClick={() => remove(i)} className="text-[10px] text-red-500 hover:text-red-600">Supprimer</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[['X', 'x', -50, 50], ['Y', 'y', -50, 50], ['Flou', 'blur', 0, 80], ['Étendue', 'spread', -20, 40]].map(([label, key, min, max]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-[#a3a3a3]">{label}</span>
                    <span className="text-[10px] font-mono text-[#525252] dark:text-[#737373]">{s[key]}px</span>
                  </div>
                  <input type="range" min={min} max={max} value={s[key]} onChange={e => update(i, key, +e.target.value)}
                    className="w-full accent-amber-500" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#a3a3a3]">Couleur</span>
              <input type="color" value={s.color.slice(0,7)} onChange={e => update(i, 'color', e.target.value + s.color.slice(7))} className="w-7 h-7 rounded border-0 cursor-pointer" />
              <span className="text-[10px] text-[#a3a3a3] ml-2">Opacité</span>
              <input type="range" min={0} max={1} step={0.01}
                value={parseInt(s.color.slice(7) || 'ff', 16) / 255}
                onChange={e => {
                  const hex = Math.round(+e.target.value * 255).toString(16).padStart(2, '0');
                  update(i, 'color', s.color.slice(0, 7) + hex);
                }}
                className="flex-1 accent-amber-500" />
              <span className="text-[10px] font-mono text-[#525252] dark:text-[#737373] w-8 text-right">
                {Math.round(parseInt(s.color.slice(7) || 'ff', 16) / 255 * 100)}%
              </span>
            </div>
          </div>
        ))}
        <button onClick={add} className="w-full py-2 border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] rounded-xl text-xs text-[#a3a3a3] hover:text-[#737373] hover:border-[#d4d4d4] transition-colors">
          + Ajouter une couche
        </button>
      </div>

      <CssOutput css={`box-shadow: ${css};`} />
    </div>
  );
}

// ── BORDER RADIUS ────────────────────────────────────────────────────────────
function BorderRadiusTool() {
  const [radii, setRadii] = useState({ tl: 16, tr: 16, br: 16, bl: 16 });
  const [linked, setLinked] = useState(true);
  const pushToast = useToast();

  const set = (k, v) => {
    if (linked) setRadii({ tl: v, tr: v, br: v, bl: v });
    else setRadii(r => ({ ...r, [k]: v }));
  };

  const css = radii.tl === radii.tr && radii.tr === radii.br && radii.br === radii.bl
    ? `border-radius: ${radii.tl}px;`
    : `border-radius: ${radii.tl}px ${radii.tr}px ${radii.br}px ${radii.bl}px;`;

  const CORNERS = [['Haut gauche', 'tl'], ['Haut droite', 'tr'], ['Bas droite', 'br'], ['Bas gauche', 'bl']];

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">Aperçu</span>
          <label className="flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#a3a3a3]">
            <input type="checkbox" checked={linked} onChange={e => setLinked(e.target.checked)} className="accent-amber-500" />
            Lier tous
          </label>
        </div>
        <div className="flex items-center justify-center h-36">
          <div className="w-36 h-24 bg-amber-400"
            style={{ borderRadius: `${radii.tl}px ${radii.tr}px ${radii.br}px ${radii.bl}px` }} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {CORNERS.map(([label, key]) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-[#a3a3a3]">{label}</span>
                <span className="text-[10px] font-mono">{radii[key]}px</span>
              </div>
              <input type="range" min={0} max={100} value={radii[key]} onChange={e => set(key, +e.target.value)} className="w-full accent-amber-500" />
            </div>
          ))}
        </div>
      </div>
      <CssOutput css={css} />
    </div>
  );
}

// ── GRADIENT ─────────────────────────────────────────────────────────────────
const GRADIENT_TYPES = ['linear', 'radial', 'conic'];
function GradientTool() {
  const [type, setType]     = useState('linear');
  const [angle, setAngle]   = useState(135);
  const [stops, setStops]   = useState([
    { color: '#6366f1', pos: 0 },
    { color: '#ec4899', pos: 50 },
    { color: '#f59e0b', pos: 100 },
  ]);

  const stopsStr = stops.map(s => `${s.color} ${s.pos}%`).join(', ');
  const gradient = type === 'linear'
    ? `linear-gradient(${angle}deg, ${stopsStr})`
    : type === 'radial'
    ? `radial-gradient(circle, ${stopsStr})`
    : `conic-gradient(from ${angle}deg, ${stopsStr})`;
  const css = `background: ${gradient};`;

  const updateStop = (i, k, v) => setStops(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const addStop = () => setStops(prev => [...prev, { color: '#a3a3a3', pos: 75 }]);
  const removeStop = (i) => stops.length > 2 && setStops(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
        <div className="h-32 w-full" style={{ background: gradient }} />
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            {GRADIENT_TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${type === t ? 'bg-amber-500 text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#737373] dark:text-[#a3a3a3]'}`}>
                {t}
              </button>
            ))}
          </div>
          {(type === 'linear' || type === 'conic') && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-[#a3a3a3]">Angle</span>
                <span className="text-[10px] font-mono">{angle}°</span>
              </div>
              <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(+e.target.value)} className="w-full accent-amber-500" />
            </div>
          )}
          <div className="space-y-2">
            <span className="text-[10px] text-[#a3a3a3] font-semibold">Couleurs</span>
            {stops.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="color" value={s.color} onChange={e => updateStop(i, 'color', e.target.value)} className="w-7 h-7 rounded border-0 cursor-pointer shrink-0" />
                <input type="range" min={0} max={100} value={s.pos} onChange={e => updateStop(i, 'pos', +e.target.value)} className="flex-1 accent-amber-500" />
                <span className="text-[10px] font-mono w-8 text-right">{s.pos}%</span>
                <button onClick={() => removeStop(i)} className="text-[10px] text-red-400 hover:text-red-500">✕</button>
              </div>
            ))}
            <button onClick={addStop} className="text-[10px] text-amber-500 hover:text-amber-600">+ Ajouter une couleur</button>
          </div>
        </div>
      </div>
      <CssOutput css={css} />
    </div>
  );
}

// ── TEXT SHADOW ──────────────────────────────────────────────────────────────
function TextShadowTool() {
  const [x, setX]       = useState(2);
  const [y, setY]       = useState(2);
  const [blur, setBlur] = useState(4);
  const [color, setColor] = useState('#00000088');
  const [text, setText] = useState('Votre texte');
  const [size, setSize] = useState(48);
  const pushToast = useToast();

  const css = `text-shadow: ${x}px ${y}px ${blur}px ${color};`;

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
        <input value={text} onChange={e => setText(e.target.value)}
          className="w-full bg-transparent text-[#171717] dark:text-[#ededed] font-bold text-center focus:outline-none mb-4"
          style={{ fontSize: `${size}px`, textShadow: `${x}px ${y}px ${blur}px ${color}` }} />
        <div className="grid grid-cols-2 gap-3">
          {[['X', x, setX, -20, 20], ['Y', y, setY, -20, 20], ['Flou', blur, setBlur, 0, 30]].map(([label, val, fn, min, max]) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-[#a3a3a3]">{label}</span>
                <span className="text-[10px] font-mono">{val}px</span>
              </div>
              <input type="range" min={min} max={max} value={val} onChange={e => fn(+e.target.value)} className="w-full accent-amber-500" />
            </div>
          ))}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-[#a3a3a3]">Taille texte</span>
              <span className="text-[10px] font-mono">{size}px</span>
            </div>
            <input type="range" min={16} max={96} value={size} onChange={e => setSize(+e.target.value)} className="w-full accent-amber-500" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] text-[#a3a3a3]">Couleur</span>
          <input type="color" value={color.slice(0, 7)} onChange={e => setColor(e.target.value + color.slice(7))} className="w-7 h-7 rounded border-0 cursor-pointer" />
        </div>
      </div>
      <CssOutput css={css} />
    </div>
  );
}

// ── ANIMATION ────────────────────────────────────────────────────────────────
const PRESETS = {
  fadeIn:   { keyframes: '@keyframes fadeIn {\n  from { opacity: 0; }\n  to   { opacity: 1; }\n}', prop: 'animation: fadeIn 0.5s ease forwards;' },
  slideUp:  { keyframes: '@keyframes slideUp {\n  from { transform: translateY(20px); opacity: 0; }\n  to   { transform: translateY(0); opacity: 1; }\n}', prop: 'animation: slideUp 0.4s ease forwards;' },
  pulse:    { keyframes: '@keyframes pulse {\n  0%, 100% { transform: scale(1); }\n  50%       { transform: scale(1.05); }\n}', prop: 'animation: pulse 1.5s ease-in-out infinite;' },
  spin:     { keyframes: '@keyframes spin {\n  from { transform: rotate(0deg); }\n  to   { transform: rotate(360deg); }\n}', prop: 'animation: spin 1s linear infinite;' },
  bounce:   { keyframes: '@keyframes bounce {\n  0%, 100% { transform: translateY(0); }\n  50%       { transform: translateY(-20px); }\n}', prop: 'animation: bounce 0.8s ease-in-out infinite;' },
  shake:    { keyframes: '@keyframes shake {\n  0%, 100% { transform: translateX(0); }\n  25%       { transform: translateX(-8px); }\n  75%       { transform: translateX(8px); }\n}', prop: 'animation: shake 0.5s ease-in-out;' },
};

function AnimationTool() {
  const [preset, setPreset] = useState('fadeIn');
  const [dur, setDur]       = useState(0.5);
  const [delay, setDelay]   = useState(0);
  const [timing, setTiming] = useState('ease');
  const [iter, setIter]     = useState('1');
  const [key, setKey]       = useState(0);
  const pushToast = useToast();

  const TIMINGS = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier(0.34,1.56,0.64,1)'];
  const p = PRESETS[preset];
  const fillMode = iter === 'infinite' ? '' : ' forwards';
  const anim = `${preset} ${dur}s ${timing} ${delay}s ${iter}${fillMode}`;
  const css = `${p.keyframes}\n\n.element {\n  animation: ${anim};\n}`;

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">Animation</span>
          <button onClick={() => setKey(k => k + 1)}
            style={{ backgroundColor: ACCENT }} className="flex items-center gap-1 text-xs text-white px-3 py-1 rounded-lg hover:opacity-90">
            <RefreshCw className="w-3 h-3" /> Rejouer
          </button>
        </div>
        <div className="flex items-center justify-center h-28">
          <div key={key} className="w-16 h-16 rounded-xl bg-amber-400"
            style={{ animation: anim }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-[#a3a3a3] mb-1 block">Preset</span>
            <select value={preset} onChange={e => { setPreset(e.target.value); setKey(k => k + 1); }}
              className="w-full text-xs px-2 py-1.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed]">
              {Object.keys(PRESETS).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <span className="text-[10px] text-[#a3a3a3] mb-1 block">Timing</span>
            <select value={timing} onChange={e => setTiming(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed]">
              {TIMINGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {[['Durée', dur, setDur, 0.1, 3, 0.1, 's'], ['Délai', delay, setDelay, 0, 2, 0.1, 's']].map(([label, val, fn, min, max, step, unit]) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-[#a3a3a3]">{label}</span>
                <span className="text-[10px] font-mono">{val}{unit}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e => fn(+e.target.value)} className="w-full accent-amber-500" />
            </div>
          ))}
          <div>
            <span className="text-[10px] text-[#a3a3a3] mb-1 block">Itérations</span>
            <select value={iter} onChange={e => setIter(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed]">
              {['1', '2', '3', 'infinite'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>
      <CssOutput css={css} />
    </div>
  );
}

// ── SHARED OUTPUT ─────────────────────────────────────────────────────────────
function CssOutput({ css }) {
  const pushToast = useToast();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(css);
    pushToast?.('CSS copié !');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-[#0a0a0a] dark:bg-[#000] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a]">
        <span className="text-[10px] font-mono text-[#525252]">CSS généré</span>
        <button onClick={copy} className="flex items-center gap-1 text-[10px] text-[#737373] hover:text-[#a3a3a3]">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          Copier
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-[#a3a3a3] overflow-auto whitespace-pre-wrap">{css}</pre>
    </div>
  );
}

export default function CssPage() {
  const [tool, setTool] = useState('Box Shadow');

  const TOOL_COMPONENTS = {
    'Box Shadow':    <BoxShadowTool />,
    'Border Radius': <BorderRadiusTool />,
    'Gradient':      <GradientTool />,
    'Text Shadow':   <TextShadowTool />,
    'Animation':     <AnimationTool />,
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Générateur CSS</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Box shadow, gradient, animations et plus</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {TOOLS.map(t => (
            <button key={t} onClick={() => setTool(t)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${tool === t ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:border-[#404040]'}`}
              style={tool === t ? { backgroundColor: ACCENT } : {}}>
              {t}
            </button>
          ))}
        </div>

        {TOOL_COMPONENTS[tool]}
      </main>
    </div>
  );
}
