'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

let globalToast = null;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);

  const push = useCallback((message, type = 'success', duration = 3000) => {
    const key = ++id.current;
    setToasts(t => [...t, { key, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.key !== key)), duration);
    return key;
  }, []);

  const remove = useCallback((key) => setToasts(t => t.filter(x => x.key !== key)), []);

  // Expose globally
  useEffect(() => { globalToast = push; return () => { globalToast = null; }; }, [push]);

  const icons = {
    success: <Check className="w-4 h-4 text-emerald-500" />,
    error:   <X className="w-4 h-4 text-red-500" />,
    warn:    <AlertTriangle className="w-4 h-4 text-amber-500" />,
    info:    <Info className="w-4 h-4 text-blue-500" />,
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map(t => (
          <div key={t.key}
            className="pointer-events-auto flex items-center gap-3 bg-white dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-lg px-4 py-3 min-w-[240px] max-w-xs text-sm text-[#171717] dark:text-[#ededed] animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {icons[t.type] || icons.info}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button onClick={() => remove(t.key)} className="text-[#a3a3a3] hover:text-[#525252] shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Hook to use inside components */
export function useToast() {
  return useContext(ToastContext);
}

/** Call from anywhere (outside React tree) */
export function toast(message, type = 'success', duration = 3000) {
  globalToast?.(message, type, duration);
}
