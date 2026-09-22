'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();

  function goBack() {
    const referrer = document.referrer;
    const internalReferrer = referrer && new URL(referrer).origin === window.location.origin;
    if (internalReferrer && window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Voltar para a tela anterior"
      className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-brand-700 shadow-sm transition active:scale-[.98] dark:border-slate-700 dark:bg-slate-900 dark:text-brand-300"
    >
      <ArrowLeft aria-hidden="true" size={18} />
      Voltar
    </button>
  );
}
