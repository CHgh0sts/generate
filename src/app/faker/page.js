'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { RefreshCw, Copy, Check, Download } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#7c3aed';

// ── Data pools ────────────────────────────────────────────────────────────────
const FIRST_NAMES = ['Alice','Bob','Charlie','Diana','Emma','François','Gabriel','Hélène','Ibrahim','Julie','Karim','Laura','Marc','Nina','Oscar','Pauline','Quentin','Rachel','Samuel','Théo','Ursula','Victor','Wendy','Xavier','Yasmina','Zoé','Liam','Noah','Olivia','Ava','Elijah','Isabella'];
const LAST_NAMES  = ['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Garcia','David','Bertrand','Roux','Vincent','Fournier','Morin','Girard','André','Mercier','Dupont','Blanc','Guerin','Boyer','Garnier'];
const DOMAINS     = ['gmail.com','yahoo.fr','hotmail.com','outlook.fr','proton.me','icloud.com','free.fr','sfr.fr','orange.fr','example.com'];
const COMPANIES   = ['TechCorp','WebSolutions','DataLab','DevStudio','CloudBase','NexGen','Innovatech','PixelForge','SoftWave','CodeHive','AlphaSys','BetaLab'];
const CITIES      = ['Paris','Lyon','Marseille','Toulouse','Nice','Nantes','Strasbourg','Montpellier','Bordeaux','Rennes','Grenoble','Lille','Dijon','Tours','Angers'];
const LOREM       = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ');
const TLDS        = ['fr','com','net','org','io','dev','app'];
const COUNTRIES   = ['France','Allemagne','Espagne','Italie','Belgique','Suisse','Canada','Maroc','Algérie','Tunisie'];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndBool() { return Math.random() > 0.5; }

const FIELDS = {
  firstName:  { label: 'Prénom',         gen: () => rnd(FIRST_NAMES) },
  lastName:   { label: 'Nom',            gen: () => rnd(LAST_NAMES) },
  fullName:   { label: 'Nom complet',    gen: () => `${rnd(FIRST_NAMES)} ${rnd(LAST_NAMES)}` },
  email:      { label: 'Email',          gen: (i, row) => `${(row?.firstName||rnd(FIRST_NAMES)).toLowerCase().replace(/ /g,'.')}.${(row?.lastName||rnd(LAST_NAMES)).toLowerCase().replace(/ /g,'.')}${rndInt(1,99)}@${rnd(DOMAINS)}` },
  phone:      { label: 'Téléphone',      gen: () => `0${rndInt(6,7)} ${[...Array(4)].map(() => rndInt(10,99).toString()).join(' ')}` },
  address:    { label: 'Adresse',        gen: () => `${rndInt(1,200)} rue ${rnd(['de la Paix','du Commerce','Victor Hugo','Jean Jaurès','de la République','Pasteur','Gambetta'])}` },
  city:       { label: 'Ville',          gen: () => rnd(CITIES) },
  postalCode: { label: 'Code postal',    gen: () => `${rndInt(10,95)}${rndInt(100,999)}` },
  country:    { label: 'Pays',           gen: () => rnd(COUNTRIES) },
  company:    { label: 'Entreprise',     gen: () => rnd(COMPANIES) },
  jobTitle:   { label: 'Poste',          gen: () => rnd(['Développeur','Designer','Chef de projet','Analyste','Consultant','Directeur','Ingénieur','Commercial','Comptable','Juriste']) },
  username:   { label: "Nom d'utilisateur", gen: () => `${rnd(FIRST_NAMES).toLowerCase()}${rndInt(10,999)}` },
  password:   { label: 'Mot de passe',   gen: () => [...Array(12)].map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'[rndInt(0,64)]).join('') },
  uuid:       { label: 'UUID',           gen: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); }) },
  age:        { label: 'Âge',            gen: () => rndInt(18, 75).toString() },
  birthDate:  { label: 'Date de naissance', gen: () => new Date(Date.now() - rndInt(18,75)*365.25*24*3600*1000).toLocaleDateString('fr-FR') },
  website:    { label: 'Site web',       gen: () => `https://www.${rnd(COMPANIES).toLowerCase()}.${rnd(TLDS)}` },
  text:       { label: 'Texte (lorem)',  gen: () => [...Array(rndInt(6,15))].map(() => rnd(LOREM)).join(' ') + '.' },
  boolean:    { label: 'Booléen',        gen: () => rndBool().toString() },
  number:     { label: 'Nombre',         gen: () => rndInt(1, 10000).toString() },
  price:      { label: 'Prix',           gen: () => (rndInt(1,999) + Math.random()).toFixed(2) + ' €' },
  color:      { label: 'Couleur hex',    gen: () => '#' + [...Array(6)].map(() => '0123456789ABCDEF'[rndInt(0,15)]).join('') },
};

