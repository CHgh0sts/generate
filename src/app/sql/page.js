'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Copy, Check, Download } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#b45309';

const DIALECTS = ['sql', 'mysql', 'postgresql', 'sqlite', 'mariadb', 'bigquery', 'transactsql'];
const INDENT_OPTIONS = [2, 4, 8];

const EXAMPLES = {
  simple: `SELECT u.id,u.name,u.email,COUNT(o.id) as total_orders,SUM(o.amount) as revenue FROM users u LEFT JOIN orders o ON u.id=o.user_id WHERE u.created_at>'2024-01-01' AND u.status='active' GROUP BY u.id,u.name,u.email HAVING COUNT(o.id)>0 ORDER BY revenue DESC LIMIT 50;`,
  create: `CREATE TABLE products (id BIGINT NOT NULL AUTO_INCREMENT,name VARCHAR(255) NOT NULL,description TEXT,price DECIMAL(10,2) NOT NULL DEFAULT 0.00,stock INT NOT NULL DEFAULT 0,category_id INT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (id),INDEX idx_category (category_id),FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL);`,
};

export default function SqlPage() {
  const [input, setInput]     = useState('');
  const [dialect, setDialect] = useState('sql');
  const [indent, setIndent]   = useState(2);
  const [uppercase, setUppercase] = useState(true);
  const [copied, setCopied]   = useState(false);
  const pushToast = useToast();

  const output = useMemo(() => {
    if (!input.trim()) return '';
    // Use dynamic import to avoid SSR issues
    try {
      const { format } = require('sql-formatter');
      return format(input, {
        language: dialect,
        tabWidth: indent,
        keywordCase: uppercase ? 'upper' : 'preserve',
        linesBetweenQueries: 1,
      });
    } catch (e) {
      return `-- Erreur de formatage: ${e.message}`;
    }
  }, [input, dialect, indent, uppercase]);

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true); pushToast?.('SQL copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'formatted.sql'; a.click();
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Formateur SQL</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">MySQL, PostgreSQL, SQLite, BigQuery et plus</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        {/* Options */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-[10px] text-[#a3a3a3] mb-1 block">Dialecte</label>
            <select value={dialect} onChange={e => setDialect(e.target.value)}
              className="px-3 py-1.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-sm bg-white dark:bg-[#171717] text-[#171717] dark:text-[#ededed] capitalize">
              {DIALECTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#a3a3a3] mb-1 block">Indentation</label>
            <div className="flex gap-1">
              {INDENT_OPTIONS.map(n => (
                <button key={n} onClick={() => setIndent(n)}
                  className={`w-9 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${indent === n ? 'text-white border-transparent' : 'border-[#e5e5e5] dark:border-[#262626] text-[#737373]'}`}
                  style={indent === n ? { backgroundColor: ACCENT } : {}}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-4 sm:mt-0">
            <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} style={{ accentColor: ACCENT }} />
            <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">Mots-clés en MAJUSCULES</span>
          </label>
          <div className="flex-1" />
          <div className="flex gap-2">
            {Object.entries(EXAMPLES).map(([key, sql]) => (
              <button key={key} onClick={() => setInput(sql)}
                className="text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded-lg px-2.5 py-1.5 text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] capitalize">
                Exemple {key}
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-[#f5f5f5] dark:border-[#1a1a1a] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3]">SQL brut</span>
              <button onClick={() => setInput('')} className="text-[10px] text-[#a3a3a3] hover:text-[#525252]">Effacer</button>
            </div>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={18}
              placeholder="SELECT * FROM users WHERE..."
              className="flex-1 p-4 text-sm font-mono bg-transparent text-[#171717] dark:text-[#ededed] resize-none focus:outline-none" />
          </div>
          <div className="bg-[#0a0a0a] dark:bg-[#000] rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]">
              <span className="text-xs font-mono text-[#525252]">SQL formaté</span>
              <div className="flex gap-2">
                {output && (
                  <>
                    <button onClick={copy} className="flex items-center gap-1 text-[10px] text-[#737373] hover:text-[#a3a3a3]">
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copier
                    </button>
                    <button onClick={download} className="flex items-center gap-1 text-[10px] text-[#737373] hover:text-[#a3a3a3]">
                      <Download className="w-3 h-3" /> .sql
                    </button>
                  </>
                )}
              </div>
            </div>
            <pre className="flex-1 p-4 text-sm font-mono text-[#a3a3a3] overflow-auto whitespace-pre min-h-[380px]">
              {output || <span className="text-[#404040]">-- Le SQL formaté apparaîtra ici…</span>}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
