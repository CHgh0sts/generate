'use client';

import { useEffect } from 'react';

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${sizes[size]} bg-white dark:bg-[#171717] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#e5e5e5] dark:border-[#262626] flex flex-col max-h-[90dvh] sm:max-h-[85vh] animate-modal`}
        style={{ animation: 'modal-in 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5] dark:border-[#262626] shrink-0">
          <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {children}
        </div>
      </div>

      <style jsx global>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