const FORMATS = ['json', 'csv', 'sql'];

export default function FakerPage() {
  const [count, setCount]     = useState(5);
  const [format, setFormat]   = useState('json');
  const [selected, setSelected] = useState(['fullName','email','phone','city','company']);
  const [data, setData]       = useState(null);
  const [copied, setCopied]   = useState(false);
  const pushToast = useToast();

  const toggle = (f) => setSelected(prev =>
    prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
  );

  function generate() {
    const rows = Array.from({ length: count }, () => {
      const row = {};
      const fn = FIELDS.firstName.gen();
      const ln = FIELDS.lastName.gen();
      selected.forEach(f => {
        if (f === 'email') row[f] = `${fn.toLowerCase()}.${ln.toLowerCase()}${rndInt(1,99)}@${rnd(DOMAINS)}`;
        else row[f] = FIELDS[f].gen();
      });
      return row;
    });
    setData(rows);
  }

  const output = useMemo(() => {
    if (!data) return '';
    if (format === 'json') return JSON.stringify(data, null, 2);
    if (format === 'csv') {
      const keys = selected;
      return [keys.join(','), ...data.map(r => keys.map(k => `"${(r[k]||'').replace(/"/g,'""')}"`).join(','))].join('\n');
    }
    if (format === 'sql') {
      const table = 'users';
      const keys = selected;
      return data.map(r =>
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(k => `'${(r[k]||'').replace(/'/g,"''")}'`).join(', ')});`
      ).join('\n');
    }
    return '';
  }, [data, format, selected]);

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true); pushToast?.('Copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'sql';
    const blob = new Blob([output], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `fake-data.${ext}`; a.click();
  };

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
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Générateur de données factices</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Noms, emails, adresses, UUIDs — JSON, CSV, SQL</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        <div className="grid lg:grid-cols-[260px_1fr] gap-5">
          {/* Sidebar config */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
              <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] mb-3">Champs</p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {Object.entries(FIELDS).map(([key, { label }]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] rounded px-1 py-0.5">
                    <input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} className="rounded" style={{ accentColor: ACCENT }} />
                    <span className="text-xs text-[#525252] dark:text-[#a3a3a3]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">Nombre de lignes</span>
                  <span className="text-xs font-mono font-bold" style={{ color: ACCENT }}>{count}</span>
                </div>
                <input type="range" min={1} max={100} value={count} onChange={e => setCount(+e.target.value)} className="w-full" style={{ accentColor: ACCENT }} />
              </div>
              <div>
                <span className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-2 block">Format</span>
                <div className="flex gap-1">
                  {FORMATS.map(f => (
                    <button key={f} onClick={() => setFormat(f)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium uppercase border transition-colors ${format === f ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#737373]'}`}
                      style={format === f ? { backgroundColor: ACCENT } : {}}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={generate} disabled={selected.length === 0}
                style={{ backgroundColor: ACCENT }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40">
                <RefreshCw className="w-4 h-4" /> Générer
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a]">
              <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] flex-1">
                {data ? `${data.length} enregistrements · ${output.length} caractères` : 'Résultat'}
              </span>
              {output && (
                <>
                  <button onClick={copy} className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copier
                  </button>
                  <button onClick={download} className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                    <Download className="w-3 h-3" /> Télécharger
                  </button>
                </>
              )}
            </div>
            <pre className="flex-1 p-4 text-xs font-mono text-[#525252] dark:text-[#a3a3a3] overflow-auto min-h-[400px] whitespace-pre-wrap">
              {output || <span className="text-[#a3a3a3]">Sélectionnez des champs et cliquez sur Générer…</span>}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
